

// scripts/multiHopArb.js
const hre = require("hardhat");
const { ethers } = hre;
const abis = require("../utils/abis.cjs");
const addresses = require("../utils/addresses.cjs");

/// Helper: impersonate an account (whale)
async function impersonate(account) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [account],
  });
  return await ethers.getSigner(account);
}

/// Helper: get reserves from a UniswapV2 pair
async function getReserves(pair) {
  const [reserve0, reserve1] = await pair.getReserves();
  return { reserve0, reserve1 };
}

/// Helper: log pool state
async function logPoolState(pair, token0, token1, label = "") {
  const reserves = await getReserves(pair);
  console.log(`\n[POOL STATE] ${label}`);
  console.log(`Pair: ${await pair.getAddress()}`);
  console.log(
    `Reserves: ${await token0.symbol()}=${ethers.formatUnits(
      reserves.reserve0,
      await token0.decimals()
    )}, ${await token1.symbol()}=${ethers.formatUnits(
      reserves.reserve1,
      await token1.decimals()
    )}`
  );
}

/// Compute amountsOut for a path and optionally estimate gas cost for performing the swap
async function getAmountsOutAndGasEstimate(router, signer, amountIn, path) {
  // amountsOut: BigInt[] matching path length
  const amountsOut = await router.getAmountsOut(amountIn, path);

  // try to estimate gas for swapExactTokensForTokens; if it fails, ignore gas estimate
  let gasEstimate = null;
  try {
    // build parameters similar to actual call
    const to = await signer.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

    // Note: estimateGas requires connected contract
    const routerConnected = router.connect(signer);

    gasEstimate = await routerConnected.estimateGas.swapExactTokensForTokens(
      amountIn,
      0,
      path,
      to,
      deadline
    );
    // gasEstimate is BigInt
  } catch (err) {
    // estimation might fail for some reason; we'll ignore
    gasEstimate = null;
  }

  return { amountsOut, gasEstimate };
}

/// find best path among candidate paths
/// - paths: array of arrays (each inner array = token addresses path)
/// - amountIn: BigInt (raw amount for input token)
/// - router: router contract
/// - signer: signer for estimateGas & address
/// - finalTokenDecimals: number -> decimals of final token so we can display human profit
async function findBestPath(paths, amountIn, router, signer, finalTokenDecimals) {
  let best = null; // { path, amountsOut, gasEstimate, profitRaw }
  const feeData = await signer.provider.getFeeData?.() || {}; // may be undefined in some setups

  for (const path of paths) {
    try {
      const { amountsOut, gasEstimate } = await getAmountsOutAndGasEstimate(
        router,
        signer,
        amountIn,
        path
      );

      const finalOut = amountsOut[amountsOut.length - 1];

      // crude gas cost estimate expressed in final token:
      // if gasEstimate and feeData.maxFeePerGas exist, compute gasCost = gasEstimate * maxFeePerGas
      // then try to approximate final token value of gasCost by swapping gasCost ETH -> final token using router.getAmountsOut
      // This is optional and best-effort; if fails, we'll ignore gas in profit calc.
      let gasCostInFinalToken = null;
      try {
        if (gasEstimate && feeData.maxFeePerGas) {
          const gasCostWei = gasEstimate * BigInt(feeData.maxFeePerGas.toString());
          // attempt to convert gasCost (in wei of native token) to final token via router path [WETH -> finalToken] if available
          // find WETH address from addresses.TOKENS.WETH
          const weth = addresses.TOKENS.WETH;
          // only attempt if path from WETH to finalToken exists (we'll try direct WETH->final)
          const conversionPath = [weth, path[path.length - 1]];
          try {
            const conv = await router.getAmountsOut(gasCostWei, conversionPath);
            gasCostInFinalToken = conv[conv.length - 1];
          } catch (e) {
            gasCostInFinalToken = null;
          }
        }
      } catch (e) {
        gasCostInFinalToken = null;
      }

      // Profit raw (in final token): finalOut - (gasCostInFinalToken ? gasCostInFinalToken : 0)
      let profitRaw = finalOut;
      if (gasCostInFinalToken) {
        profitRaw = BigInt(finalOut) - BigInt(gasCostInFinalToken);
      }

      // Save best by raw profit (no conversion to USD)
      if (!best || BigInt(profitRaw) > BigInt(best.profitRaw)) {
        best = {
          path,
          amountsOut,
          gasEstimate,
          gasCostInFinalToken,
          profitRaw,
        };
      }
    } catch (err) {
      // ignore path if getAmountsOut or estimate fails
      console.warn("Path check failed:", path, err.message || err);
      continue;
    }
  }

  // compute human-readable values
  if (best) {
    best.finalOutHuman = ethers.formatUnits(best.amountsOut[best.amountsOut.length - 1], finalTokenDecimals);
    best.profitHuman = ethers.formatUnits(best.profitRaw, finalTokenDecimals);
  }

  return best;
}

/// Execute swap for chosen path
async function executeSwapPath(router, signer, inputTokenContract, amountIn, path, minAmountOut = 0) {
  const to = await signer.getAddress();
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Approve input token to router (if necessary)
  const allowance = await inputTokenContract.allowance(to, router.target);
  if (BigInt(allowance) < BigInt(amountIn)) {
    console.log("Approving input token to router...");
    await inputTokenContract.connect(signer).approve(router.target, amountIn);
  }

  // Call swap
  const routerConnected = router.connect(signer);
  const tx = await routerConnected.swapExactTokensForTokens(
    amountIn,
    minAmountOut,
    path,
    to,
    deadline
  );
  const receipt = await tx.wait();
  return receipt;
}

/// MAIN EXECUTION
async function main() {
  const [executor] = await ethers.getSigners();
  console.log("Executor:", executor.address);

  // Setup contracts
  const routerUni = new ethers.Contract(addresses.ROUTERS.UNIV2, abis.UNIV2_ROUTER, executor);
  const factoryUni = new ethers.Contract(addresses.FACTORIES.UNIV2, abis.UNIV2_FACTORY, executor);

  const WETH = new ethers.Contract(addresses.TOKENS.WETH, abis.ERC20, executor);
  const USDC = new ethers.Contract(addresses.TOKENS.USDC, abis.ERC20, executor);

  // Get pair (WETH/USDC) for logging
  const pairAddr = await factoryUni.getPair(await WETH.getAddress(), await USDC.getAddress());
  const pair = new ethers.Contract(pairAddr, abis.UNIV2_PAIR, executor);

  // Log initial state
  await logPoolState(pair, WETH, USDC, "Initial");

  // Impersonate USDC whale to manipulate pool
  const usdcWhale = await impersonate(addresses.WHALES.USDC);
  const whaleBalance = await USDC.balanceOf(usdcWhale.address);
  console.log("Whale USDC balance:", ethers.formatUnits(whaleBalance, 6));

  // Whale dumps USDC into pool → skew price
  const amountIn = ethers.parseUnits("1000000", 6); // 1M USDC
  await USDC.connect(usdcWhale).approve(routerUni.target, amountIn);
  await routerUni.connect(usdcWhale).swapExactTokensForTokens(
    amountIn,
    0,
    [addresses.TOKENS.USDC, addresses.TOKENS.WETH],
    usdcWhale.address,
    Math.floor(Date.now() / 1000) + 60 * 10
  );

  // Log skewed pool
  await logPoolState(pair, WETH, USDC, "After Whale Dump");

  // --- MULTI-HOP ARBITRAGE SECTION ---
  // Candidate paths (example). Add/remove/modify as you like.
  // Paths are arrays of token addresses. Example: WETH -> DAI -> USDC
  const candidatePaths = [
    // direct WETH -> USDC
    [addresses.TOKENS.WETH, addresses.TOKENS.USDC],
    // two-hop via DAI (if available in addresses.TOKENS)
    [addresses.TOKENS.WETH, addresses.TOKENS.DAI || addresses.TOKENS.USDC, addresses.TOKENS.USDC],
    // three-hop example (WETH -> TOKEN_A -> TOKEN_B -> USDC) — replace TOKEN_A/B with real addresses
    // [addresses.TOKENS.WETH, addresses.TOKENS.TOKEN_A, addresses.TOKENS.TOKEN_B, addresses.TOKENS.USDC],
  ].filter((p) => p.every(Boolean)); // remove paths with undefined tokens

  // Arbitrage simulation: try different multi-hop paths from WETH -> ... -> USDC
  const arbAmountIn = ethers.parseEther("10"); // 10 WETH

  console.log("\n[SIMULATING MULTI-HOP PATHS]");
  const best = await findBestPath(candidatePaths, arbAmountIn, routerUni, executor, 6); // final token USDC decimals = 6

  if (!best) {
    console.log("No valid path found for arbitrage simulation.");
    return;
  }

  console.log("Best path:", best.path);
  console.log("Expected final output (USDC):", best.finalOutHuman);
  console.log("Estimated profit after gas (best guess, USDC):", best.profitHuman);
  console.log("Raw final out (wei-like):", best.amountsOut[best.amountsOut.length - 1].toString());
  if (best.gasEstimate) {
    console.log("Gas estimate (units):", best.gasEstimate.toString());
    if (best.gasCostInFinalToken) {
      console.log("Estimated gas cost in final token:", ethers.formatUnits(best.gasCostInFinalToken, 6));
    }
  }

  // Decide whether to execute (simple rule: profit > 0)
  if (BigInt(best.profitRaw) > 0n) {
    console.log("\n[EXECUTING ARBITRAGE SWAP]");
    // minAmountOut: apply slippage protection (e.g., 0.5% slippage)
    const slippageBps = 50; // 50 basis points = 0.5%
    const finalOut = BigInt(best.amountsOut[best.amountsOut.length - 1].toString());
    const minOut = finalOut - (finalOut * BigInt(slippageBps) / 10000n);

    // Input token contract is first in path
    const inputToken = new ethers.Contract(best.path[0], abis.ERC20, executor);

    try {
      const receipt = await executeSwapPath(routerUni, executor, inputToken, arbAmountIn, best.path, minOut);
      console.log("Swap tx hash:", receipt.transactionHash);

      // balance check after
      const balanceAfter = await USDC.balanceOf(executor.address);
      const balanceBefore = balanceAfter - BigInt(best.amountsOut[best.amountsOut.length - 1].toString()); // best-effort (if starting balance unknown)
      // Better approach: query exact balances before executing; left simple here.
      console.log("Post-exec USDC balance:", ethers.formatUnits(balanceAfter, 6));
    } catch (err) {
      console.error("Execution failed:", err);
    }
  } else {
    console.log("Best path not profitable after gas estimate — not executing.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

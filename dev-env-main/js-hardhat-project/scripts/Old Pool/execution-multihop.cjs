

const hre = require("hardhat");
const { ethers } = hre;
const abis = require("../utils/abis.cjs");
const addresses = require("../utils/addresses.cjs");

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

async function impersonate(addr, fundEth = "200") {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [addr],
  });
  // top up with ETH (from default signer) so it can pay gas locally
  const [coinbase] = await ethers.getSigners();
  await coinbase.sendTransaction({ to: addr, value: ethers.parseEther(fundEth) });
  return await ethers.getSigner(addr);
}

function erc20(address, signerOrProvider) {
  return new ethers.Contract(address, abis.ERC20, signerOrProvider);
}

function v2Router(name, signerOrProvider) {
  return new ethers.Contract(addresses.ROUTERS[name], abis.UNIV2_ROUTER, signerOrProvider);
}

function v2Factory(name, signerOrProvider) {
  return new ethers.Contract(addresses.FACTORIES[name], abis.UNIV2_FACTORY, signerOrProvider);
}

async function v2Pair(factoryName, tokenA, tokenB, provider) {
  const f = v2Factory(factoryName, provider);
  const pairAddr = await f.getPair(tokenA, tokenB);
  if (pairAddr === ethers.ZeroAddress) throw new Error(`Pair not found on ${factoryName} for ${tokenA} / ${tokenB}`);
  return new ethers.Contract(pairAddr, abis.UNIV2_PAIR, provider);
}

async function reserves(pair) {
  const [r0, r1] = await pair.getReserves();
  const t0 = await pair.token0();
  const t1 = await pair.token1();
  return { r0, r1, t0, t1 };
}

async function logPairState(label, factoryName, tokenA, tokenB, symbols, provider) {
  const pair = await v2Pair(factoryName, tokenA, tokenB, provider);
  const { r0, r1, t0, t1 } = await reserves(pair);

  const tokA = erc20(tokenA, provider), tokB = erc20(tokenB, provider);
  const decA = await tokA.decimals(), decB = await tokB.decimals();
  const symA = symbols?.[tokenA.toLowerCase()] || await tokA.symbol();
  const symB = symbols?.[tokenB.toLowerCase()] || await tokB.symbol();

  // map reserves to given ordering (tokenA/tokenB)
  let RA, RB;
  if (t0.toLowerCase() === tokenA.toLowerCase()) {
    RA = Number(ethers.formatUnits(r0, decA));
    RB = Number(ethers.formatUnits(r1, decB));
  } else {
    RA = Number(ethers.formatUnits(r1, decA));
    RB = Number(ethers.formatUnits(r0, decB));
  }

  console.log(
    `[${label}] ${factoryName} ${symA}/${symB} | reserves: ${RA.toLocaleString()} ${symA} vs ${RB.toLocaleString()} ${symB}`
  );
  return { pair, RA, RB, symA, symB };
}

async function quote(router, amountIn, path) {
  const amounts = await router.getAmountsOut(amountIn, path);
  return amounts[amounts.length - 1];
}

async function approveMax(token, spender, owner, amount = null) {
  const allowance = await token.allowance(owner.address, spender);
  if (allowance > 0n && amount && allowance >= amount) return;
  const max = amount ?? 2n ** 255n;
  await (await token.connect(owner).approve(spender, max)).wait();
}

////////////////////////////////////////////////////////////////////////////////
// Main
////////////////////////////////////////////////////////////////////////////////

async function main() {
  const provider = ethers.provider;
  const [executor] = await ethers.getSigners();

  const WETH = addresses.TOKENS.WETH;
  const USDC = addresses.TOKENS.USDC;
  const DAI  = addresses.TOKENS.DAI;

  const symMap = {
    [WETH.toLowerCase()]: "WETH",
    [USDC.toLowerCase()]: "USDC",
    [DAI.toLowerCase()]:  "DAI",
  };

  const weth = erc20(WETH, executor);
  const usdc = erc20(USDC, executor);
  const dai  = erc20(DAI,  executor);

  const uniRouter  = v2Router("UNIV2", executor);
  const sushiRouter= v2Router("SUSHI", executor);

  console.log("Executor:", executor.address);

  // --------------------------------------------------------------------------
  // 0) (Optional) Manipulate price: dump USDC -> WETH on UniV2 to skew pool
  // --------------------------------------------------------------------------
  const doManipulate = true;
  if (doManipulate) {
    const usdcWhale = await impersonate(addresses.WHALES.USDC, "300");
    const usdcWhaleSigner = usdc.connect(usdcWhale);
    const uniRouterWhale  = v2Router("UNIV2", usdcWhale);

    const whaleBal = await usdc.balanceOf(usdcWhale.address);
    console.log(`USDC whale balance: ${ethers.formatUnits(whaleBal, 6)} USDC`);

    const dumpAmount = ethers.parseUnits("1000000", 6); // 1,000,000 USDC
    await (await usdcWhaleSigner.approve(uniRouterWhale.target, dumpAmount)).wait();
    console.log("Dumping 1,000,000 USDC -> WETH on UniV2 to skew price...");
    await (await uniRouterWhale.swapExactTokensForTokens(
      dumpAmount, 0, [USDC, WETH], usdcWhale.address, Math.floor(Date.now()/1000)+600
    )).wait();
  }

  // --------------------------------------------------------------------------
  // 1) Log pool state BEFORE arbitrage across both DEXes & all involved pairs
  // --------------------------------------------------------------------------
  await logPairState("BEFORE", "UNIV2", WETH, USDC, symMap, provider);
  await logPairState("BEFORE", "SUSHI", WETH, USDC, symMap, provider);
  await logPairState("BEFORE", "UNIV2", USDC, DAI,  symMap, provider);
  await logPairState("BEFORE", "SUSHI", USDC, DAI,  symMap, provider);
  await logPairState("BEFORE", "UNIV2", DAI,  WETH, symMap, provider);
  await logPairState("BEFORE", "SUSHI", DAI,  WETH, symMap, provider);

  // --------------------------------------------------------------------------
  // 2) Quote multi-hop cycles on-chain (includes 0.30% per hop automatically)
  //     Path A: UniV2 WETH->USDC | Sushi USDC->DAI | UniV2 DAI->WETH
  //     Path B: Sushi WETH->USDC | UniV2 USDC->DAI | Sushi DAI->WETH
  // --------------------------------------------------------------------------
  const amountIn = ethers.parseEther("10"); // start with 10 WETH

  // Path A
  const outA1 = await quote(uniRouter,  amountIn, [WETH, USDC]);
  const outA2 = await quote(sushiRouter, outA1,    [USDC, DAI]);
  const outA3 = await quote(uniRouter,  outA2,     [DAI,  WETH]);

  // Path B
  const outB1 = await quote(sushiRouter, amountIn, [WETH, USDC]);
  const outB2 = await quote(uniRouter,   outB1,    [USDC, DAI]);
  const outB3 = await quote(sushiRouter, outB2,    [DAI,  WETH]);

  const profitA = outA3 - amountIn;
  const profitB = outB3 - amountIn;

  console.log("\n[QUOTE] Multi-hop cycles (WETH terms):");
  console.log(`Path A (Uni->Sushi->Uni): start 10 WETH -> end ${ethers.formatEther(outA3)} WETH | profit ${ethers.formatEther(profitA)} WETH`);
  console.log(`Path B (Sushi->Uni->Sushi): start 10 WETH -> end ${ethers.formatEther(outB3)} WETH | profit ${ethers.formatEther(profitB)} WETH`);

  // --------------------------------------------------------------------------
  // 3) Execute the better path if profitable
  // --------------------------------------------------------------------------
  const best = profitA > profitB ? "A" : "B";
  const bestProfit = profitA > profitB ? profitA : profitB;

  if (bestProfit <= 0n) {
    console.log("\n[EXEC] No profitable path right now. Skipping execution.");
    return;
  }

  console.log(`\n[EXEC] Executing Path ${best} (expected profit ~ ${ethers.formatEther(bestProfit)} WETH)`);

  // Make sure we hold enough WETH; if not, impersonate a WETH whale to fund us
  const balWeth = await weth.balanceOf(executor.address);
  if (balWeth < amountIn) {
    console.log("Funding executor with WETH from whale...");
    const wethWhale = await impersonate(addresses.WHALES.WETH, "300");
    await erc20(WETH, wethWhale).transfer(executor.address, amountIn);
  }

  // Approvals on both routers
  await approveMax(weth,  addresses.ROUTERS.UNIV2,  executor, amountIn);
  await approveMax(weth,  addresses.ROUTERS.SUSHI,  executor, amountIn);
  await approveMax(usdc,  addresses.ROUTERS.UNIV2,  executor);
  await approveMax(usdc,  addresses.ROUTERS.SUSHI,  executor);
  await approveMax(dai,   addresses.ROUTERS.UNIV2,  executor);
  await approveMax(dai,   addresses.ROUTERS.SUSHI,  executor);

  const deadline = Math.floor(Date.now()/1000) + 900;
  const beforeWeth = await weth.balanceOf(executor.address);
  const beforeUsdc = await usdc.balanceOf(executor.address);
  const beforeDai  = await dai.balanceOf(executor.address);

  if (best === "A") {
    // UniV2: WETH -> USDC
    await (await uniRouter.swapExactTokensForTokens(amountIn, 0, [WETH, USDC], executor.address, deadline)).wait();
    const midUSDC = await usdc.balanceOf(executor.address);

    // Sushi: USDC -> DAI
    await (await sushiRouter.swapExactTokensForTokens(midUSDC, 0, [USDC, DAI], executor.address, deadline)).wait();
    const midDAI = await dai.balanceOf(executor.address);

    // UniV2: DAI -> WETH
    await (await uniRouter.swapExactTokensForTokens(midDAI, 0, [DAI, WETH], executor.address, deadline)).wait();

  } else {
    // Sushi: WETH -> USDC
    await (await sushiRouter.swapExactTokensForTokens(amountIn, 0, [WETH, USDC], executor.address, deadline)).wait();
    const midUSDC = await usdc.balanceOf(executor.address);

    // UniV2: USDC -> DAI
    await (await uniRouter.swapExactTokensForTokens(midUSDC, 0, [USDC, DAI], executor.address, deadline)).wait();
    const midDAI = await dai.balanceOf(executor.address);

    // Sushi: DAI -> WETH
    await (await sushiRouter.swapExactTokensForTokens(midDAI, 0, [DAI, WETH], executor.address, deadline)).wait();
  }

  const afterWeth = await weth.balanceOf(executor.address);
  const afterUsdc = await usdc.balanceOf(executor.address);
  const afterDai  = await dai.balanceOf(executor.address);

  const pnlWeth = afterWeth - beforeWeth;

  console.log("\n[RESULT] Balances (executor):");
  console.log(`WETH: ${ethers.formatEther(beforeWeth)} -> ${ethers.formatEther(afterWeth)} (Δ ${ethers.formatEther(pnlWeth)})`);
  console.log(`USDC: ${ethers.formatUnits(beforeUsdc, 6)} -> ${ethers.formatUnits(afterUsdc, 6)}`);
  console.log(`DAI : ${ethers.formatEther(beforeDai)} -> ${ethers.formatEther(afterDai)}`);

  // --------------------------------------------------------------------------
  // 4) Log pool state AFTER execution (for each involved pair on both DEXes)
  // --------------------------------------------------------------------------
  await logPairState("AFTER", "UNIV2", WETH, USDC, symMap, provider);
  await logPairState("AFTER", "SUSHI", WETH, USDC, symMap, provider);
  await logPairState("AFTER", "UNIV2", USDC, DAI,  symMap, provider);
  await logPairState("AFTER", "SUSHI", USDC, DAI,  symMap, provider);
  await logPairState("AFTER", "UNIV2", DAI,  WETH, symMap, provider);
  await logPairState("AFTER", "SUSHI", DAI,  WETH, symMap, provider);

  console.log(`\n[SUMMARY] Path ${best} executed. Realized PnL: ${ethers.formatEther(pnlWeth)} WETH`);
}

main().catch((e) => { console.error(e); process.exit(1); });

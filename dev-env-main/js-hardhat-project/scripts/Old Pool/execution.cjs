

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
  console.log(`Reserves: ${await token0.symbol()}=${ethers.formatUnits(reserves.reserve0, await token0.decimals())}, ${await token1.symbol()}=${ethers.formatUnits(reserves.reserve1, await token1.decimals())}`);
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

  // Get pair
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

  // Arbitrage simulation: check WETH → USDC path
  const arbAmountIn = ethers.parseEther("10"); // 10 WETH
  const amountsOut = await routerUni.getAmountsOut(arbAmountIn, [
    addresses.TOKENS.WETH,
    addresses.TOKENS.USDC,
  ]);

  console.log(`\n[ARB SIMULATION]`);
  console.log(`Input: 10 WETH`);
  console.log(`Output: ${ethers.formatUnits(amountsOut[1], 6)} USDC`);

  // Execute arb swap with executor
  await WETH.connect(executor).approve(routerUni.target, arbAmountIn);
  const balanceBefore = await USDC.balanceOf(executor.address);

  await routerUni.connect(executor).swapExactTokensForTokens(
    arbAmountIn,
    0,
    [addresses.TOKENS.WETH, addresses.TOKENS.USDC],
    executor.address,
    Math.floor(Date.now() / 1000) + 60 * 10
  );

  const balanceAfter = await USDC.balanceOf(executor.address);
  const profit = balanceAfter - balanceBefore;

  console.log(`\n[EXECUTION RESULT]`);
  console.log(`Balance before: ${ethers.formatUnits(balanceBefore, 6)} USDC`);
  console.log(`Balance after: ${ethers.formatUnits(balanceAfter, 6)} USDC`);
  console.log(`Profit: ${ethers.formatUnits(profit, 6)} USDC`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

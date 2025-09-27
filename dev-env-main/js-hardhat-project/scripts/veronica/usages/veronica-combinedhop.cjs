

// scripts/combined-routing.js
// Usage: npx hardhat run --network localhost scripts/combined-routing.js

/*

Purpose: demonstrates both strategies in the same script: 
(A) Abbot receives final tokens from a multi-hop, and 
(B) a swap where the output token is routed directly into another pool 
(recipient set to that pair address). 
Both actions are performed sequentially.

*/

const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../../utils/addresses.cjs");
const abis = require("../../utils/abis.cjs");

const USDC = addresses.TOKENS.USDC;
const DAI = addresses.TOKENS.DAI;
const USDT = addresses.TOKENS.USDT;
const WETH = addresses.TOKENS.WETH;

const ERC20_ABI = abis.ERC20;
const UNIV2_ROUTER = addresses.ROUTERS.UNIV2;
const UNIV2_FACTORY = addresses.FACTORIES.UNIV2;
const UNIV2_ROUTER_ABI = abis.UNIV2_ROUTER;
const UNIV2_FACTORY_ABI = abis.UNIV2_FACTORY;

async function main() {
  const provider = ethers.provider;
  const abbot = addresses.HARDHAT_ACCOUNTS.Abbot;
  const abbotSigner = await ethers.getSigner(abbot.address);

  // Contracts
  const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);
  const dai = new ethers.Contract(DAI, ERC20_ABI, provider);
  const usdt = new ethers.Contract(USDT, ERC20_ABI, provider);
  const weth = new ethers.Contract(WETH, ERC20_ABI, provider);

  const digitsUSDC = await usdc.decimals();
  const digitsDAI = await dai.decimals();
  const digitsUSDT = await usdt.decimals();
  const digitsWETH = await weth.decimals();

  // Fund Abbot from whale
  const whale = addresses.WHALES.USDC;
  await provider.send("hardhat_impersonateAccount", [whale]);
  const whaleSigner = await ethers.getSigner(whale);
  const usdcWithWhale = usdc.connect(whaleSigner);
  const usdcWithAbbot = usdc.connect(abbotSigner);

  const fundAmount = ethers.parseUnits("400", digitsUSDC);
  await usdcWithWhale.transfer(abbotSigner.address, fundAmount);
  console.log("Funded Abbot with", ethers.formatUnits(fundAmount, digitsUSDC), "USDC");

  // Approve router for large amount
  const router = new ethers.Contract(UNIV2_ROUTER, UNIV2_ROUTER_ABI, provider);
  const routerWithAbbot = router.connect(abbotSigner);

  await usdcWithAbbot.approve(UNIV2_ROUTER, fundAmount);
  console.log("Abbot approved router for USDC");

  // A) Multi-hop where Abbot receives final token (USDC -> DAI -> USDT -> WETH)
  console.log("\n--- A) Multi-hop (Abbot receives final WETH) ---");
  const pathA = [USDC, DAI, USDT, WETH];
  const amountInA = ethers.parseUnits("200", digitsUSDC);
  const amountsOutA = await router.getAmountsOut(amountInA, pathA);
  const finalOutA = amountsOutA[amountsOutA.length - 1];
  const minOutA = (finalOutA * 99n) / 100n;

  console.log("Swapping", ethers.formatUnits(amountInA, digitsUSDC), "USDC -> final expected", ethers.formatUnits(finalOutA, digitsWETH), "WETH");

  try {
    const txA = await routerWithAbbot.swapExactTokensForTokens(amountInA, minOutA, pathA, abbotSigner.address, Math.floor(Date.now()/1000)+60*20);
    await txA.wait();
    console.log("Multi-hop A complete.");
    console.log("Abbot WETH balance:", ethers.formatUnits(await weth.balanceOf(abbotSigner.address), digitsWETH));
  } catch (e) {
    console.error("Multi-hop A failed:", e.message);
  }

  // B) Route output directly into another pool
  // Example: USDC -> DAI, send DAI directly to DAI/USDT pair address (so pool receives DAI)
  console.log("\n--- B) Swap and route output directly into next pool (USDC->DAI -> to DAI/USDT pair) ---");

  const factory = new ethers.Contract(UNIV2_FACTORY, UNIV2_FACTORY_ABI, provider);

  const daiUsdtPair = await factory.getPair(DAI, USDT);
  if (daiUsdtPair === ethers.ZeroAddress) {
    console.log("No DAI/USDT pool found. Aborting part B.");
    return;
  }

  console.log("DAI/USDT pair address:", daiUsdtPair);

  const amountInB = ethers.parseUnits("100", digitsUSDC);
  // Here we set minOut = 0 for demonstration. In production set a safe slippage limit.
  const minOutB = 0n;

  try {
    const txB = await routerWithAbbot.swapExactTokensForTokens(amountInB, minOutB, [USDC, DAI], daiUsdtPair, Math.floor(Date.now()/1000)+60*20);
    const recB = await txB.wait();
    console.log("Swap B sent, tx:", recB.transactionHash);
    console.log("DAI sent directly to pair; pair contract now holds additional DAI");
  } catch (err) {
    console.error("Swap B failed:", err.message);
  }

  // Check balances
  console.log("Abbot USDC:", ethers.formatUnits(await usdc.balanceOf(abbotSigner.address), digitsUSDC));
  console.log("Abbot DAI:", ethers.formatUnits(await dai.balanceOf(abbotSigner.address), digitsDAI));
  console.log("Abbot WETH:", ethers.formatUnits(await weth.balanceOf(abbotSigner.address), digitsWETH));
}

main().catch(console.error);

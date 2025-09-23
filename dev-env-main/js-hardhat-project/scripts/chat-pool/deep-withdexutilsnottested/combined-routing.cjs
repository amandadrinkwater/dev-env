

// scripts/combined-routing.cjs
const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../utils/addresses.cjs");
const { getToken, getRouter, getFactory, approveTokenIfNeeded, swapWithSlippage } = require("../utils/dexUtils.cjs");

async function main() {
  const provider = ethers.provider;
  const abbot = await ethers.getSigner(addresses.HARDHAT_ACCOUNTS.Abbot.address);

  // Tokens & Router
  const { contract: usdc, decimals: dUSDC } = await getToken("USDC", provider);
  const { contract: dai, decimals: dDAI } = await getToken("DAI", provider);
  const router = getRouter(provider);
  const factory = getFactory(provider);

  // Fund Abbot from whale
  const whaleSigner = await ethers.getSigner(addresses.WHALES.USDC);
  await provider.send("hardhat_impersonateAccount", [addresses.WHALES.USDC]);
  await (await usdc.connect(whaleSigner).transfer(abbot.address, ethers.parseUnits("400", dUSDC))).wait();

  // Approve router
  await approveTokenIfNeeded(usdc, abbot, router.address);

  // --- A) Multi-hop swap (Abbot receives final) ---
  const pathA = [addresses.TOKENS.USDC, addresses.TOKENS.DAI, addresses.TOKENS.USDT, addresses.TOKENS.WETH];
  const amountInA = ethers.parseUnits("200", dUSDC);
  await swapWithSlippage(router, amountInA, pathA, abbot, abbot.address, 50);
  console.log("✅ Multi-hop swap done, Abbot WETH balance:", ethers.formatUnits(await (await getToken("WETH", provider)).contract.balanceOf(abbot.address), 18));

  // --- B) Route output directly into another pool ---
  const daiUsdtPair = await factory.getPair(addresses.TOKENS.DAI, addresses.TOKENS.USDT);
  if (daiUsdtPair === ethers.ZeroAddress) return console.log("❌ No DAI/USDT pool found");

  const pathB = [addresses.TOKENS.USDC, addresses.TOKENS.DAI];
  const amountInB = ethers.parseUnits("100", dUSDC);
  await swapWithSlippage(router, amountInB, pathB, abbot, daiUsdtPair, 80);
  console.log("✅ USDC→DAI routed directly into DAI/USDT pool:", daiUsdtPair);
}

main().catch(console.error);

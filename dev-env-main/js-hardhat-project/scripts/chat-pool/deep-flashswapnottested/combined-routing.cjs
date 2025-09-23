// scripts/combined-routing.cjs
const hre = require("hardhat");
const { ethers } = hre;
const addresses = require("../../utils/addresses.cjs");
const {
  getToken,
  approveTokenIfNeeded,
  getRouter,
  swapWithSlippage
} = require("../../utils/dexUtils.cjs");

async function main() {
  const provider = ethers.provider;
  const abbot = await ethers.getSigner(addresses.HARDHAT_ACCOUNTS.Abbot.address);

  console.log("🐋 Abbot address:", abbot.address);

  // Define multiple routes
  const routes = [
    ["USDC", "DAI", "WETH"],
    ["WETH", "USDT", "DAI"]
  ];

  const router = getRouter(provider);
  for (const route of routes) {
    const path = route.map(s => addresses.TOKENS[s]);
    const { contract: tokenIn, decimals } = await getToken(route[0], provider);
    await approveTokenIfNeeded(tokenIn, abbot, router.address);

    const amountIn = ethers.parseUnits("50", decimals);
    const slippageBps = 50;

    console.log(`🔹 Swapping ${route.join(" → ")}`);
    const { receipt, expectedOut } = await swapWithSlippage(router, amountIn, path, abbot, abbot.address, slippageBps);

    console.log("✅ Swap executed! Gas:", receipt.gasUsed.toString());
    console.log(`Expected output: ${ethers.formatUnits(expectedOut, await getToken(route[route.length - 1], provider).decimals)}`);
  }
}

main().catch(console.error);

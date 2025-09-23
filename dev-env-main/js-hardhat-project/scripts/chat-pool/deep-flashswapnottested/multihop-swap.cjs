

// scripts/multihop-swap.cjs
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

  // --- Swap path USDC → DAI → WETH ---
  const pathSymbols = ["USDC", "DAI", "WETH"];
  const path = pathSymbols.map(s => addresses.TOKENS[s]);

  // --- Get first token contract ---
  const { contract: tokenIn, decimals: decimalsIn } = await getToken(pathSymbols[0], provider);

  // --- Approve router if needed ---
  const router = getRouter(provider);
  await approveTokenIfNeeded(tokenIn, abbot, router.address);

  // --- Swap amount ---
  const amountIn = ethers.parseUnits("100", decimalsIn);
  const slippageBps = 50; // 0.5%

  console.log(`🔹 Swapping ${amountIn} ${pathSymbols[0]} along ${pathSymbols.join(" → ")}`);
  const { receipt, expectedOut } = await swapWithSlippage(router, amountIn, path, abbot, abbot.address, slippageBps);

  console.log("✅ Swap executed! Gas used:", receipt.gasUsed.toString());
  console.log(`Expected output (before slippage): ${ethers.formatUnits(expectedOut, await getToken(pathSymbols[pathSymbols.length - 1], provider).decimals)}`);
}

main().catch(console.error);

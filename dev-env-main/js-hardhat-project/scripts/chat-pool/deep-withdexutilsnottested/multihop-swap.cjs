

// scripts/multihop-swap.cjs
const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../../utils/addresses.cjs");
const { getToken, getRouter, approveTokenIfNeeded, swapWithSlippage } = require("../dexUtils.cjs");

async function main() {
  const provider = ethers.provider;
  const abbot = await ethers.getSigner(addresses.HARDHAT_ACCOUNTS.Abbot.address);

  // Tokens & Router
  const { contract: usdc, decimals: dUSDC } = await getToken("USDC", provider);
  const { contract: weth, decimals: dWETH } = await getToken("WETH", provider);
  
  const router = getRouter(provider);

  // Fund Abbot from whale
  const whaleSigner = await ethers.getSigner(addresses.WHALES.USDC);
  await provider.send("hardhat_impersonateAccount", [addresses.WHALES.USDC]);
  await (await usdc.connect(whaleSigner).transfer(abbot.address, ethers.parseUnits("200", dUSDC))).wait();

  // Approve router
  await approveTokenIfNeeded(usdc, abbot, router.address);

  // Multi-hop path: USDC → DAI → USDT → WETH
  const path = [
    addresses.TOKENS.USDC,
    addresses.TOKENS.DAI,
    addresses.TOKENS.USDT,
    addresses.TOKENS.WETH,
  ];
  const amountIn = ethers.parseUnits("200", dUSDC);

  const { receipt, expectedOut, minOut } = await swapWithSlippage(router, amountIn, path, abbot, abbot.address, 50);

  console.log("✅ Multi-hop swap completed");
  console.log("Expected out:", ethers.formatUnits(expectedOut, dWETH));
  console.log("Min out:", ethers.formatUnits(minOut, dWETH));
  console.log("Gas used:", receipt.gasUsed.toString());

  const finalWETH = await weth.balanceOf(abbot.address);
  console.log("Abbot WETH balance:", ethers.formatUnits(finalWETH, dWETH));
}

main().catch(console.error);

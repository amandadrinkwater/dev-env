

// scripts/run-arb-example.cjs
const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../../utils/addresses.cjs");
const { getToken, getRouter, approveTokenIfNeeded, swapWithSlippage } = require("../dexUtils.cjs");

async function main() {
  const provider = ethers.provider;
  const abbot = await ethers.getSigner(addresses.HARDHAT_ACCOUNTS.Abbot.address);

  const { contract: usdc, decimals: dUSDC } = await getToken("USDC", provider);
  const router = getRouter(provider);

  // Fund Abbot from whale
  const whaleSigner = await ethers.getSigner(addresses.WHALES.USDC);
  await provider.send("hardhat_impersonateAccount", [addresses.WHALES.USDC]);
  await (await usdc.connect(whaleSigner).transfer(abbot.address, ethers.parseUnits("300", dUSDC))).wait();

  // Approve router
  await approveTokenIfNeeded(usdc, abbot, router.address);

  // Chained arbitrage paths
  const path1 = [addresses.TOKENS.USDC, addresses.TOKENS.DAI];
  const path2 = [addresses.TOKENS.DAI, addresses.TOKENS.USDT];
  const paths = [path1, path2];

  let inputAmount = ethers.parseUnits("300", dUSDC);
  for (let i = 0; i < paths.length; i++) {
    // Always send swaps back to Abbot’s wallet
    const recipient = abbot.address;
    const { expectedOut } = await swapWithSlippage(router, inputAmount, paths[i], abbot, recipient, 50);
    inputAmount = expectedOut; // feed next hop
  }

  console.log("✅ Arbitrage chain executed, Abbot final balances:");
  console.log("USDC:", ethers.formatUnits(await usdc.balanceOf(abbot.address), dUSDC));
  console.log("DAI:", ethers.formatUnits(await (await getToken("DAI", provider)).contract.balanceOf(abbot.address), 18));
  console.log("USDT:", ethers.formatUnits(await (await getToken("USDT", provider)).contract.balanceOf(abbot.address), 6));
}

main().catch(console.error);

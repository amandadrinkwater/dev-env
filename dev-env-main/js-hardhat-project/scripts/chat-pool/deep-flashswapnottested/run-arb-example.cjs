// scripts/run-arb-example.cjs
const hre = require("hardhat");
const { ethers } = hre;
const addresses = require("../../utils/addresses.cjs");
const {
  getToken,
  approveTokenIfNeeded,
  getRouter,
  getFactory,
  swapWithSlippage,
  executeFlashswap
} = require("../../utils/dexUtils.cjs");

async function main() {
  const provider = ethers.provider;
  const abbot = await ethers.getSigner(addresses.HARDHAT_ACCOUNTS.Abbot.address);

  console.log("🐋 Abbot address:", abbot.address);

  // --- Deploy or use existing Flashswap contract ---
  const Flashswap = await ethers.getContractFactory("UniswapV2Flashswap", abbot);
  const flashswap = await Flashswap.deploy(addresses.ROUTERS.UNIV2);
  await flashswap.deployed();
  console.log("Flashswap deployed:", flashswap.address);

  // --- Arbitrage parameters ---
  const factory = getFactory(provider);
  const tokenBorrow = addresses.TOKENS.USDC;
  const pairAddress = await factory.getPair(tokenBorrow, addresses.TOKENS.DAI);
  if (pairAddress === ethers.ZeroAddress) throw new Error("No USDC/DAI pair");

  const amountBorrow = ethers.parseUnits("1000", 6);
  const path = [addresses.TOKENS.USDC, addresses.TOKENS.DAI, addresses.TOKENS.WETH];
  const slippageBps = 50;

  console.log("🔹 Executing flashswap arbitrage...");
  const receipt = await executeFlashswap(flashswap, pairAddress, tokenBorrow, amountBorrow, path, slippageBps, abbot);
  console.log("✅ Flashswap executed! Gas used:", receipt.gasUsed.toString());

  // Withdraw profit
  const finalToken = path[path.length - 1];
  const { contract: profitToken } = await getToken(finalToken, provider);
  const profitBefore = await profitToken.balanceOf(abbot.address);

  const withdrawTx = await flashswap.connect(abbot).withdrawToken(finalToken, abbot.address);
  await withdrawTx.wait();

  const profitAfter = await profitToken.balanceOf(abbot.address);
  console.log(`💰 Profit received by Abbot: ${ethers.formatUnits(profitAfter - profitBefore, await getToken(finalToken, provider).decimals)}`);
}

main().catch(console.error);

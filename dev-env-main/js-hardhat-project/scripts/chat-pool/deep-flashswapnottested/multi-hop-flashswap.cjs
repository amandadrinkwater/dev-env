// scripts/multi-hop-flashswap.cjs
const hre = require("hardhat");
const { ethers } = hre;
const addresses = require("../utils/addresses.cjs");
const { getFactory, getToken, executeFlashswap } = require("../utils/dexUtils.cjs");

async function main() {
  const provider = ethers.provider;
  const abbot = await ethers.getSigner(addresses.HARDHAT_ACCOUNTS.Abbot.address);

  // --- Deploy Flashswap contract ---
  const Flashswap = await ethers.getContractFactory("UniswapV2Flashswap", abbot);
  const flashswap = await Flashswap.deploy(addresses.ROUTERS.UNIV2);
  await flashswap.deployed();
  console.log("Flashswap contract deployed:", flashswap.address);

  // --- Get Uniswap pair ---
  const factory = getFactory(provider);
  const pairAddress = await factory.getPair(addresses.TOKENS.USDC, addresses.TOKENS.DAI);
  if (pairAddress === ethers.ZeroAddress) throw new Error("No USDC/DAI pair");

  // --- Multi-hop swap params ---
  const tokenBorrow = addresses.TOKENS.USDC;
  const amountBorrow = ethers.parseUnits("1000", 6); // 1000 USDC
  const path = [addresses.TOKENS.USDC, addresses.TOKENS.DAI, addresses.TOKENS.WETH];
  const slippageBps = 50; // 0.5%

  console.log("🔹 Executing flashswap: borrow USDC, swap to DAI → WETH");
  const receipt = await executeFlashswap(flashswap, pairAddress, tokenBorrow, amountBorrow, path, slippageBps, abbot);
  console.log("✅ Flashswap executed! Gas used:", receipt.gasUsed.toString());

  // --- Check final balances ---
  const finalWETH = await (await getToken("WETH", provider)).contract.balanceOf(flashswap.address);
  console.log("Flashswap contract WETH balance (profit):", ethers.formatUnits(finalWETH, 18));

  // Withdraw profit to Abbot
  const withdrawTx = await flashswap.connect(abbot).withdrawToken(addresses.TOKENS.WETH, abbot.address);
  await withdrawTx.wait();
  console.log("💰 Profit withdrawn to Abbot:", ethers.formatUnits(await (await getToken("WETH", provider)).contract.balanceOf(abbot.address), 18));
}

main().catch(console.error);



// scripts/flashswap-run.cjs
const hre = require("hardhat");
const { ethers } = hre;
const addresses = require("../../utils/addresses.cjs");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Deploy contract
  const Flashswap = await ethers.getContractFactory("UniswapV2Flashswap");
  const flashswap = await Flashswap.deploy(addresses.ROUTERS.UNIV2);
  // await flashswap.deployed();
  await flashswap.waitForDeployment(); 
  console.log("Flashswap deployed:", flashswap.address);

  // Example: borrow USDC from USDC/DAI pool
  const factory = new ethers.Contract(addresses.FACTORIES.UNIV2, require("../../utils/abis.cjs").UNIV2_FACTORY, ethers.provider);
  const pairAddress = await factory.getPair(addresses.TOKENS.USDC, addresses.TOKENS.DAI);
  console.log("Pair address:", pairAddress);

  const amountBorrow = ethers.parseUnits("1000", 6); // 1000 USDC
  const path = [addresses.TOKENS.USDC, addresses.TOKENS.DAI]; // swap path
  const slippageBps = 50; // 0.5% slippage

  const tx = await flashswap.startFlashswap(pairAddress, 
    addresses.TOKENS.USDC, 
    amountBorrow, 
    path, 
    slippageBps,
  {
    gasLimit: 3_000_000,             // safe upper bound
    maxFeePerGas: 20000000000,  // must be >= baseFeePerGas
    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"), // tip to miner
  });

  await tx.wait();
  console.log("Flashswap executed!");
}

main().catch(console.error);

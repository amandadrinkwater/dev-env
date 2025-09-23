// scripts/deploy-arb-exec.js
// Usage: npx hardhat run --network localhost scripts/deploy-arb-exec.js

const hre = require("hardhat");
const { ethers } = hre;
const addresses = require("../utils/addresses.cjs");

async function main() {
  const routerAddr = addresses.ROUTERS.UNIV2;
  const [deployer] = await ethers.getSigners();

  const Arb = await ethers.getContractFactory("ArbitrageExecutor");
  const arb = await Arb.deploy(routerAddr);
  await arb.deployed();

  console.log("ArbitrageExecutor deployed at:", arb.address);
}

main().catch(console.error);

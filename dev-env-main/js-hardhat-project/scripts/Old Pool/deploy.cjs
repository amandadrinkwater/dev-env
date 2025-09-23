const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const TestToken = await ethers.getContractFactory("TestToken", deployer);

  const tokenA = await TestToken.deploy("TokenA", "TKA", ethers.parseEther("1000000"), {
    gasPrice: ethers.parseUnits("20", "gwei")
  });
  await tokenA.waitForDeployment();
  console.log("TokenA deployed to:", await tokenA.getAddress());

  const tokenB = await TestToken.deploy("TokenB", "TKB", ethers.parseEther("1000000"), {
    gasPrice: ethers.parseUnits("20", "gwei")
  });
  await tokenB.waitForDeployment();
  console.log("TokenB deployed to:", await tokenB.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

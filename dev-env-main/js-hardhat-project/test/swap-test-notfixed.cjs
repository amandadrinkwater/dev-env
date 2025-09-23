const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestToken deployment and basic swap", function () {
  it("Should deploy token and mint supply", async function () {
    const [deployer] = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory("TestToken", deployer);
    const token = await Token.deploy(
    "TokenA", "TKA", ethers.parseEther("1000000"),
    { gasPrice: ethers.parseUnits("20", "gwei") } // ✅ FIX
);

await token.waitForDeployment();
const token_address = await token.getAddress();

console.log("TestToken A deployed at:", token_address);

    const balance = await token.balanceOf(deployer.address);
    expect(balance).to.equal(ethers.utils.parseEther("1000000"));
  });
});

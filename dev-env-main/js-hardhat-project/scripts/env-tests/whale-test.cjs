


const hre = require("hardhat");
const { ethers } = hre;
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");

async function main() {
  const whaleAddress = addresses.WHALES.WETH;

  // Impersonate whale
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whaleAddress],
  });
  const whale = await ethers.getSigner(whaleAddress);

  // Contract for WETH
  const WETH = new ethers.Contract(addresses.TOKENS.WETH, abis.ERC20, whale);

  const whaleBal = await WETH.balanceOf(whaleAddress);
  console.log("Whale WETH balance:", whaleBal.toString());
}

main().catch(console.error);


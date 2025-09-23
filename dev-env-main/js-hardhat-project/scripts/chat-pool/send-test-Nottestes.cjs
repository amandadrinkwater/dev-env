
const hre = require("hardhat");
const { ethers } = hre;
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");

async function main() {
  const whaleAddress = addresses.WHALES.WETH[0];

  // Impersonate whale
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whaleAddress],
  });
 
  await hre.network.provider.send("hardhat_setBalance", [
  whaleAddress,
    "0xde0b6b3a7640000", // 1 ETH
  ]);

  const whale = await ethers.getSigner(whaleAddress);

  // Contract for WETH
  const WETH = new ethers.Contract(addresses.TOKENS.WETH, abis.ERC20, whale);

  const whaleBal = await WETH.balanceOf(whaleAddress);
  console.log("Whale WETH balance:", whaleBal.toString());


  const addressTo = addresses.WALLETS.MAINNET01;
  const recipientBal = await WETH.balanceOf(addressTo);


  console.log("Recipient WETH Balance: ", recipientBal.toString());

  const [executor] = await ethers.getSigners();

  console.log("Excutor Address: ", executor.address);
  //await WETH.transfer(executor.address, whaleBal / 10n);
  console.log("Executor balance after transfer:", (await WETH.balanceOf(executor.address)).toString());

  
}

main().catch(console.error);


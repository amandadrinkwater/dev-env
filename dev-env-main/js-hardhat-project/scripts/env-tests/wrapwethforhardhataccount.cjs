

const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");


const { ethers } = require('hardhat');

const WETHaddress = addresses.TOKENS.WETH;
const ERC20_ABI = abis.ERC20;

async function main() {

    // Instead of WETH, use WETH
console.log("\n💎 Wrapping WETH...");

const provider = ethers.provider;

const network = await provider.getNetwork();
console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);


/*const whaleAddress = addresses.WHALES.WETH[0];


    // Impersonate whale

    await provider.send(
      "hardhat_impersonateAccount",
      [whaleAddress]
    );

const whaleSigner = await ethers.getSigner(whaleAddress);
console.log('Whale Address: ' + (whaleSigner).address);*/

const whaleAccount = addresses.HARDHAT_ACCOUNTS.Abbot;

const whaleSigner = new ethers.Wallet(whaleAccount.privKey, provider);


const whaleBalance = await provider.getBalance(whaleAccount.address);
console.log('Whale ETH Balance: ', whaleBalance);
  
const WETH = new ethers.Contract(WETHaddress, ERC20_ABI, provider);

const nameWETH = await WETH.name();
const symbolWETH = await WETH.symbol();
const digitsWETH = await WETH.decimals();
const totalSupplyWETH = await WETH.totalSupply();

console.log('WETH Address: ', await WETH.getAddress());
  console.log('WETH Name:', nameWETH);
  console.log('WETH Symbol:', symbolWETH);
  console.log('WETH Digits: ', digitsWETH)
  console.log('WETH Total Supply:', ethers.formatEther(totalSupplyWETH));
    
  
const WETHWithWhale = WETH.connect(whaleSigner);

const whaleWETHBalance = await WETHWithWhale.balanceOf(whaleSigner.address);
console.log('Whale WETH balance:', ethers.formatUnits(whaleWETHBalance, 18)); // USDC has 6 decimals

const wrapAmount = ethers.parseEther("500");
//const wrapTx = await WETHWithWhale.deposit({ value: wrapAmount });
//await wrapTx.wait();

const wrapTx = await whaleSigner.sendTransaction({
    to: WETHaddress,
    value: wrapAmount
});

await wrapTx.wait();
console.log("✅ Wrapped by sending ETH directly to WETH contract");

console.log("✅ Wrapped 500 ETH to WETH"); 

const whaleWETHBalanceAfter = await WETHWithWhale.balanceOf(whaleSigner.address);
console.log('Whale WETH balance after:', ethers.formatUnits(whaleWETHBalanceAfter, 18)); // USDC has 6 decimals


/*
// Wrap ETH to WETH
const WETHWithWhale = WETH.connect(whale);
const wrapAmount = ethers.parseEther("500");
const wrapTx = await WETHWithWhale.deposit({ value: wrapAmount });
await wrapTx.wait();
console.log("✅ Wrapped 500 ETH to WETH"); */


}

main().catch(console.error);


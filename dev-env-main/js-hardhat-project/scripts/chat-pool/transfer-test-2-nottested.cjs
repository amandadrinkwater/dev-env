


/*

suggestion from deep to work in both environments

const hre = require("hardhat");

async function main() {
  // Get the provider from Hardhat
  const provider = hre.ethers.provider;
  
  // Use Hardhat's built-in ethers
  const { ethers } = hre;
  
  // Your code here...
}

main();


*/

const { ethers } = require('ethers');
const addresses = require("../utils/addresses.cjs");

async function main() {
  // Connect to your local Hardhat node (default port 8545)
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  
  // Check if connected to forked network
  const network = await provider.getNetwork();
  console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
  
  // Get some mainnet data (example: WETH contract)
  const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const WETH_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)'
  ];
  
  const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, provider);
  
  // Read data from the forked mainnet
  const name = await wethContract.name();
  const symbol = await wethContract.symbol();
  const totalSupply = await wethContract.totalSupply();
  
  console.log('WETH Name:', name);
  console.log('WETH Symbol:', symbol);
  console.log('WETH Total Supply:', ethers.formatEther(totalSupply));
  
  // You can also impersonate accounts and send transactions
  await impersonateAndSendTransactions(provider);
}

async function impersonateAndSendTransactions(provider) {
  // Impersonate a whale account (example: Vitalik's address)
  const VITALIK = addresses.WALLETS.VITALIK;
  
  // Use Hardhat's impersonateAccount (requires hardhat network)
  await provider.send('hardhat_impersonateAccount', [VITALIK]);
  
  // Get signer for the impersonated account
  const vitalikSigner = await provider.getSigner(VITALIK);
  
  // Check balance
  const balance = await provider.getBalance(VITALIK);
  console.log('Vitalik balance:', ethers.formatEther(balance), 'ETH');
  
  // You can now send transactions from this account
  // Example: send some ETH
  //const [sender] = await ethers.getSigners();

  const sender = addresses.WALLETS.MAINNET01

  const receiver = await sender.getAddress();
  const receiverBal = await sender.getBalance();

/*

const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat #1
  const sender = new ethers.Wallet(privateKey, provider);
  

*/

  console.log(`Receiver address: ${receiver.toString()}`);
   console.log(`Receiver Balance: ${receiverBal.toString()}`);

  const tx = await vitalikSigner.sendTransaction({
    to: await sender.getAddress(),
    value: ethers.parseEther('1.0')
  });
  
  console.log('Sent 1 ETH from Vitalik:', tx.hash);

  const receiverBal2 = await sender.getBalance();
  console.log('Receiver balance:', ethers.formatEther(receiverBal2), 'ETH');

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
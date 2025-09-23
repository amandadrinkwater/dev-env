

const { ethers } = require('ethers');
const addresses = require("../utils/addresses.cjs");

async function main() {
  const provider = new ethers.JsonRpcProvider('http://localhost:8545'); // make sure that hardhat node is running here
  
  const network = await provider.getNetwork();
  console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
  
  const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  const WETH_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)'
  ];
  
  const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, provider);
  
  const name = await wethContract.name();
  const symbol = await wethContract.symbol();
  const totalSupply = await wethContract.totalSupply();
  
  console.log('WETH Name:', name);
  console.log('WETH Symbol:', symbol);
  console.log('WETH Total Supply:', ethers.formatEther(totalSupply));
  
  
  await impersonateAndSendTransactions(provider);
}

async function impersonateAndSendTransactions(provider) {
  const VITALIK = addresses.WALLETS.VITALIK;
  
  await provider.send('hardhat_impersonateAccount', [VITALIK]);
  
  const balance = await provider.getBalance(VITALIK);
  console.log('Vitalik balance:', ethers.formatEther(balance), 'ETH');
  
  //const receiverPrivateKey = addresses.WALLETS_KEYS.MAINNET01; // Impersonated at config time

  const receiverPrivateKey = addresses.WALLETS.MAINNET02.privKey;// not impersonated
  
  const receiverWallet = new ethers.Wallet(receiverPrivateKey, provider);
  const receiverAddress = receiverWallet.address;
  
  const receiverBalBefore = await provider.getBalance(receiverAddress);
  console.log(`Receiver address: ${receiverAddress}`);
  console.log(`Receiver Balance before: ${ethers.formatEther(receiverBalBefore)} ETH`);
  
  try {
    // Get current gas parameters for EIP-1559
    const feeData = await provider.getFeeData();
    
    console.log('Current gas data:', {
      maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei'),
      maxPriorityFeePerGas: ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei'),
      gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei')
    });
    
    // Use EIP-1559 transaction format
    const txHash = await provider.send('eth_sendTransaction', [{
      from: VITALIK,
      to: receiverAddress,
      value: ethers.toQuantity(ethers.parseEther('0.03')),
      gas: ethers.toQuantity(30000),
      // Use EIP-1559 gas fields instead of gasPrice
      maxFeePerGas: ethers.toQuantity(feeData.maxFeePerGas || ethers.parseUnits('20', 'gwei')),
      maxPriorityFeePerGas: ethers.toQuantity(feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei')),
      type: '0x2' // EIP-1559 transaction type
    }]);
    
    console.log('Sent 1 ETH from Vitalik. Transaction hash:', txHash);
    
    // Wait for transaction confirmation
    const receipt = await provider.waitForTransaction(txHash);
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    const receiverBalAfter = await provider.getBalance(receiverAddress);
    console.log('Receiver balance after:', ethers.formatEther(receiverBalAfter), 'ETH');
    
  } catch (error) {
    console.error('Transaction failed:', error);
  }
  
  await provider.send('hardhat_stopImpersonatingAccount', [VITALIK]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
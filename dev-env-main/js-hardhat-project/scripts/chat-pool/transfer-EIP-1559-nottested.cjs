const { ethers } = require('ethers');

/**
 * Transfer funds using EIP-1559 transaction (Type 2)
 * @param {string} rpcUrl - RPC endpoint URL
 * @param {string} privateKey - Sender's private key
 * @param {string} toAddress - Recipient address
 * @param {string|number} amount - Amount in ETH to transfer
 * @param {Object} options - Additional transaction options
 * @returns {Promise<Object>} Transaction receipt
 */
async function transferEIP1559(rpcUrl, privateKey, toAddress, amount, options = {}) {
  // Validate inputs
  if (!ethers.utils.isAddress(toAddress)) {
    throw new Error(`Invalid recipient address: ${toAddress}`);
  }

  // Setup provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Parse amount
  const value = ethers.utils.parseEther(amount.toString());
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  if (balance.lt(value)) {
    throw new Error(`Insufficient balance. Required: ${ethers.utils.formatEther(value)} ETH, Available: ${ethers.utils.formatEther(balance)} ETH`);
  }

  // Get gas data
  const feeData = await provider.getFeeData();
  
  // Build transaction
  const tx = {
    to: toAddress,
    value: value,
    type: 2,
    maxFeePerGas: options.maxFeePerGas || feeData.maxFeePerGas,
    maxPriorityFeePerGas: options.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas,
    gasLimit: options.gasLimit || 21000,
    nonce: options.nonce || await provider.getTransactionCount(wallet.address),
    chainId: options.chainId || (await provider.getNetwork()).chainId
  };

  // Send transaction
  const transaction = await wallet.sendTransaction(tx);
  console.log(`EIP-1559 Transaction sent: ${transaction.hash}`);
  
  // Wait for confirmation
  const receipt = await transaction.wait();
  console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
  
  return receipt;
}

/**
 * Transfer funds using legacy transaction (Type 0)
 * @param {string} rpcUrl - RPC endpoint URL
 * @param {string} privateKey - Sender's private key
 * @param {string} toAddress - Recipient address
 * @param {string|number} amount - Amount in ETH to transfer
 * @param {Object} options - Additional transaction options
 * @returns {Promise<Object>} Transaction receipt
 */
async function transferLegacy(rpcUrl, privateKey, toAddress, amount, options = {}) {
  // Validate inputs
  if (!ethers.utils.isAddress(toAddress)) {
    throw new Error(`Invalid recipient address: ${toAddress}`);
  }

  // Setup provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Parse amount
  const value = ethers.utils.parseEther(amount.toString());
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  if (balance.lt(value)) {
    throw new Error(`Insufficient balance. Required: ${ethers.utils.formatEther(value)} ETH, Available: ${ethers.utils.formatEther(balance)} ETH`);
  }

  // Get gas price
  const gasPrice = options.gasPrice || (await provider.getGasPrice());
  
  // Build transaction
  const tx = {
    to: toAddress,
    value: value,
    type: 0,
    gasPrice: gasPrice,
    gasLimit: options.gasLimit || 21000,
    nonce: options.nonce || await provider.getTransactionCount(wallet.address),
    chainId: options.chainId || (await provider.getNetwork()).chainId
  };

  // Send transaction
  const transaction = await wallet.sendTransaction(tx);
  console.log(`Legacy Transaction sent: ${transaction.hash}`);
  
  // Wait for confirmation
  const receipt = await transaction.wait();
  console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
  
  return receipt;
}

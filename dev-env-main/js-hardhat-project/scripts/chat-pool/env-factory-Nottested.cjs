

// ✅ CLEAN SEPARATION
class BalanceService {
  constructor(provider) {
    this.provider = provider;
  }
  
  async getBalance(address) {
    const balance = await this.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }
}

// Development setup
if (process.env.NODE_ENV === 'development') {
  const { ethers } = require("hardhat");
  module.exports = new BalanceService(ethers.provider);
} 
// Production setup
else {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  module.exports = new BalanceService(provider);
}
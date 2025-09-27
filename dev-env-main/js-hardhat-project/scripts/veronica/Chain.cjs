const { ethers } = require("ethers");

const CHAIN_TYPES = {
  HARDHAT: 'hardhat',
  ETHEREUM_MAINNET: 'ethereum_mainnet',
  ETHEREUM_SEPOLIA: 'ethereum_sepolia',
  POLYGON_MAINNET: 'polygon_mainnet',
  POLYGON_MUMBAI: 'polygon_mumbai',
  ARBITRUM_MAINNET: 'arbitrum_mainnet',
  OPTIMISM_MAINNET: 'optimism_mainnet',
  DEFAULT: 'default'
};

const CHAIN_CONFIGS = {
  [CHAIN_TYPES.ETHEREUM_MAINNET]: {
    rpcUrl: process.env.ETHEREUM_RPC_URL || "https://mainnet.infura.io/v3/",
    chainId: 1,
    name: "Ethereum Mainnet"
  },
  [CHAIN_TYPES.ETHEREUM_SEPOLIA]: {
    rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/",
    chainId: 11155111,
    name: "Ethereum Sepolia"
  },
  [CHAIN_TYPES.POLYGON_MAINNET]: {
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    chainId: 137,
    name: "Polygon Mainnet"
  },
  [CHAIN_TYPES.POLYGON_MUMBAI]: {
    rpcUrl: process.env.POLYGON_MUMBAI_RPC_URL || "https://rpc-mumbai.matic.today",
    chainId: 80001,
    name: "Polygon Mumbai"
  },
  [CHAIN_TYPES.HARDHAT]: {
    rpcUrl: "http://localhost:8545",
    chainId: 31337,
    name: "Hardhat Network"
  }
};

class Chain {
  constructor(provider, chainType = CHAIN_TYPES.DEFAULT) {
    this.provider = provider;
    this.chainType = chainType;
    this.network = null;
    this.config = CHAIN_CONFIGS[chainType] || null;
  }

  async init() {
    this.network = await this.provider.getNetwork();
    if (this.config && this.network.chainId !== BigInt(this.config.chainId)) {
      console.warn(`Chain ID mismatch: expected ${this.config.chainId}, got ${this.network.chainId}`);
    }
  }

  async getChainActualStatus() {  
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();
      
      // Use gasPrice if available, otherwise use maxFeePerGas for EIP-1559 chains
      const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
      
      return {
        network, 
        blockNumber, 
        gasPrice: gasPrice ? `${ethers.formatUnits(gasPrice, "gwei")} gwei` : 'Unknown',
        gasPriceWei: gasPrice ? gasPrice.toString() : 'Unknown',
        baseFeePerGas: feeData.lastBaseFeePerGas ? `${ethers.formatUnits(feeData.lastBaseFeePerGas, "gwei")} gwei` : undefined,
        maxFeePerGas: feeData.maxFeePerGas ? `${ethers.formatUnits(feeData.maxFeePerGas, "gwei")} gwei` : undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? `${ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei")} gwei` : undefined
      };
    } catch (error) {
      console.error("Error fetching chain status:", error);
      throw error;
    }
  }

  async printToConsole() {
    console.log(`\n=== Chain Status ===`);  
    const status = await this.getChainActualStatus();
    console.log("Network:", status.network.name);
    console.log("Chain ID:", status.network.chainId);
    console.log("Latest Block Number:", status.blockNumber);
    console.log("Gas Price:", status.gasPrice);
    
    if (status.baseFeePerGas) {
      console.log("Base Fee Per Gas:", status.baseFeePerGas);
    }
    if (status.maxFeePerGas) {
      console.log("Max Fee Per Gas:", status.maxFeePerGas);
    }
    if (status.maxPriorityFeePerGas) {
      console.log("Max Priority Fee Per Gas:", status.maxPriorityFeePerGas);
    }
    console.log(`====================\n`);
  }

  async getGasInfo() {
    try {
      const feeData = await this.provider.getFeeData();
      
      return {
        gasPrice: feeData.gasPrice ? `${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei` : undefined,
        baseFeePerGas: feeData.lastBaseFeePerGas ? `${ethers.formatUnits(feeData.lastBaseFeePerGas, "gwei")} gwei` : undefined,
        maxFeePerGas: feeData.maxFeePerGas ? `${ethers.formatUnits(feeData.maxFeePerGas, "gwei")} gwei` : undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? `${ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei")} gwei` : undefined
      };
    } catch (error) {
      console.error("Error fetching gas info:", error);
      return {};
    }
  }

  // Factory method to create chain instances
  static async create(chainType, options = {}) {
    let provider;
    
    switch(chainType) {
      case CHAIN_TYPES.HARDHAT:
        // Try to use Hardhat's provider if available
        try {
          const hardhat = require("hardhat");
          provider = hardhat.ethers.provider;
        } catch (error) {
          console.log("Hardhat not available, using default provider");
          const config = CHAIN_CONFIGS[chainType];
          provider = new ethers.JsonRpcProvider(config.rpcUrl);
        }
        break;
        
      default:
        const config = CHAIN_CONFIGS[chainType];
        if (!config) {
          throw new Error(`Unknown chain type: ${chainType}`);
        }
        
        const rpcUrl = options.rpcUrl || config.rpcUrl;
        const finalRpcUrl = options.apiKey ? `${rpcUrl}${options.apiKey}` : rpcUrl;
        provider = new ethers.JsonRpcProvider(finalRpcUrl);
    }

    const chain = new Chain(provider, chainType);
    await chain.init();
    return chain;
  }

  static async createHardhat() {
    return this.create(CHAIN_TYPES.HARDHAT);
  }

  static async createEthereumMainnet(options = {}) {
    return this.create(CHAIN_TYPES.ETHEREUM_MAINNET, options);
  }
}

// Singleton instances
let instances = {};

Chain.getInstance = async (chainType, options = {}) => {
  if (!instances[chainType]) {
    instances[chainType] = await Chain.create(chainType, options);
  }
  return instances[chainType];
};

Chain.clearInstances = () => {
  instances = {};
};

module.exports = { 
  Chain, 
  CHAIN_TYPES,
  CHAIN_CONFIGS
};
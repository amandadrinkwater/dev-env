

// this could be shared like monostate ?

const { ethers } = require("ethers");
const { RPCs } = require("../utils/rpcs.cjs");

const CHAIN_TYPES = {
  HARDHAT: 'hardhat',
  ETHEREUM: 'ethereum',
  DEFAULT: 'default'
};

const CHAIN_CONFIGS = {
  ETHEREUM_MAINNET: {
    rpcUrl: process.env.ETHEREUM_RPC_URL || RPCs.mainnetInfura,
    chainId: 1,
    name: "Ethereum Mainnet"
  },
  ETHEREUM_SEPOLIA: {
    rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC_URL || RPCs.sepoliaAlchemy,
    chainId: 11155111,
    name: "Ethereum Sepolia"
  },
  /*POLYGON_MAINNET: {
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    chainId: 137,
    name: "Polygon Mainnet"
  },
  POLYGON_AMOY: {
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/eJL1q2Fuwb94bHgnfERZxCNjP3AJKasH",
    chainId: 80002,
    name: "Polygon Amoy"
  }, */
  HARDHAT: {
    rpcUrl: "http://localhost:8545",
    chainId: 31337,
    name: "Hardhat Network"
  }
};


class Chain {
  constructor(ethers, chainType = CHAIN_TYPES.DEFAULT) {
    this.ethers = ethers;
    this.provider = ethers.provider;
    this.chainType = chainType;
    this.network = null;
  }

  async init() {
    this.network = await this.provider.getNetwork();
  }

  // max fee etc

  async getChainActualStatus() {  
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getGasPrice();

      const gasInfo = await this.getGasInfo();
        
        return {    network, 
                    blockNumber, 
                    gasPrice: ethers.formatUnits(gasPrice, "gwei"),
                    ...gasInfo
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
    console.log("Current Gas Price:", `${status.gasPrice} gwei`);
    if (status.maxFeePerGas) {
      console.log("Max Fee Per Gas:", status.maxFeePerGas);
      console.log("Max Priority Fee Per Gas:", status.maxPriorityFeePerGas);
    }
    console.log(`====================\n`);
}

  async getGasInfo() {
    try {
      const feeData = await this.provider.getFeeData();
      
      return {
        gasPrice: feeData.gasPrice ? `${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei` : undefined,
        maxFeePerGas: feeData.maxFeePerGas ? `${ethers.formatUnits(feeData.maxFeePerGas, "gwei")} gwei` : undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? `${ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei")} gwei` : undefined
      };
    } catch (error) {
      console.error("Error fetching gas info:", error);
      return {};
    }
  }

  async getLatestBlock() {
    try {
      this.block = await this.provider.getBlock("latest");
      this.blockNumber = this.block.number;
      return this.block;
    } catch (error) {
      console.error("Error fetching latest block:", error);
      throw error;
    }
  }

  static async create(ethersProvider, chainType = CHAIN_TYPES.DEFAULT) {
    let chain;
    
    switch(chainType) {
      case CHAIN_TYPES.HARDHAT:
        chain = new HardhatChain(ethersProvider);
        break;
      default:
        chain = new Chain(ethersProvider, chainType);
    }

    await chain.init();
    return chain;
  }

  static async createHardhat() {    
    const hre = require("hardhat");
    return Chain.create(hre.ethers, CHAIN_TYPES.HARDHAT);
  }

  static async createEthereumMainnet() {
    const { ethers } = require("ethers");
    const provider = ethers.getDefaultProvider('mainnet', {
      infura: process.env.INFURA_API_KEY,
      alchemy: process.env.ALCHEMY_API_KEY,
      etherscan: process.env.ETHERSCAN_API_KEY,
    });
    return Chain.create(provider, CHAIN_TYPES.ETHEREUM);
  }

  static async createEthereumSepolia() {
    const { ethers } = require("ethers");
    const provider = ethers.getDefaultProvider('sepolia', {
      infura: process.env.INFURA_API_KEY,
      alchemy: process.env.ALCHEMY_API_KEY,
      etherscan: process.env.ETHERSCAN_API_KEY,
    });
    return Chain.create(provider, CHAIN_TYPES.ETHEREUM);
  }

}

class HardhatChain extends Chain {
  constructor(ethersProvider) {
    super(ethersProvider, CHAIN_TYPES.HARDHAT);
  }
}
module.exports = { Chain, CHAIN_TYPES };
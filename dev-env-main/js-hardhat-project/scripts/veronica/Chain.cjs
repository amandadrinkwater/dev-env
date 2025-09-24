

// this could be shared like monostate ?

const { ethers } = require("ethers");

const CHAIN_TYPES = {
  HARDHAT: 'hardhat',
  ETHEREUM: 'ethereum',
  DEFAULT: 'default'
};

class Chain {
  constructor(ethersProvider, chainType = CHAIN_TYPES.DEFAULT) {
    this.ethers = ethersProvider;
    this.provider = ethersProvider.provider;
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
}

class HardhatChain extends Chain {
  constructor(ethersProvider) {
    super(ethersProvider, CHAIN_TYPES.HARDHAT);
  }
}
module.exports = { Chain, CHAIN_TYPES };
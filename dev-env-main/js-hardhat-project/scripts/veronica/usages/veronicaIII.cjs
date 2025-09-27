

const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../../utils/addresses.cjs");
const abis = require("../../utils/abis.cjs");
const ERC20Token = require("../ERC20Token.cjs");

const ERC20_ABI = abis.ERC20;

// Constants
const CHAIN_TYPES = {
  HARDHAT: 'hardhat',
  ETHEREUM: 'ethereum',
  DEFAULT: 'default'
};

class Chain {
  constructor(ethersProvider, chainType = CHAIN_TYPES.DEFAULT) {
    this.ethers = ethersProvider;
    this.provider = ethersProvider.provider; // ??
    this.chainType = chainType;
    this.network = null;
  }

  async init() {
    this.network = await this.provider.getNetwork();
    await this.getLatestBlock();
    
    console.log(`\n=== Connected to ${this.network.name} network ===`);
    console.log("Chain ID:", this.network.chainId);

    const gasInfo = await this.getGasInfo();
    console.log("Gas Info:", gasInfo);
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

class Account {
  constructor(address, chain) {
    this.address = address;
    this.chain = chain;
    this.provider = chain.provider;
    this.signer = null;
  }

  async init() {
    try {
      this.signer = await this.chain.ethers.getSigner(this.address);
      return this;
    } catch (error) {
      console.error(`Error initializing account ${this.address}:`, error);
      throw error;
    }
  }

  async getNativeBalance() {
    try {
      const rawBalance = await this.provider.getBalance(this.address);
      return ethers.formatEther(rawBalance);
    } catch (error) {
      console.error(`Error fetching native balance for ${this.address}:`, error);
      throw error;
    }
  }

  async transferNativeToken(toAddress, amount, options = {}) {
    try {
      console.log(`\n💸 Transferring ${amount} ETH from ${this.address} to ${toAddress}...`);
      
      const value = ethers.parseEther(amount.toString());
      const senderBalance = await this.getNativeBalance();
      
      if (senderBalance < value) {
        throw new Error(`Insufficient ETH balance. Needed: ${ethers.formatEther(value)} ETH, Has: ${ethers.formatEther(senderBalance)} ETH`);
      }
      
      const feeData = await this.provider.getFeeData();
      const txParams = {
        to: toAddress,
        value: value,
        gasLimit: options.gasLimit || await this.signer.estimateGas({ to: toAddress, value: value })
      };
      
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        txParams.maxFeePerGas = options.maxFeePerGas || feeData.maxFeePerGas;
        txParams.maxPriorityFeePerGas = options.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas;
      } else {
        txParams.gasPrice = options.gasPrice || feeData.gasPrice;
      }
      
      console.log("Transaction parameters:", {
        value: ethers.formatEther(value),
        gasLimit: txParams.gasLimit.toString(),
        ...(txParams.maxFeePerGas && { 
          maxFeePerGas: `${ethers.formatUnits(txParams.maxFeePerGas, "gwei")} gwei`,
          maxPriorityFeePerGas: `${ethers.formatUnits(txParams.maxPriorityFeePerGas, "gwei")} gwei`
        }),
        ...(txParams.gasPrice && { 
          gasPrice: `${ethers.formatUnits(txParams.gasPrice, "gwei")} gwei` 
        })
      });
      
      const tx = await this.signer.sendTransaction(txParams);
      console.log(`Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`Effective gas price: ${ethers.formatUnits(receipt.gasPrice, "gwei")} gwei`);
      
      return receipt;
    } catch (error) {
      console.error("Error transferring native token:", error);
      throw error;
    }
  }

  static async create(chain, address) {
    let account;
    
    switch (chain.chainType) {
      case CHAIN_TYPES.HARDHAT:
        account = new HardhatAccount(address, chain);
        break;
      default:
        account = new Account(address, chain);
    }
    
    await account.init();
    return account;
  }
}

class HardhatAccount extends Account {
  async init() {
    await super.init();
    
    try {
      await this.provider.send("hardhat_impersonateAccount", [this.address]);
      this.signer = await this.chain.ethers.getSigner(this.address);
    } catch (error) {
      console.error(`Error impersonating account ${this.address}:`, error);
      throw error;
    }
  }

  async setBalance(amount) {
    try {
      await this.provider.send("hardhat_setBalance", [
        this.address,
        ethers.toBeHex(ethers.parseEther(amount.toString()))
      ]);
      console.log(`Set balance of ${this.address} to ${amount} ETH`);
    } catch (error) {
      console.error(`Error setting balance for ${this.address}:`, error);
      throw error;
    }
  }
}

/*
class ERC20Token {
  constructor(tokenAddress, chain) {
    this.tokenAddress = tokenAddress;
    this.chain = chain;
    this.provider = chain.provider;
    this.contract = new ethers.Contract(tokenAddress, ERC20_ABI, chain.provider);
    this.decimals = null;
    this.symbol = null;
    this.name = null;
  }

  async init() {
    try {
      [this.decimals, this.symbol, this.name] = await Promise.all([
        this.contract.decimals(),
        this.contract.symbol(),
        this.contract.name()
      ]);
      
      console.log("\nToken Initialized:");
      console.log("Address:", this.tokenAddress);
      console.log("Name:", this.name);
      console.log("Symbol:", this.symbol);
      console.log("Decimals:", this.decimals);
      
      return this;
    } catch (error) {
      console.error(`Error initializing token at ${this.tokenAddress}:`, error);
      throw error;
    }
  }

  async getTotalSupply() {
    try {
      const totalSupply = await this.contract.totalSupply();
      const formattedSupply = ethers.formatUnits(totalSupply, this.decimals);
      console.log("Total Supply:", formattedSupply);
      return { raw: totalSupply, formatted: formattedSupply };
    } catch (error) {
      console.error("Error fetching total supply:", error);
      throw error;
    }
  }

  async getBalance(account) {
    try {
      const rawBalance = await this.contract.balanceOf(account.address);
      const balance = ethers.formatUnits(rawBalance, this.decimals);
      
      console.log(`💰 ${this.symbol} Balance for ${account.address}:`, balance);
      return { raw: rawBalance, formatted: balance };
    } catch (error) {
      console.error(`Error fetching balance for ${account.address}:`, error);
      throw error;
    }
  }

  async transfer(fromAccount, toAccount, amount) {
    try {
      const transferAmount = ethers.parseUnits(amount, this.decimals);
      const tokenWithSigner = this.contract.connect(fromAccount.signer);
      
      console.log(`\n💸 Transferring ${amount} ${this.symbol} from ${fromAccount.address} to ${toAccount.address}...`);
      
      // Check balance before transfer
      const balance = await this.getBalance(fromAccount);
      if (BigInt(balance.raw) < transferAmount) {
        throw new Error(`Insufficient ${this.symbol} balance. Needed: ${amount}, Has: ${balance.formatted}`);
      }
      
      const tx = await tokenWithSigner.transfer(toAccount.address, transferAmount);
      const receipt = await tx.wait();
      
      console.log(`✅ Transfer successful in block: ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      console.error("Error transferring tokens:", error);
      throw error;
    }
  }

  static async create(tokenAddress, chain) {
    const token = new ERC20Token(tokenAddress, chain);
    await token.init();
    return token;
  }
}

*/

async function main() {
  try {
    const chain = await Chain.create(ethers, CHAIN_TYPES.HARDHAT);
    
    // Create accounts
    const whaleAccount = await Account.create(chain, addresses.WHALES.USDC);
    const abbotAccount = await Account.create(chain, addresses.HARDHAT_ACCOUNTS.Abbot.address);
    
    console.log('Whale Address:', whaleAccount.address);
    console.log('Whale ETH Balance:', await whaleAccount.getNativeBalance());
    
    // Initialize token
    const usdcToken = await ERC20Token.create(addresses.TOKENS.USDC, chain);
    
    // Get balances before transfer
    console.log("\n=== BEFORE TRANSFER ===");
    const whaleBalanceBefore = await usdcToken.getBalance(whaleAccount);
    const abbotBalanceBefore = await usdcToken.getBalance(abbotAccount);
    
    // Perform transfer
    await usdcToken.transfer(whaleAccount, abbotAccount, "10.5");
    
    // Get balances after transfer
    console.log("\n=== AFTER TRANSFER ===");
    await usdcToken.getBalance(whaleAccount);
    await usdcToken.getBalance(abbotAccount);
    
  } catch (error) {
    console.error("Main execution error:", error);
    process.exit(1);
  }
}

// Utility function for error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);
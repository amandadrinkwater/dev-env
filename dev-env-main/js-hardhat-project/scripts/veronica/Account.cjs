const { ethers } = require("ethers");
const Chain = require("./Chain.cjs");

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

  static checkAccountAddress(address) {
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid Ethereum address: ${address}`);
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
      const senderBalance = await this.provider.getBalance(this.address);

      if (senderBalance < value) {
        throw new Error(
          `Insufficient ETH balance. Needed: ${ethers.formatEther(value)} ETH, Has: ${ethers.formatEther(senderBalance)} ETH`
        );
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

  // ---------- Singleton Factory ----------
  static async create(chain, address) {
    Account.checkAccountAddress(address);

    const key = `${chain.chainType}:${address.toLowerCase()}`;
    if (!Account.instances.has(key)) {
      let account;
      switch (chain.chainType) {
        case Chain.CHAIN_TYPES.HARDHAT:
          account = new HardhatAccount(address, chain);
          break;
        default:
          account = new Account(address, chain);
      }
      await account.init();
      Account.instances.set(key, account);
    }
    return Account.instances.get(key);
  }
}

// storage for singleton instances
Account.instances = new Map();

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

Account.HardhatAccount = HardhatAccount;

module.exports = { Account };

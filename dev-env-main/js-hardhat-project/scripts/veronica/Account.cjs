const { ethers } = require("ethers");
const{ Chain } = require("./Chain.cjs");
const addresses = require("../utils/addresses.cjs");

class Account {
  constructor(address, chain) {
    this.address = address;
    this.chain = chain;
    this.provider = chain.provider;
    this.signer = null;
  }

   async init() {
    // to test, it is to be used with mainnet account and testnet accounts
   /*
    try {
      // Default: expect PRIVATE_KEY to be available for external (non-Hardhat) chains
      const pk = process.env.PRIVATE_KEY;
      if (!pk) {
        throw new Error(
          `No PRIVATE_KEY found for account ${this.address}. ` +
          `Use HardhatAccount/ImpersonatedHardhatAccount for local dev, ` +
          `or set PRIVATE_KEY in .env for external chains.`
        );
      }

      this.signer = new ethers.Wallet(pk, this.provider);

      // Safety check: does PK-derived address match this.address?
      const signerAddress = await this.signer.getAddress();
      if (signerAddress.toLowerCase() !== this.address.toLowerCase()) {
        console.warn(
          `⚠️ Warning: Provided address ${this.address} does not match private key address ${signerAddress}`
        );
      }*/

      return this; /*
    } catch (error) {
      console.error(`Error initializing account ${this.address}:`, error);
      throw error;
    } */
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
    
    // Initialize instances map if it doesn't exist
    if (!Account.instances) {
      Account.instances = new Map();
    }
    
    if (!Account.instances.has(key)) {
      let account;
      switch (chain.chainType) {
        case Chain.CHAIN_TYPES.HARDHAT:
          account = new ImpersonatedHardhatAccount(address, chain);
          break;
        default:
          account = new Account(address, chain);
      }
      await account.init();
      Account.instances.set(key, account);
    }
    return Account.instances.get(key);
  }

  // Clear instances (useful for testing)
  static clearInstances() {
    if (Account.instances) {
      Account.instances.clear();
    }
  }

  // Get all cached instances (for debugging)
  static getCachedInstances() {
    return Account.instances ? Array.from(Account.instances.keys()) : [];
  }

  // not a good way to create predefined accounts, but that works
  static async createWhaleUSDC() {

    const hardhatChain = await Chain.createHardhat();
    const whale = await Account.create(hardhatChain, addresses.WHALES.USDC);
    
    return whale;

  }

  static async createAbbot() {

    const hardhatChain = await Chain.createHardhat();
    const whale = await Account.create(hardhatChain, addresses.HARDHAT_ACCOUNTS.Abbot.address);
    
    return whale;

  }

  static async createMainnet01() {

    const mainnetChain = await Chain.createEthereumMainnet()
    const mainnet01 = await Account.create(mainnetChain, addresses.WALLETS.MAINNET01.address)

    const pk = addresses.WALLETS.MAINNET01.privKey

    mainnet01.signer = new ethers.Wallet(pk, mainnet01.provider);

    return mainnet01

  }

  static async createSepolia01() {

    // create a Spolia01 entry and then refactor here

    const sepoliaChain = await Chain.createEthereumSepolia()
    const sepolia01 = await Account.create(sepoliaChain, addresses.WALLETS.MAINNET01.address)

    const pk = addresses.WALLETS.MAINNET01.privKey

    sepolia01.signer = new ethers.Wallet(pk, sepolia01.provider);

    return sepolia01

  }

  /*
  // Factory method for creating predefined accounts
  static async createPredefined(accountName) {

    // it has many problems...  Not fully tested, not going to use now
    let chain;
    let address;
    
    switch(accountName) {
      case 'WhaleUSDC':
        chain = Chain.createHardhat()
        address = addresses.WHALES.USDC;
        break;
      case 'Abbot':
        chain = Chain.createHardhat()
        address = addresses.HARDHAT_ACCOUNTS.Abbot.address;
        break;
      case 'Costello':
        chain = Chain.createHardhat()
        address = addresses.HARDHAT_ACCOUNTS.Costello.address;
        break;
      case 'Baker':
        chain = Chain.createHardhat()
        address = addresses.HARDHAT_ACCOUNTS.Baker.address;
        break;
      case 'Mainnet01':
        chain = Chain.createEthereumMainnet()
        address = addresses.WALLETS.MAINNET01
      default:
        throw new Error(`Unknown predefined account: ${accountName}`);
    }
    
    return await Account.create(chain, address);
  }
    */

}
  

class HardhatAccount extends Account {
  
  async init() {
    try {
      // Hardhat provider supports getSigner directly
      this.signer = await this.provider.getSigner(this.address);
      return this;
    } catch (error) {
      console.error(`Error initializing Hardhat account ${this.address}:`, error);
      throw error;
    }
  }
  
  async setBalance(amount) {
    try {
      await this.provider.send("hardhat_setBalance", [
        this.address,
        ethers.toBeHex(ethers.parseEther(amount.toString()))
      ]);

      // Refresh the signer after balance change
      const ethersInstance = this.chain.ethers || ethers;
      this.signer = await ethersInstance.getSigner(this.address);

      console.log(`Set balance of ${this.address} to ${amount} ETH`);
    } catch (error) {
      console.error(`Error setting balance for ${this.address}:`, error);
      throw error;
    }
  }
}

class ImpersonatedHardhatAccount extends HardhatAccount {
  async init() {
    await super.init();
    try {
      await this.provider.send("hardhat_impersonateAccount", [this.address]);
      console.log(`Impersonated account: ${this.address}`);
    } catch (error) {
      console.error(`Error impersonating account ${this.address}:`, error);
      throw error;
    }
  }
  
}

// Initialize instances map
Account.instances = new Map();

module.exports = { Account };
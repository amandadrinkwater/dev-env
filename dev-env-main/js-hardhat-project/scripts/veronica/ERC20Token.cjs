const { ethers } = require("ethers");
const abis = require("../utils/abis.cjs");

const ERC20_ABI = abis.ERC20;

class ERC20Token {
  constructor(tokenAddress, chain) {
    if (!tokenAddress) throw new Error("Token address is required");
    if (!chain) throw new Error("Chain instance is required");
    
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

  async approve(account, spender, amount) {
    try {
      const approveAmount = ethers.parseUnits(amount, this.decimals);
      const tokenWithSigner = this.contract.connect(account.signer);
      
      console.log(`\n✅ Approving ${amount} ${this.symbol} for spender ${spender}...`);
      
      const tx = await tokenWithSigner.approve(spender, approveAmount);
      const receipt = await tx.wait();
      
      console.log(`✅ Approval successful in block: ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      console.error("Error approving tokens:", error);
      throw error;
    }
  }

  async allowance(owner, spender) {
    try {
      const allowanceAmount = await this.contract.allowance(owner, spender);
      const formattedAllowance = ethers.formatUnits(allowanceAmount, this.decimals);
      
      console.log(`Allowance for ${spender} from ${owner}:`, formattedAllowance);
      return { raw: allowanceAmount, formatted: formattedAllowance };
    } catch (error) {
      console.error("Error fetching allowance:", error);
      throw error;
    }
  }

  static async create(tokenAddress, chain) {
    const token = new ERC20Token(tokenAddress, chain);
    await token.init();
    return token;
  }
}

module.exports = ERC20Token;
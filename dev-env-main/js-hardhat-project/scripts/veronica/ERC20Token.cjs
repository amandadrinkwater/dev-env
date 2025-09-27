
/*

# Run transfer demo (default)
node ./scripts/veronica/ERC20Token.cjs

# Run allowance demo
node ./scripts/veronica/ERC20Token.cjs allowance

# Run transfer demo explicitly
node ./scripts/veronica/ERC20Token.cjs transfer

*/

const { ethers, assert } = require("ethers");
const abis = require("../utils/abis.cjs");

const { Chain, CHAIN_TYPES } = require("./Chain.cjs");
// const CHAIN_TYPES = Chain.CHAIN_TYPES;

const { Account } = require("./Account.cjs");
const addresses = require("../utils/addresses.cjs");

const ERC20_ABI = abis.ERC20;

class ERC20Token {
  constructor(tokenAddress, chain) {
    if (!tokenAddress) throw new Error("Token address is required");
    if (!chain) throw new Error("Chain instance is required");
    
    this.tokenAddress = tokenAddress;
    this.address = tokenAddress;  // Add this line to fix Pool.cjs compatibility
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

  getDecimals() {
    return this.decimals;
  }

  getSymbol() {
    return this.symbol;
  } 

  getName() {
    return this.name;
  } 

  // helper: fetch symbol and decimals
  async fetchTokenInfo(address, provider) {
    try {

      const symbol = this.getSymbol();
      const decimals = this.getDecimals();
      
      return { symbol, decimals };
    } catch (e) {
      return { symbol: "UNKNOWN", decimals: 0 }; // fallback
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
    const key = `${chain.chainType}:${ethers.getAddress(tokenAddress)}`;

    if (!ERC20Token.instances.has(key)) {
      const token = new ERC20Token(tokenAddress, chain);
      await token.init();
      ERC20Token.instances.set(key, token);
    }

    return ERC20Token.instances.get(key);
  }

static async createMultiple(chain, tokenAddresses) {
  return Promise.all(tokenAddresses.map(addr => ERC20Token.create(addr, chain)));
}

}

async function example_allowance_approve() {
  try {
    console.log("🚀 Starting ERC20Token Approve & Allowance Demo...\n");
    
    // You need to require hardhat to get ethers
    const hre = require("hardhat");
    const { ethers } = hre;
    
    // Initialize chain and accounts
    //const chain = await Chain.create(ethers, CHAIN_TYPES.HARDHAT);
    
    /*
    const whaleAccount = await Account.create(chain, addresses.WHALES.USDC);
    const abbotAccount = await Account.create(chain, addresses.HARDHAT_ACCOUNTS.Abbot.address);
    const bakerAccount = await Account.create(chain, addresses.HARDHAT_ACCOUNTS.Baker.address);
    */

    const whaleAccount = Account.PREDEFINED_ACCOUNTS.WhaleUSDC
    const abbotAccount = Account.PREDEFINED_ACCOUNTS.Abbot
    const bakerAccount = Account.PREDEFINED_ACCOUNTS.Baker

    console.log('📋 Account Information:');
    console.log('Whale Address:', whaleAccount.address);
    console.log('Abbot Address:', abbotAccount.address);
    console.log('Baker Address:', bakerAccount.address);
    
    // Initialize USDC token
    console.log("\n🪙 Initializing USDC Token...");
    const usdcToken = await ERC20Token.create(addresses.TOKENS.USDC, chain);
    
    // Demo 1: Check initial allowance (should be 0)
    console.log("\n" + "=".repeat(60));
    console.log("1. CHECKING INITIAL ALLOWANCE");
    console.log("=".repeat(60));
    
    const initialAllowance = await usdcToken.allowance(whaleAccount.address, abbotAccount.address);
    console.log(`💰 Initial allowance for Abbot to spend Whale's USDC: ${initialAllowance.formatted} USDC`);
    
    // Demo 2: Approve Abbot to spend Whale's USDC
    console.log("\n" + "=".repeat(60));
    console.log("2. APPROVING SPENDER");
    console.log("=".repeat(60));
    
    const approveAmount = "500";
    console.log(`✅ Approving Abbot to spend ${approveAmount} USDC from Whale's account...`);
    
    await usdcToken.approve(whaleAccount, abbotAccount.address, approveAmount);
    
    // Demo 3: Check allowance after approval
    console.log("\n" + "=".repeat(60));
    console.log("3. CHECKING ALLOWANCE AFTER APPROVAL");
    console.log("=".repeat(60));
    
    const allowanceAfterApproval = await usdcToken.allowance(whaleAccount.address, abbotAccount.address);
    console.log(`💰 Allowance after approval: ${allowanceAfterApproval.formatted} USDC`);
    
    // Demo 4: Check balances
    console.log("\n" + "=".repeat(60));
    console.log("4. CHECKING BALANCES");
    console.log("=".repeat(60));
    
    const whaleBalanceBefore = await usdcToken.getBalance(whaleAccount);
    const abbotBalanceBefore = await usdcToken.getBalance(abbotAccount);
    
    console.log(`Whale balance: ${whaleBalanceBefore.formatted} USDC`);
    console.log(`Abbot balance: ${abbotBalanceBefore.formatted} USDC`);
    
    // Demo 5: Approve a different amount to Baker
    console.log("\n" + "=".repeat(60));
    console.log("5. APPROVING MULTIPLE SPENDERS");
    console.log("=".repeat(60));
    
    const approveAmountBaker = "1000";
    console.log(`✅ Approving Baker to spend ${approveAmountBaker} USDC from Whale's account...`);
    
    await usdcToken.approve(whaleAccount, bakerAccount.address, approveAmountBaker);
    
    // Check both allowances
    const allowanceAbbot = await usdcToken.allowance(whaleAccount.address, abbotAccount.address);
    const allowanceBaker = await usdcToken.allowance(whaleAccount.address, bakerAccount.address);
    
    console.log(`📊 Allowance Summary:`);
    console.log(`   - Abbot: ${allowanceAbbot.formatted} USDC`);
    console.log(`   - Baker: ${allowanceBaker.formatted} USDC`);
    
    // Demo 6: Update existing allowance (increase)
    console.log("\n" + "=".repeat(60));
    console.log("6. UPDATING EXISTING ALLOWANCE");
    console.log("=".repeat(60));
    
    const newApproveAmount = "1500";
    console.log(`🔄 Increasing Abbot's allowance to ${newApproveAmount} USDC...`);
    
    await usdcToken.approve(whaleAccount, abbotAccount.address, newApproveAmount);
    
    const updatedAllowance = await usdcToken.allowance(whaleAccount.address, abbotAccount.address);
    console.log(`💰 Updated allowance for Abbot: ${updatedAllowance.formatted} USDC`);
    
    // Demo 7: Set allowance to 0 (revoke permission)
    console.log("\n" + "=".repeat(60));
    console.log("7. REVOKING ALLOWANCE");
    console.log("=".repeat(60));
    
    console.log(`❌ Revoking Baker's allowance by setting it to 0...`);
    
    await usdcToken.approve(whaleAccount, bakerAccount.address, "0");
    
    const revokedAllowance = await usdcToken.allowance(whaleAccount.address, bakerAccount.address);
    console.log(`💰 Baker's allowance after revocation: ${revokedAllowance.formatted} USDC`);
    
    // Demo 8: Final allowance status
    console.log("\n" + "=".repeat(60));
    console.log("8. FINAL ALLOWANCE STATUS");
    console.log("=".repeat(60));
    
    const finalAllowanceAbbot = await usdcToken.allowance(whaleAccount.address, abbotAccount.address);
    const finalAllowanceBaker = await usdcToken.allowance(whaleAccount.address, bakerAccount.address);
    
    console.log("📋 Final Allowance Summary:");
    console.log(`   - Abbot can spend: ${finalAllowanceAbbot.formatted} USDC`);
    console.log(`   - Baker can spend: ${finalAllowanceBaker.formatted} USDC`);
    
    console.log("\n🎉 ERC20Token Approve & Allowance Demo Completed Successfully!");
    
  } catch (error) {
    console.error("❌ Demo execution error:", error);
    throw error;
  }
}

async function example_transfer() {
  try {
    // You need to require hardhat to get ethers
    const hre = require("hardhat");
    const { ethers } = hre;
    
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
    throw error;
  }
}

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Add graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('💤 Gracefully shutting down from SIGTERM');
  process.exit(0);
});

ERC20Token.instances = new Map();

module.exports = { ERC20Token, example_allowance_approve, example_transfer };

// Run demonstration if this file is executed directly
if (require.main === module) {
  // Use command line arguments to choose which demo to run
  const args = process.argv.slice(2);
  const demoType = args[0] || 'transfer'; // Default to transfer demo
  
  // You need to require hardhat when running directly
  require("hardhat");
  
  if (demoType === 'allowance') {
    example_allowance_approve()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  } else if (demoType === 'transfer') {
    example_transfer()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node ERC20Token.cjs [allowance|transfer]');
    console.log('Default: transfer demo');
    example_transfer()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  }
}
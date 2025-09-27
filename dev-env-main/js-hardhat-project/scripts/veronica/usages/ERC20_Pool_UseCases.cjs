const { ethers } = require("hardhat");
const Chain = require("../Chain.cjs");
const Account = require("../Account.cjs");
const ERC20Token = require("../ERC20Token.cjs");
const Pool = require("../Pool.cjs");
const addresses = require("../../utils/addresses.cjs");

const CHAIN_TYPES = {
  HARDHAT: 'hardhat',
  ETHEREUM: 'ethereum',
  DEFAULT: 'default'
};

async function runPoolTests() {
  try {
    console.log("🚀 Starting Pool Class Test Suite...\n");
    
    const chain = await Chain.create(ethers, CHAIN_TYPES.HARDHAT);
    
    // Create accounts
    const whaleAccount = await Account.create(chain, addresses.WHALES.USDC);
    const abbotAccount = await Account.create(chain, addresses.HARDHAT_ACCOUNTS.Abbot.address);
    
    console.log('📋 Account Information:');
    console.log('Whale Address:', whaleAccount.address);
    console.log('Whale ETH Balance:', await whaleAccount.getNativeBalance());
    console.log('Abbot Address:', abbotAccount.address);
    console.log('Abbot ETH Balance:', await abbotAccount.getNativeBalance());
    
    // Initialize tokens
    console.log("\n🪙 Initializing Tokens...");
    const usdcToken = await ERC20Token.create(addresses.TOKENS.USDC, chain);
    const daiToken = await ERC20Token.create(addresses.TOKENS.DAI, chain);
    
    // Test ERC20Token new functions
    await testERC20TokenFunctions(usdcToken, daiToken, whaleAccount, abbotAccount);
    
    // Test Pool functions
    await testPoolFunctions(usdcToken, daiToken, chain, whaleAccount);
    
    console.log("\n🎉 All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Main execution error:", error);
    process.exit(1);
  }
}

async function testERC20TokenFunctions(usdcToken, daiToken, whaleAccount, abbotAccount) {
  console.log("\n🧪 Testing ERC20Token New Functions...");
  
  // Test getTotalSupply
  console.log("\n1. Testing getTotalSupply:");
  const usdcTotalSupply = await usdcToken.getTotalSupply();
  console.log("USDC Total Supply:", usdcTotalSupply.formatted);
  
  const daiTotalSupply = await daiToken.getTotalSupply();
  console.log("DAI Total Supply:", daiTotalSupply.formatted);
  
  // Test allowance (before approval)
  console.log("\n2. Testing allowance (before approval):");
  const initialAllowance = await usdcToken.allowance(whaleAccount.address, abbotAccount.address);
  console.log("Initial Allowance:", initialAllowance.formatted);
  
  // Test approve
  console.log("\n3. Testing approve:");
  await usdcToken.approve(whaleAccount, abbotAccount.address, "1000");
  
  // Test allowance (after approval)
  console.log("\n4. Testing allowance (after approval):");
  const newAllowance = await usdcToken.allowance(whaleAccount.address, abbotAccount.address);
  console.log("New Allowance:", newAllowance.formatted);
  
  // Test token balances
  console.log("\n5. Testing token balances:");
  const whaleUSDCBalance = await usdcToken.getBalance(whaleAccount);
  const whaleDAIBalance = await daiToken.getBalance(whaleAccount);
  const abbotUSDCBalance = await usdcToken.getBalance(abbotAccount);
  const abbotDAIBalance = await daiToken.getBalance(abbotAccount);
  
  console.log("Whale USDC Balance:", whaleUSDCBalance.formatted);
  console.log("Whale DAI Balance:", whaleDAIBalance.formatted);
  console.log("Abbot USDC Balance:", abbotUSDCBalance.formatted);
  console.log("Abbot DAI Balance:", abbotDAIBalance.formatted);
}

async function testPoolFunctions(usdcToken, daiToken, chain, whaleAccount) {
  console.log("\n🏊 Testing Pool Functions...");
  
  // Create pool from token OBJECTS
  const pool = await Pool.createFromTokens(usdcToken, daiToken, chain);
  
  // Test getReserves
  console.log("\n1. Testing getReserves:");
  const reserves = await pool.getReserves();
  console.log("Pool Reserves:", reserves.formatted);
  
  // Test getPrice
  console.log("\n2. Testing getPrice:");
  const priceUSDCtoDAI = await pool.getPrice(usdcToken, daiToken);
  console.log("Price USDC → DAI:", priceUSDCtoDAI.formatted);
  console.log("Price DAI → USDC:", priceUSDCtoDAI.invertedFormatted);
  
  // Test getTokens
  console.log("\n3. Testing getTokens:");
  const tokens = pool.getTokens();
  console.log("Pool Tokens:", {
    token0: `${tokens.token0.symbol} (${tokens.token0.address})`,
    token1: `${tokens.token1.symbol} (${tokens.token1.address})`
  });
  
  // Test hasToken
  console.log("\n4. Testing hasToken:");
  console.log("Pool has USDC:", pool.hasToken(usdcToken));
  console.log("Pool has DAI:", pool.hasToken(daiToken));
  
  // Test getOtherToken
  console.log("\n5. Testing getOtherToken:");
  const otherTokenFromUSDC = pool.getOtherToken(usdcToken);
  const otherTokenFromDAI = pool.getOtherToken(daiToken);
  console.log("Other token from USDC:", otherTokenFromUSDC.symbol);
  console.log("Other token from DAI:", otherTokenFromDAI.symbol);
  
  // Test getLiquidityPosition
  console.log("\n6. Testing getLiquidityPosition:");
  const liquidityPosition = await pool.getLiquidityPosition(whaleAccount);
  console.log("Whale Liquidity Position:", {
    lpBalance: liquidityPosition.lpBalance.formatted,
    share: `${liquidityPosition.share.toFixed(6)}%`,
    underlyingValue: liquidityPosition.underlyingValue
  });
  
  // Test getTVL
  console.log("\n7. Testing getTVL:");
  const tvl = await pool.getTVL();
  console.log("Pool TVL:", {
    [tokens.token0.symbol]: tvl.token0,
    [tokens.token1.symbol]: tvl.token1,
    total: tvl.total
  });
  
  // Test getPoolInfo
  console.log("\n8. Testing getPoolInfo:");
  const poolInfo = await pool.getPoolInfo();
  console.log("Pool Info:", JSON.stringify(poolInfo, null, 2));
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

// Export for testing
module.exports = {
  runPoolTests,
  testERC20TokenFunctions,
  testPoolFunctions
};

// Run if this file is executed directly
if (require.main === module) {
  runPoolTests().catch(console.error);
}
const { Account } = require("../../Account.cjs")
const { ERC20Token } = require("../../ERC20Token.cjs")
const  addresses  = require("../../../utils/addresses.cjs")

async function main() {
  try {
    // You need to require hardhat to get ethers
    
    // Create accounts
    const whaleAccount = await Account.createWhaleUSDC()
    const abbotAccount = await Account.createAbbot();

    const chain = whaleAccount.chain

    console.log('Whale Address:', whaleAccount.address);
    console.log('Whale ETH Balance:', await whaleAccount.getNativeBalance());
    
    // Initialize token
    const usdcToken = await ERC20Token.create(addresses.TOKENS.USDC, chain);

    // Get balances before transfer
    console.log("\n=== BEFORE TRANSFER ===");
    const whaleBalanceBefore = await usdcToken.getBalance(whaleAccount);
    const abbotBalanceBefore = await usdcToken.getBalance(abbotAccount);

    console.log(`Balance Whate Before: ${whaleBalanceBefore}`)
    console.log(`Balance Abbot Before: ${abbotBalanceBefore}`)

    
    // Perform transfer
    await usdcToken.transfer(whaleAccount, abbotAccount, "10.5");
    
    // Get balances after transfer
    console.log("\n=== AFTER TRANSFER ===");
    const whaleBalanceAfter = await usdcToken.getBalance(whaleAccount);
    const abbotBalanceAfter = await usdcToken.getBalance(abbotAccount);

    console.log(`Balance Whate After: ${whaleBalanceAfter}`)
    console.log(`Balance Abbot After: ${abbotBalanceAfter}`)

    
  } catch (error) {
    console.error("Main execution error:", error);
    throw error;
  }
}

main()
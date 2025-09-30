const { Chain, CHAIN_TYPES } = require("../../Chain.cjs");
const { Account } = require("../../Account.cjs");

const { addresses } = require("../../../utils/addresses.cjs")

async function main() {
  try {
    // 1. Create a chain instance first
    const hardhatChain = await Chain.create(CHAIN_TYPES.HARDHAT);
    
    // 2. Create accounts using the chain instance
    const account1 = await Account.create(hardhatChain, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    
    // 3. Use the account
    const balance = await account1.getNativeBalance();
    console.log(`Balance: ${balance} ETH`);
    
    
    const predefined = await Account.getPredefinedAccounts(hardhatChain);
    console.log(`Abbot balance: ${await predefined.Abbot.getNativeBalance()} ETH`);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// For mainnet usage
async function mainnetExample() {
  const mainnetChain = await Chain.create(CHAIN_TYPES.ETHEREUM_MAINNET);
  
  const mainnetAccount = await Account.create(mainnetChain, a);
  const balance = await mainnetAccount.getNativeBalance();
  console.log(`Mainnet balance: ${balance} ETH`);
}

main()
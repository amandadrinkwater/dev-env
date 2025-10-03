const { Account } = require("../../Account.cjs");

async function main() {
  try {
    // 1. Create a chain instance first
    
    const whale = await Account.createWhaleUSDC()

    const balanceWhale = await whale.getNativeBalance();
    console.log(`Balance Whale: ${balanceWhale} ETH`);
    
    const abbot = await Account.createAbbot();

    // 3. Use the account
    const balanceAbbot = await abbot.getNativeBalance();
    console.log(`Balance Abbot: ${balanceAbbot} ETH`);

    await whale.transferNativeToken(abbot.address, "1000");
    await whale.transferNativeToken(abbot.address, "3000");

    const balanceAbbotAfter = await abbot.getNativeBalance();
    console.log(`Balance Abbot After: ${balanceAbbotAfter} ETH`);

    const mainnet01 = await Account.createMainnet01()
    const balanceMainnet01 = await mainnet01.getNativeBalance()
    console.log(`Balance Mainnet01 After: ${balanceMainnet01} ETH`)


  } catch (error) {
    console.error("Error:", error);
  }
}

main()
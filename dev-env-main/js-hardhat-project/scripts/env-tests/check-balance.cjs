


const { ethers } = require("hardhat");
const addresses = require("../utils/addresses.cjs");

// check wrapwethforwhale for better approach to check balances

async function checkBalance() {

    try {
        // Get the provider
        const provider = ethers.provider;
        
        // Address you want to check (e.g., a well-known account from mainnet)
        //const address = addresses.WALLETS.MAINNET01;

        const address = addresses.WALLETS.VITALIK;
        
        console.log(`Balance of ${address}:`);

        // Get balance
        const balance = await provider.getBalance(address);
        
        // Convert from wei to ETH
        const balanceInEth = ethers.formatEther(balance);
        
        console.log(`Wei: ${balance.toString()}`);
        console.log(`ETH: ${balanceInEth}`);
        
    } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

checkBalance().catch(console.error);
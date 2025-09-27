const { Chain, CHAIN_TYPES } = require("../../Chain.cjs");

async function main() {
  try {
    console.log("Testing Chain class...");
    
    // Test with Hardhat chain
    const hardhatChain = await Chain.create(CHAIN_TYPES.HARDHAT);
    await hardhatChain.printToConsole();
    
    console.log("✅ Chain test completed successfully");
    
  } catch (error) {
    console.error("❌ Error testing chain:", error.message);
  }
}

// Run the test
main();
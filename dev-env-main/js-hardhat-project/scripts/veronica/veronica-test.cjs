
const { Pool } = require("./Pool.cjs")

/*

Pool.demo = {
  basicOperations: demoBasicPoolOperations,
  liquidityManagement: demoLiquidityManagement,
  creationFromTokens: demoPoolCreationFromTokens,
  advancedFeatures: demoAdvancedPoolFeatures,
  swapFunctionality: demoSwapFunctionality,
  advancedSwapStrategies: demoAdvancedSwapStrategies, // ← New advanced demo
  runAll: runAllDemos
};

*/

async function demoPoolOperations() { 
    try {
        console.log("🚀 Running Strategies Demo");
        
        // CORRECT: Use the function names as defined in Pool.demo
        const results = await Pool.demo.basicOperations();
        console.log("✅ Demo completed successfully!");
        return results;
    } catch (error) {
        console.error("❌ Demo failed:", error);
    }
}

demoPoolOperations()

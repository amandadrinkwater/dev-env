const { Chain, CHAIN_TYPES } = require("../../Chain.cjs");

async function testMainnetChains() {
  
    // 1. Ethereum Mainnet with Infura
    console.log("=== Ethereum Mainnet ===");
    const ethereumChain = await Chain.createEthereumMainnet({
      apiKey: process.env.INFURA_API_KEY // Your Infura project ID
    });
    await ethereumChain.printToConsole();

    // 2. Ethereum Mainnet with custom RPC
    const ethereumCustom = await Chain.create(CHAIN_TYPES.ETHEREUM_MAINNET, {
      rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
    });
    await ethereumCustom.printToConsole();

    // 3. Polygon Mainnet
    console.log("=== Polygon Mainnet ===");
    const polygonChain = await Chain.create(CHAIN_TYPES.POLYGON_MAINNET, {
      rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com"
    });
    await polygonChain.printToConsole();

    // 4. Arbitrum Mainnet
    console.log("=== Arbitrum Mainnet ===");
    const arbitrumChain = await Chain.create(CHAIN_TYPES.ARBITRUM_MAINNET);
    await arbitrumChain.printToConsole();

  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Test multiple chains simultaneously
async function testAllChains() {
  const chains = [
    { type: CHAIN_TYPES.ETHEREUM_MAINNET, name: "Ethereum" },
    { type: CHAIN_TYPES.POLYGON_MAINNET, name: "Polygon" },
    { type: CHAIN_TYPES.ARBITRUM_MAINNET, name: "Arbitrum" },
    { type: CHAIN_TYPES.OPTIMISM_MAINNET, name: "Optimism" }
  ];

  for (const chain of chains) {
    try {
      console.log(`\n🔄 Connecting to ${chain.name}...`);
      const instance = await Chain.create(chain.type);
      await instance.printToConsole();
    } catch (error) {
      console.log(`❌ Failed to connect to ${chain.name}:`, error.message);
    }
  }
}

testAllChains()
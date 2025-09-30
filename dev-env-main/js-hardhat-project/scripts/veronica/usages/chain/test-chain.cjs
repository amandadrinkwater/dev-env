// Quick test - will work if you have internet connection
const { Chain, CHAIN_TYPES } = require("../../Chain.cjs");

async function quickTest() {
  try {
    const chain = await Chain.create(CHAIN_TYPES.ETHEREUM_MAINNET);
    const status = await chain.getChainActualStatus();
    console.log(`✅ Connected to ${status.network.name} ! Block: ${status.blockNumber}`);
  } catch (error) {
    console.log("❌ Need RPC configuration for mainnet access");
  }
}

quickTest();
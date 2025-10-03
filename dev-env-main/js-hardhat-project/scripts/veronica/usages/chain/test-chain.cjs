// Quick test - will work if you have internet connection
const { Chain } = require("../../Chain.cjs");

async function quickTest() {
  try {
    //const chain = await Chain.create(CHAIN_TYPES.ETHEREUM_MAINNET);
    const chain = await Chain.createHardhat();
    const chain2 = await Chain.createHardhat();
    //const chain = await Chain.createEthereumMainnet();
    const status = await chain.getChainActualStatus();

    console.log(`✅ Connected to ${status.network.name} ! Block: ${status.blockNumber}`);
  } catch (error) {
    console.log("❌ Need RPC configuration for mainnet access");
  }
}

quickTest();
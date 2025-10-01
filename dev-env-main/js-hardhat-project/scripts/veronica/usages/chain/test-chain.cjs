// Quick test - will work if you have internet connection
const { Chain, CHAIN_TYPES } = require("../../Chain.cjs");
const assert = require('assert').strict;

async function quickTest() {
  try {
    const chain = await Chain.create(CHAIN_TYPES.ETHEREUM_MAINNET);
    const status = await chain.getChainActualStatus();

    const chain2 = await Chain.create(CHAIN_TYPES.ETHEREUM_TESTNET);
   // assert.equal(chain, chain2)
   assert.deepStrictEqual(chain, chain2, "Chain objects should be equal");

    console.log(`✅ Connected to ${status.network.name} ! Block: ${status.blockNumber}`);
  } catch (error) {
    console.log("❌ Need RPC configuration for mainnet access");
  }
}

quickTest();
// scripts/read-contract.cjs
const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const contracts = require("../utils/contracts.cjs");
const { calculatePrices, attachUSD } = require("../utils/price-analysis.cjs");

// Contract 
const UNISWAP_QUERY = contracts.FlashBotsUniswapQuery;
const CONTRACT_ADDRESS = UNISWAP_QUERY.address;
const ABI = UNISWAP_QUERY.ABI;

const UNISWAP_FACTORY = addresses.FACTORIES.UNIV2;

// Use your existing ERC20 ABI from abis.cjs
const ERC20_ABI = abis.ERC20;

// Start and End parameters

const initialPairIndex  = 0
const finalPairIndex    = 5

// helper: fetch symbol and decimals
async function fetchTokenInfo(address, provider) {
  try {
    const token = new ethers.Contract(address, ERC20_ABI, provider);
    const [symbol, decimals] = await Promise.all([
      token.symbol(),
      token.decimals()
    ]);
    return { symbol, decimals };
  } catch (e) {
    return { symbol: "UNKNOWN", decimals: 18 }; // fallback
  }
}

// Example: calculate token0/token1 price from table


async function main() {
  
  const provider = ethers.provider;
  
  const network = await provider.getNetwork();
  console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  console.log('Contract set', await contract.getAddress());
  
  // fetch current block timestamp
  const block = await provider.getBlock("latest");
  console.log('Block Number: ', block.number);

  const currentTimestamp = block.timestamp;
  console.log('Block TimeStamp: ', currentTimestamp);

  // fetch pairs (first 5 for demo)
  const pairs = await contract.getPairsByIndexRange(UNISWAP_FACTORY, initialPairIndex,finalPairIndex );
  const pairAddresses = pairs.map(p => p[2]);

  console.log('Pairs: ', pairs)

  // fetch reserves
  const reserves = await contract.getReservesByPairs(pairAddresses);
  console.log('Reserves: ', reserves)


  // resolve token metadata with cache
  const tokenInfoCache = {};
  async function getInfo(addr) {
    if (!tokenInfoCache[addr]) {
      tokenInfoCache[addr] = await fetchTokenInfo(addr, provider);
    }
    return tokenInfoCache[addr];
  }

  const table = [];
  for (let i = 0; i < pairs.length; i++) {
    const [token0Addr, token1Addr, pairAddr] = pairs[i];
    const [reserve0Raw, reserve1Raw, blockTimestampLast] = reserves[i];

    const token0 = await getInfo(token0Addr);
    const token1 = await getInfo(token1Addr);

    // Convert decimals to Number to avoid BigInt errors
    const reserve0 = ethers.formatUnits(reserve0Raw, Number(token0.decimals));
    const reserve1 = ethers.formatUnits(reserve1Raw, Number(token1.decimals));

    table.push({
      token0: `${token0.symbol} (${token0Addr})`,
      token1: `${token1.symbol} (${token1Addr})`,
      pair: pairAddr,
      reserve0,
      reserve1,
      blockTimestampLast: new Date(Number(blockTimestampLast) * 1000).toISOString(),
    currentBlockTime: new Date(currentTimestamp * 1000).toISOString()
    });
  }

  console.table(table);

  // If you already have `table` from your read-contract.cjs
const prices = calculatePrices(table);
console.table(prices);

// Or if you transported JSON
// const tableFromJson = JSON.parse(jsonString);
// const prices = calculatePrices(tableFromJson);

// Example USD price feed (could come from CoinGecko or an oracle later)
const usdPrices = {
  WETH: 2500,
  USDC: 1,
  DAI: 1
};

const enriched = attachUSD(prices, usdPrices);
console.table(enriched);
}

main().catch(console.error);

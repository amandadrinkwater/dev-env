

// scripts/read-contract.cjs
const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const contracts = require("../utils/contracts.cjs");


// Contract 
const UNISWAP_QUERY = contracts.FlashBotsUniswapQuery
const CONTRACT_ADDRESS = UNISWAP_QUERY.address;
const ABI = UNISWAP_QUERY.ABI;

const UNISWAP_FACTORY = addresses.FACTORIES.UNIV2;

async function main() {
  const provider = ethers.provider;
  
  const network = await provider.getNetwork();
  console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
  
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  console.log('Contract set', await contract.getAddress());
  
  // Example: fetch pairs from index 0 to 10
  const pairs = await contract.getPairsByIndexRange(UNISWAP_FACTORY, 0, 5);
  console.log("Pairs:", pairs);

  
  /*
  // Example: fetch reserves for those pairs
  const reserves = await contract.getReservesByPairs(pairs);
  console.log("Reserves:", reserves); */
  
  const reserves = await contract.getReservesByPairs(pairs.map(p => p[2])); 
  // usually p[2] is the actual pair address in [token0, token1, pair]
  console.log("Reserves:", reserves);

  /////////////////////


  // fetch current block timestamp
  const block = await provider.getBlock("latest");
  console.log('Block Number: ', block.number);

  const currentTimestamp = block.timestamp;

  // pretty table
  const table = pairs.map((p, i) => {
    return {
      token0: p[0],
      token1: p[1],
      pair: p[2],
      reserve0: reserves[i][0].toString(),
      reserve1: reserves[i][1].toString(),
      blockTimestampLast: reserves[i][2].toString(),
      currentBlockTime: currentTimestamp
    };
  });

  console.table(table);
  

}

main().catch(console.error);

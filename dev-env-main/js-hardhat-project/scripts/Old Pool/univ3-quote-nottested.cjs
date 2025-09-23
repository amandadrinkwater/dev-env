
const { ethers } = require("hardhat");
const { UNIV3_QUOTER_V2 } = require("../helpers/abis.cjs");

const UNISWAP_V3_QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // mainnet QuoterV2

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const quoter = new ethers.Contract(UNISWAP_V3_QUOTER_ADDRESS, UNIV3_QUOTER_V2, deployer);

  const tokenIn = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";  // WETH
  const tokenOut = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI
  const fee = 3000; // 0.3%
  const amountIn = ethers.utils.parseEther("1");
  const sqrtPriceLimitX96 = 0;

  const quote = await quoter.quoteExactInputSingle({
    tokenIn,
    tokenOut,
    fee,
    amountIn,
    sqrtPriceLimitX96
  });

  console.log(`Uniswap V3 estimated output for 1 WETH → DAI: ${ethers.utils.formatUnits(quote[0], 18)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

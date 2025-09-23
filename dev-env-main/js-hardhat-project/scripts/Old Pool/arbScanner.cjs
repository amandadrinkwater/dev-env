

const { ethers } = require("hardhat");
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const FlashloanContract = require("./FlashloanContract");

async function main() {
  const [executor] = await ethers.getSigners();

  console.log("Arbitrage scanner started with executor:", executor.address);

  // Connect to Routers
  const univ2Router = new ethers.Contract(addresses.ROUTERS.UNIV2, abis.UNIV2_ROUTER, executor);
  const sushiRouter = new ethers.Contract(addresses.ROUTERS.SUSHI, abis.UNIV2_ROUTER, executor);

  // Tokens to scan
  const tokenPairs = [
    [addresses.TOKENS.WETH, addresses.TOKENS.DAI],
    [addresses.TOKENS.WETH, addresses.TOKENS.USDC],
    [addresses.TOKENS.DAI, addresses.TOKENS.USDC],
  ];

  // Scan each pair for price differences
  for (const [tokenA, tokenB] of tokenPairs) {
    const amountIn = ethers.parseEther("1"); // 1 ETH worth

    try {
      const uniAmounts = await univ2Router.getAmountsOut(amountIn, [tokenA, tokenB]);
      const sushiAmounts = await sushiRouter.getAmountsOut(amountIn, [tokenA, tokenB]);

      const uniOut = uniAmounts[1];
      const sushiOut = sushiAmounts[1];

      console.log(`Pair ${tokenA} -> ${tokenB}: Uniswap=${ethers.formatEther(uniOut)}, Sushi=${ethers.formatEther(sushiOut)}`);

      // Detect arbitrage opportunity
      if (uniOut.gt(sushiOut)) {
        console.log(`➡️ Opportunity: Buy on Sushi, sell on Uniswap for profit ${ethers.formatEther(uniOut.sub(sushiOut))}`);
      } else if (sushiOut.gt(uniOut)) {
        console.log(`➡️ Opportunity: Buy on Uniswap, sell on Sushi for profit ${ethers.formatEther(sushiOut.sub(uniOut))}`);
      } else {
        console.log("No arbitrage opportunity detected.");
      }

    } catch (err) {
      console.error(`Error scanning pair ${tokenA}/${tokenB}:`, err.message);
    }
  }

  // Optionally, integrate FlashloanContract here to execute detected arbitrage
  // const flashloan = new FlashloanContract(flashloanAddress, executor);
  // flashloan.executeFlashloan(...) with encoded params
}

main().catch(console.error);

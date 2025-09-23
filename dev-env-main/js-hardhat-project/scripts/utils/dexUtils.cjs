// utils/dexUtils.cjs
const { ethers } = require("hardhat");
const addresses = require("./addresses.cjs");
const abis = require("./abis.cjs");

// ---------------------
// ERC20 Helpers
// ---------------------

/**
 * Get ERC20 contract object
 * @param {string} symbol Token symbol, e.g., "USDC"
 * @param {Provider} provider ethers provider
 */
async function getToken(tokenAddress, provider) {
  const contract = new ethers.Contract(tokenAddress, abis.ERC20, provider);
  
  const name = await usdc.name();
  const symbol = await usdc.symbol();
  const decimals = await usdc.decimals();
  const totalSupply = await usdc.totalSupply();
  return { contract, name, symbol, decimals, totalSupply };
}

/**
 * Approve token for spender if allowance insufficient
 * @param {Contract} token ERC20 contract
 * @param {Signer} signer Owner signer
 * @param {string} spender Spender address
 * @param {BigInt} amount Amount to approve (optional)
 */
async function approveTokenIfNeeded(token, signer, spender, amount) {
  const allowance = await token.allowance(await signer.getAddress(), spender);
  if (allowance < (amount || ethers.constants.MaxUint256)) {
    const tx = await token.connect(signer).approve(spender, amount || ethers.constants.MaxUint256);
    await tx.wait();
  }
}

// ---------------------
// Router Helpers
// ---------------------

/**
 * Get UniswapV2Router contract
 */
function getRouter(provider, routerAddress) {
  routerAddress = routerAddress || addresses.ROUTERS.UNIV2;
  return new ethers.Contract(routerAddress, abis.UNIV2_ROUTER, provider);
}

/**
 * Get UniswapV2Factory contract
 */
function getFactory(provider, factoryAddress) {
  factoryAddress = factoryAddress || addresses.FACTORIES.UNIV2;
  return new ethers.Contract(factoryAddress, abis.UNIV2_FACTORY, provider);
}

/**
 * Calculate min amount out with slippage
 */
function calcAmountOutMin(amountOutExpected, slippageBps) {
  return (BigInt(amountOutExpected) * BigInt(10000 - slippageBps)) / 10000n;
}

/**
 * Swap exact tokens for tokens via router (slippage-safe)
 * @param {Contract} router Router contract
 * @param {BigInt} amountIn Amount to swap
 * @param {string[]} path Array of token addresses
 * @param {Signer} signer Signer executing the swap
 * @param {string} to Receiver address
 * @param {number} slippageBps Slippage in basis points (e.g., 50 = 0.5%)
 */
async function swapWithSlippage(router, amountIn, path, signer, to, slippageBps) {
  const amountsOut = await router.getAmountsOut(amountIn, path);
  const amountOutMin = calcAmountOutMin(amountsOut[amountsOut.length - 1], slippageBps);

  const tx = await router.connect(signer).swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    to,
    Math.floor(Date.now() / 1000) + 600 // 10 min deadline
  );
  const receipt = await tx.wait();
  return { receipt, expectedOut: amountsOut[amountsOut.length - 1] };
}

// ---------------------
// Flashswap Helpers
// ---------------------

/**
 * Execute a flashswap via deployed UniswapV2Flashswap contract
 * @param {Contract} flashswap Deployed Flashswap contract
 * @param {string} pairAddress Address of Uniswap V2 pair
 * @param {string} tokenBorrow Token to borrow
 * @param {BigInt} amount Amount to borrow
 * @param {string[]} path Swap path (token addresses)
 * @param {number} slippageBps Slippage in basis points
 * @param {Signer} signer EOA calling the contract
 */
async function executeFlashswap(flashswap, pairAddress, tokenBorrow, amount, path, slippageBps, signer) {
  const tx = await flashswap.connect(signer).startFlashswap(pairAddress, tokenBorrow, amount, path, slippageBps);
  const receipt = await tx.wait();
  return receipt;
}

// ---------------------
// Export all helpers
// ---------------------
module.exports = {
  getToken,
  approveTokenIfNeeded,
  getRouter,
  getFactory,
  swapWithSlippage,
  executeFlashswap,
  calcAmountOutMin
};

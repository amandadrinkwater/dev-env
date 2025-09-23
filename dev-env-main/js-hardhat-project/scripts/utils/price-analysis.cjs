// utils/prices.cjs

/**
 * Calculate token0/token1 and token1/token0 prices
 * from your "table" JSON.
 *
 * @param {Array} table - Array of pair objects from read-contract.cjs
 * @returns {Array} - Array with price analytics
 */
function calculatePrices(table) {
  return table.map(pair => {
    const reserve0 = Number(pair.reserve0);
    const reserve1 = Number(pair.reserve1);

    const priceToken0InToken1 = reserve1 > 0 && reserve0 > 0 ? reserve1 / reserve0 : null;
    const priceToken1InToken0 = reserve0 > 0 && reserve1 > 0 ? reserve0 / reserve1 : null;

    return {
      pair: pair.pair,
      token0: pair.token0,
      token1: pair.token1,
      priceToken0InToken1,
      priceToken1InToken0,
      liquidityUSD: null // placeholder for later (see below)
    };
  });
}

/**
 * Optional: attach USD conversions using a token->USD map
 *
 * @param {Array} priceTable - output of calculatePrices
 * @param {Object} usdPrices - map { "WETH": 2500, "USDC": 1, ... }
 */
function attachUSD(priceTable, usdPrices) {
  return priceTable.map(row => {
    const t0 = row.token0.split(" ")[0]; // symbol only
    const t1 = row.token1.split(" ")[0];

    let liquidityUSD = null;
    if (usdPrices[t0] && usdPrices[t1]) {
      liquidityUSD =
        row.priceToken0InToken1 && row.priceToken1InToken0
          ? (usdPrices[t0] + usdPrices[t1]) / 2
          : null;
    }

    return { ...row, liquidityUSD };
  });
}

module.exports = { calculatePrices, attachUSD };

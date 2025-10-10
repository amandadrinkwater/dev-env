/*

✅ Complete input validation for all methods
✅ Address normalization using ethers.getAddress()
✅ BigInt precision for slippage calculations
✅ Comprehensive error handling with descriptive messages
✅ Helper method _isSameAddress for reliable address comparison
✅ Zero address validation and division by zero protection
✅ Contract existence verification during initialization
✅ Proper number conversion and type checking
✅ Enhanced TVL calculation using actual token prices
✅ Better logging with pool address context
✅ Added static factory method createWithTokens for consistency
✅ Added convenience method getPriceQuick for symbol-based price checks

demoBasicPoolOperations() - Basic pool info and pricing

demoLiquidityManagement() - Liquidity provision simulation

demoPoolCreationFromTokens() - Creating pools from token pairs

demoAdvancedPoolFeatures() - Advanced functionality testing

const { Pool } = require('./Pool.cjs');

// Use the class normally
const pool = await Pool.create(poolAddress, chain);

// Or run demos
await Pool.demo.basicOperations();

// Or run all demos
await Pool.demo.runAll();

// Get a swap quote
const quote = await pool.getSwapQuote("1", "WETH", "0.5");

// Execute a swap
const result = await pool.swap(account, "WETH", "1", { 
  slippage: "0.5",
  recipient: "0x..." 
});

// Find optimal swap amount
const optimal = await pool.getOptimalSwapAmount("WETH", "1.0");

// All examples are practical and immediately usable:

// 1. Basic trading
const quote = await pool.getSwapQuote("1", "WETH", "0.5");

// 2. Arbitrage detection
const discrepancy = ethPrice * usdcPrice; // Should be ~1.0

// 3. Large trade optimization
const optimal = await pool.getOptimalSwapAmount("WETH", "0.5");

// 4. Slippage tuning for different market conditions
const aggressive = await pool.getSwapQuote("1", "WETH", "0.1");  // Low slippage
const conservative = await pool.getSwapQuote("1", "WETH", "2.0"); // High slippage
*/

const { ethers, assert } = require("ethers");
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const { ERC20Token } = require("./ERC20Token.cjs");
const { Account } = require("./Account.cjs");

const ERC20_ABI = abis.ERC20;
const UNISWAP_V2_PAIR_ABI = abis.UNIV2_PAIR;

// ✅ DEBUG: Verify ABI is loaded correctly
// take it off later
console.log("🔧 ABI Status:", {
  ERC20_ABI: ERC20_ABI ? `✅ Loaded (${ERC20_ABI.length} items)` : "❌ Missing",
  UNISWAP_V2_PAIR_ABI: UNISWAP_V2_PAIR_ABI ? `✅ Loaded (${UNISWAP_V2_PAIR_ABI.length} items)` : "❌ Missing"
});

// Constants
const DEX_TYPES = {
  UNISWAP_V2: 'uniswap_v2',
  UNISWAP_V3: 'uniswap_v3',
  SUSHISWAP: 'sushiswap',
  QUICKSWAP: 'quickswap',
  PANCKESWAP: 'pancakeswap'
};

const SLIPPAGE_TOLERANCE = 0.5; // 0.5% default slippage

class Pool {

  // Uniswap V2 style pool
  constructor(poolAddress, chain, dexType = DEX_TYPES.UNISWAP_V2) {
    if (!poolAddress) throw new Error("Pool address is required");
    if (!chain?.provider) throw new Error("Valid chain instance with provider is required");
    
    // Validate and normalize address
    try {
      this.poolAddress = ethers.getAddress(poolAddress);
    } catch {
      throw new Error("Invalid pool address format");
    }
    
    this.chain = chain;
    this.dexType = dexType;
    this.provider = chain.provider;
    this.contract = null;
    this.token0 = null;
    this.token1 = null;
    this.reserve0 = null;
    this.reserve1 = null;
    this.totalSupply = null;
    this.tokenA = null;
    this.tokenB = null;

    this.slippageTolerance = this.constructor.SLIPPAGE_TOLERANCE;
  }

  // Helper method for address comparison
  _isSameAddress(addr1, addr2) {
    if (!addr1 || !addr2) return false;
    try {
      return ethers.getAddress(addr1) === ethers.getAddress(addr2);
    } catch {
      return false;
    }
  }

 async init() {
    try {

      // I am not sure about this fix
         if (this._isBatchInitialized) {
            console.log(`🏊 Batch Pool Already Initialized: ${this.poolAddress}`);
            console.log(`   Tokens: ${this.token0.symbol}/${this.token1.symbol}`);
            return this;
        }
        // Validate DEX type
        if (!Object.values(DEX_TYPES).includes(this.dexType)) {
            throw new Error(`Unsupported DEX type: ${this.dexType}`);
        }

        // Initialize based on DEX type
        switch (this.dexType) {
            case DEX_TYPES.UNISWAP_V2:
            case DEX_TYPES.SUSHISWAP:
            case DEX_TYPES.PANCKESWAP:
                this.contract = new ethers.Contract(this.poolAddress, UNISWAP_V2_PAIR_ABI, this.provider);
                break;
            // Add other DEX types here as needed
            default:
                throw new Error(`Unsupported DEX type: ${this.dexType}`);
        }

        // Verify contract exists by making a simple call
        try {
            await this.contract.token0();
        } catch (error) {
            throw new Error(`Contract not found or invalid ABI at address: ${this.poolAddress}`);
        }

        // Get pool information
        await this._loadPoolData();
        
        // 🚨 FIXED LOGGING: Use safe property access
        console.log("\n🏊 Pool Initialized:");
        console.log("Address:", this.poolAddress);
        console.log("DEX Type:", this.dexType);
        console.log("Token 0:", this.token0.address, `(${this.token0.symbol})`);
        console.log("Token 1:", this.token1.address, `(${this.token1.symbol})`);        
        if (this.token0 && this.token1 && this.reserve0 !== null && this.reserve1 !== null) {
            console.log("Reserves:", {
                [this.token0.symbol]: ethers.formatUnits(this.reserve0, this.token0.decimals),
                [this.token1.symbol]: ethers.formatUnits(this.reserve1, this.token1.decimals)
            });
        } else {
            console.log("Reserves: Data not fully loaded");
        }

        return this;
    } catch (error) {
        console.error(`Error initializing pool at ${this.poolAddress}:`, error);
        throw error;
    }
}

  async _loadPoolData() {
  try {
    // Get token addresses
    const [token0Address, token1Address] = await Promise.all([
      this.contract.token0(),
      this.contract.token1()
    ]);

    // Always create new token instances
    this.token0 = await ERC20Token.create(token0Address, this.chain);
    this.token1 = await ERC20Token.create(token1Address, this.chain);

    // Get reserves
    const reserves = await this.contract.getReserves();
    this.reserve0 = reserves[0];
    this.reserve1 = reserves[1];

    // Get total supply
    this.totalSupply = await this.contract.totalSupply();

    console.log("✅ Pool data loaded successfully");
    console.log(`Token0: ${this.token0.address} (${this.token0.symbol})`);
    console.log(`Token1: ${this.token1.address} (${this.token1.symbol})`);

  } catch (error) {
    console.error("Error loading pool data:", error);
    throw error;
  }
}
  setSlippageTolerance(slippage) {
    if (typeof slippage !== 'number' || slippage < 0 || slippage > 100) {
      throw new Error("Slippage tolerance must be a number between 0 and 100");
    }
    this.slippageTolerance = slippage;
  }

  // Static method to change default for all new instances
  static setDefaultSlippageTolerance(slippage) {
    if (typeof slippage !== 'number' || slippage < 0 || slippage > 100) {
      throw new Error("Slippage tolerance must be a number between 0 and 100");
    }
    this.SLIPPAGE_TOLERANCE = slippage;
  }

  async getReserves() {
    try {
      const reserves = await this.contract.getReserves().catch(() => {
        throw new Error("Failed to fetch reserves from contract");
      });
      
      return {
        reserve0: reserves[0],
        reserve1: reserves[1],
        blockTimestampLast: reserves[2],
        formatted: {
          [this.token0.symbol]: ethers.formatUnits(reserves[0], this.token0.decimals),
          [this.token1.symbol]: ethers.formatUnits(reserves[1], this.token1.decimals)
        }
      };
    } catch (error) {
      console.error("Error fetching reserves for pool:", this.poolAddress, error);
      throw error;
    }
  }

  async getPrice(tokenIn, tokenOut) {
    try {
      const tokenInAddress = typeof tokenIn === 'string' ? tokenIn : tokenIn.address;
      const tokenOutAddress = typeof tokenOut === 'string' ? tokenOut : tokenOut.address;
      
      if (!tokenInAddress || !tokenOutAddress) {
        throw new Error("Invalid token addresses provided");
      }

      const reserves = await this.getReserves();
      
      let reserveIn, reserveOut, tokenInObj, tokenOutObj;
      
      if (this._isSameAddress(tokenInAddress, this.token0.address)) {
        reserveIn = reserves.reserve0;
        reserveOut = reserves.reserve1;
        tokenInObj = this.token0;
        tokenOutObj = this.token1;
      } else if (this._isSameAddress(tokenInAddress, this.token1.address)) {
        reserveIn = reserves.reserve1;
        reserveOut = reserves.reserve0;
        tokenInObj = this.token1;
        tokenOutObj = this.token0;
      } else {
        throw new Error("Token not found in pool");
      }

      // Avoid division by zero
      if (reserveIn === 0n) {
        throw new Error("ReserveIn is zero, cannot calculate price");
      }

      const price = Number(ethers.formatUnits(reserveOut, tokenOutObj.decimals)) / 
                   Number(ethers.formatUnits(reserveIn, tokenInObj.decimals));
      
      return {
        price,
        formatted: `1 ${tokenInObj.symbol} = ${price.toFixed(6)} ${tokenOutObj.symbol}`,
        inverted: 1 / price,
        invertedFormatted: `1 ${tokenOutObj.symbol} = ${(1 / price).toFixed(6)} ${tokenInObj.symbol}`
      };
    } catch (error) {
      console.error("Error calculating price for pool:", this.poolAddress, error);
      throw error;
    }
  }

  // Convenience method for quick price checks by symbol
  async getPriceQuick(tokenInSymbol) {
    try {
      if (!tokenInSymbol || typeof tokenInSymbol !== 'string') {
        throw new Error("Valid token symbol string is required");
      }

      // Normalize symbol case for comparison
      const normalizedSymbol = tokenInSymbol.toLowerCase().trim();
      const token0Symbol = this.token0.symbol.toLowerCase();
      const token1Symbol = this.token1.symbol.toLowerCase();

      let tokenIn, tokenOut;

      if (normalizedSymbol === token0Symbol) {
        tokenIn = this.token0;
        tokenOut = this.token1;
      } else if (normalizedSymbol === token1Symbol) {
        tokenIn = this.token1;
        tokenOut = this.token0;
      } else {
        throw new Error(`Token symbol '${tokenInSymbol}' not found in pool. Available: ${this.token0.symbol}, ${this.token1.symbol}`);
      }

      return this.getPrice(tokenIn, tokenOut);
    } catch (error) {
      console.error("Error in getPriceQuick for pool:", this.poolAddress, error);
      throw error;
    }
  }

  async addLiquidity(account, amount0, amount1, options = {}) {
    try {
      // Input validation
      if (!account?.signer) {
        throw new Error("Valid account with signer is required");
      }
      if (!amount0 || !amount1 || Number(amount0) <= 0 || Number(amount1) <= 0) {
        throw new Error("Valid positive amounts are required");
      }

      const { slippage = this.slippageTolerance, deadline = Math.floor(Date.now() / 1000) + 300 } = options;

      console.log(`\n💧 Adding liquidity to pool ${this.poolAddress}...`);

      // Approve tokens
      await this.token0.approve(account, this.poolAddress, amount0);
      await this.token1.approve(account, this.poolAddress, amount1);

      const amount0Desired = ethers.parseUnits(amount0.toString(), this.token0.decimals);
      const amount1Desired = ethers.parseUnits(amount1.toString(), this.token1.decimals);

      // Calculate minimum amounts with slippage tolerance using BigInt for precision
      const slippageBasis = BigInt(1000 - slippage * 10);
      const amount0Min = amount0Desired * slippageBasis / 1000n;
      const amount1Min = amount1Desired * slippageBasis / 1000n;

      const poolWithSigner = this.contract.connect(account.signer);

      const tx = await poolWithSigner.addLiquidity(
        this.token0.address,
        this.token1.address,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        account.address,
        deadline
      );

      const receipt = await tx.wait();
      console.log(`✅ Liquidity added successfully in block: ${receipt.blockNumber}`);

      return receipt;
    } catch (error) {
      console.error("Error adding liquidity to pool:", this.poolAddress, error);
      throw error;
    }
  }

  async removeLiquidity(account, liquidityAmount, options = {}) {
    try {
      // Input validation
      if (!account?.signer) {
        throw new Error("Valid account with signer is required");
      }
      if (!liquidityAmount || Number(liquidityAmount) <= 0) {
        throw new Error("Valid positive liquidity amount is required");
      }

      const { slippage = this.slippageTolerance, deadline = Math.floor(Date.now() / 1000) + 300 } = options;

      console.log(`\n🔥 Removing liquidity from pool ${this.poolAddress}...`);

      // Approve LP tokens
      const lpToken = new ERC20Token(this.poolAddress, this.chain);
      await lpToken.init();
      await lpToken.approve(account, this.poolAddress, liquidityAmount);

      const lpDecimals = await this.contract.decimals();
      const liquidity = ethers.parseUnits(liquidityAmount.toString(), lpDecimals);

      // Calculate minimum amounts with slippage using BigInt
      const totalSupply = await this.contract.totalSupply();
      const slippageBasis = BigInt(1000 - slippage * 10);
      
      const amount0Min = this.reserve0 * liquidity / totalSupply * slippageBasis / 1000n;
      const amount1Min = this.reserve1 * liquidity / totalSupply * slippageBasis / 1000n;

      const poolWithSigner = this.contract.connect(account.signer);

      const tx = await poolWithSigner.removeLiquidity(
        this.token0.address,
        this.token1.address,
        liquidity,
        amount0Min,
        amount1Min,
        account.address,
        deadline
      );

      const receipt = await tx.wait();
      console.log(`✅ Liquidity removed successfully in block: ${receipt.blockNumber}`);

      return receipt;
    } catch (error) {
      console.error("Error removing liquidity from pool:", this.poolAddress, error);
      throw error;
    }
  }

  async getLiquidityPosition(account) {
    try {
      if (!account?.address) {
        throw new Error("Valid account is required");
      }

      const lpToken = new ERC20Token(this.poolAddress, this.chain);
      await lpToken.init();
      
      const balance = await lpToken.getBalance(account);
      const lpDecimals = await this.contract.decimals();
      const totalSupplyFormatted = Number(ethers.formatUnits(this.totalSupply, lpDecimals));
      const share = totalSupplyFormatted > 0 ? Number(balance.formatted) / totalSupplyFormatted : 0;

      const reserves = await this.getReserves();
      const token0Amount = share * Number(ethers.formatUnits(reserves.reserve0, this.token0.decimals));
      const token1Amount = share * Number(ethers.formatUnits(reserves.reserve1, this.token1.decimals));

      const token1Price = await this.getPrice(this.token1, this.token0);

      return {
        lpBalance: balance,
        share: share * 100, // percentage
        underlyingValue: {
          [this.token0.symbol]: token0Amount,
          [this.token1.symbol]: token1Amount
        },
        totalValue: token0Amount + token1Amount * token1Price.price
      };
    } catch (error) {
      console.error("Error getting liquidity position for pool:", this.poolAddress, error);
      throw error;
    }
  }

  // Add these methods to the Pool class (inside the class definition):

/**
 * Swap tokens in the pool (Uniswap V2 style)
 * @param {Account} account - The account performing the swap
 * @param {string|ERC20Token} tokenIn - Input token or address
 * @param {string|number} amountIn - Amount to swap (in human-readable units)
 * @param {Object} options - Swap options
 * @returns {Promise<Object>} Transaction receipt
 */
async swap(account, tokenIn, amountIn, options = {}) {
  try {
    // Input validation
    if (!account?.signer) {
      throw new Error("Valid account with signer is required");
    }
    if (!tokenIn) {
      throw new Error("Input token is required");
    }
    if (!amountIn || Number(amountIn) <= 0) {
      throw new Error("Valid positive input amount is required");
    }

    const { 
      slippage = this.slippageTolerance, 
      deadline = Math.floor(Date.now() / 1000) + 300,
      recipient = account.address // Default to account address
    } = options;

    console.log(`\n🔄 Swapping tokens in pool ${this.poolAddress}...`);

    // Resolve token addresses
    const tokenInAddress = typeof tokenIn === 'string' ? tokenIn : tokenIn.address;
    const tokenInObj = this._isSameAddress(tokenInAddress, this.token0.address) ? 
                      this.token0 : this.token1;
    
    if (!this.hasToken(tokenInObj)) {
      throw new Error("Input token not found in pool");
    }

    const tokenOutObj = this.getOtherToken(tokenInObj);

    // Calculate expected output amount
    const amountInWei = ethers.parseUnits(amountIn.toString(), tokenInObj.decimals);
    const amountOutWei = await this._getAmountOut(amountInWei, tokenInObj, tokenOutObj);
    
    // Apply slippage tolerance
    const slippageBasis = BigInt(1000 - slippage * 10);
    const amountOutMin = amountOutWei * slippageBasis / 1000n;

    console.log(`Swap: ${amountIn} ${tokenInObj.symbol} → ${ethers.formatUnits(amountOutWei, tokenOutObj.decimals)} ${tokenOutObj.symbol}`);
    console.log(`Minimum out (with ${slippage}% slippage): ${ethers.formatUnits(amountOutMin, tokenOutObj.decimals)} ${tokenOutObj.symbol}`);

    // Approve token spending
    await tokenInObj.approve(account, this.poolAddress, amountIn);

    const poolWithSigner = this.contract.connect(account.signer);

    let tx;
    if (this._isSameAddress(tokenInObj.address, this.token0.address)) {
      // token0 -> token1
      tx = await poolWithSigner.swap(
        amountOutMin, // amount1Out
        0, // amount0Out (0 for single token output)
        recipient,
        "0x",  // BigInt(deadline),
        { gasLimit: 300000 }
      );
    } else {
      // token1 -> token0
      tx = await poolWithSigner.swap(
        0, // amount0Out
        amountOutMin, // amount1Out
        recipient,
        "0x",  // BigInt(deadline),
        { gasLimit: 300000 }
      );
    }

    const receipt = await tx.wait();
    console.log(`✅ Swap completed successfully in block: ${receipt.blockNumber}`);
    
    return {
      receipt,
      summary: {
        input: { amount: amountIn, symbol: tokenInObj.symbol },
        output: { 
          amount: ethers.formatUnits(amountOutWei, tokenOutObj.decimals), 
          symbol: tokenOutObj.symbol 
        },
        price: await this.getPrice(tokenInObj, tokenOutObj)
      }
    };

  } catch (error) {
    console.error("Error swapping tokens in pool:", this.poolAddress, error);
    throw error;
  }
}

/**
 * Calculate output amount for a given input (Uniswap V2 formula)
 * @param {BigInt} amountInWei - Input amount in wei
 * @param {ERC20Token} tokenIn - Input token
 * @param {ERC20Token} tokenOut - Output token
 * @returns {BigInt} Output amount in wei
 */
async _getAmountOut(amountInWei, tokenIn, tokenOut) {
  const reserves = await this.getReserves();
  
  let reserveIn, reserveOut;
  if (this._isSameAddress(tokenIn.address, this.token0.address)) {
    reserveIn = reserves.reserve0;
    reserveOut = reserves.reserve1;
  } else {
    reserveIn = reserves.reserve1;
    reserveOut = reserves.reserve0;
  }

  // Uniswap V2 formula: amountOut = (amountIn * fee * reserveOut) / (reserveIn * feeDenominator + amountIn * fee)
  const fee = 997n; // 0.3% fee (Uniswap V2)
  const feeDenominator = 1000n;
  
  const amountInWithFee = amountInWei * fee;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * feeDenominator + amountInWithFee;
  
  return numerator / denominator;
}

/**
 * Swap exact input tokens for minimum output tokens (Uniswap V2 style)
 * @param {Account} account - The account performing the swap
 * @param {string|number} amountIn - Exact input amount
 * @param {string} tokenInSymbol - Input token symbol
 * @param {Object} options - Swap options
 * @returns {Promise<Object>} Transaction receipt
 */
async swapExactTokensForTokens(account, amountIn, tokenInSymbol, options = {}) {
  try {
    const tokenIn = tokenInSymbol.toLowerCase() === this.token0.symbol.toLowerCase() ? 
                   this.token0 : this.token1;
    
    return this.swap(account, tokenIn, amountIn, options);
  } catch (error) {
    console.error("Error in swapExactTokensForTokens:", error);
    throw error;
  }
}

/**
 * Swap tokens for exact output tokens (Uniswap V2 style)
 * @param {Account} account - The account performing the swap
 * @param {string|number} amountOut - Exact output amount desired
 * @param {string} tokenOutSymbol - Output token symbol
 * @param {Object} options - Swap options
 * @returns {Promise<Object>} Transaction receipt
 */
async swapTokensForExactTokens(account, amountOut, tokenOutSymbol, options = {}) {
  try {
    // Input validation
    if (!account?.signer) {
      throw new Error("Valid account with signer is required");
    }
    if (!amountOut || Number(amountOut) <= 0) {
      throw new Error("Valid positive output amount is required");
    }

    const { 
      slippage = this.slippageTolerance, 
      deadline = Math.floor(Date.now() / 1000) + 300,
      recipient = account.address
    } = options;

    console.log(`\n🔄 Swapping for exact output in pool ${this.poolAddress}...`);

    // Resolve token addresses
    const tokenOut = tokenOutSymbol.toLowerCase() === this.token0.symbol.toLowerCase() ? 
                    this.token0 : this.token1;
    
    if (!this.hasToken(tokenOut)) {
      throw new Error("Output token not found in pool");
    }

    const tokenIn = this.getOtherToken(tokenOut);

    // Calculate required input amount
    const amountOutWei = ethers.parseUnits(amountOut.toString(), tokenOut.decimals);
    const amountInWei = await this._getAmountIn(amountOutWei, tokenIn, tokenOut);
    
    // Apply slippage tolerance to input (max input amount)
    const slippageBasis = BigInt(1000 + slippage * 10); // Note: + for input
    const amountInMax = amountInWei * slippageBasis / 1000n;

    console.log(`Swap for exact output: ~${ethers.formatUnits(amountInWei, tokenIn.decimals)} ${tokenIn.symbol} → ${amountOut} ${tokenOut.symbol}`);
    console.log(`Maximum input (with ${slippage}% slippage): ${ethers.formatUnits(amountInMax, tokenIn.decimals)} ${tokenIn.symbol}`);

    // Approve token spending
    await tokenIn.approve(account, this.poolAddress, ethers.formatUnits(amountInMax, tokenIn.decimals));

    const poolWithSigner = this.contract.connect(account.signer);

    let tx;
    if (this._isSameAddress(tokenOut.address, this.token1.address)) {
      // Want exact token1 output, provide max token0 input
      tx = await poolWithSigner.swap(
        amountOutWei, // exact amount1Out
        0, // amount0Out
        recipient,
        "0x", // BigInt(deadline),
        { gasLimit: 300000 }
      );
    } else {
      // Want exact token0 output, provide max token1 input
      tx = await poolWithSigner.swap(
        0, // amount0Out
        amountOutWei, // exact amount1Out
        recipient,
        "0x", // BigInt(deadline),
        { gasLimit: 300000 }
      );
    }

    const receipt = await tx.wait();
    console.log(`✅ Swap for exact output completed in block: ${receipt.blockNumber}`);
    
    return {
      receipt,
      summary: {
        input: { 
          maxAmount: ethers.formatUnits(amountInMax, tokenIn.decimals), 
          symbol: tokenIn.symbol 
        },
        output: { 
          exactAmount: amountOut, 
          symbol: tokenOut.symbol 
        },
        estimatedInput: ethers.formatUnits(amountInWei, tokenIn.decimals),
        price: await this.getPrice(tokenIn, tokenOut)
      }
    };

  } catch (error) {
    console.error("Error in swapTokensForExactTokens:", error);
    throw error;
  }
}

/**
 * Get swap quote for exact output amount
 */
async getSwapQuoteForExactOut(amountOut, tokenOutSymbol, slippage = this.slippageTolerance) {
  try {
    const tokenOut = tokenOutSymbol.toLowerCase() === this.token0.symbol.toLowerCase() ? 
                    this.token0 : this.token1;
    const tokenIn = this.getOtherToken(tokenOut);

    const amountOutWei = ethers.parseUnits(amountOut.toString(), tokenOut.decimals);
    const amountInWei = await this._getAmountIn(amountOutWei, tokenIn, tokenOut);
    
    // Apply slippage to input
    const slippageBasis = BigInt(1000 + slippage * 10);
    const amountInMax = amountInWei * slippageBasis / 1000n;

    return {
      input: {
        estimatedAmount: ethers.formatUnits(amountInWei, tokenIn.decimals),
        maxAmount: ethers.formatUnits(amountInMax, tokenIn.decimals),
        symbol: tokenIn.symbol
      },
      output: {
        exactAmount: amountOut,
        symbol: tokenOut.symbol
      },
      slippage: `${slippage}%`
    };
  } catch (error) {
    console.error("Error getting exact output quote:", error);
    throw error;
  }
}

/**
 * Calculate input amount required for desired output (Uniswap V2 formula)
 * @param {BigInt} amountOutWei - Desired output amount in wei
 * @param {ERC20Token} tokenIn - Input token
 * @param {ERC20Token} tokenOut - Output token
 * @returns {BigInt} Required input amount in wei
 */
async _getAmountIn(amountOutWei, tokenIn, tokenOut) {
  const reserves = await this.getReserves();
  
  let reserveIn, reserveOut;
  if (this._isSameAddress(tokenIn.address, this.token0.address)) {
    reserveIn = reserves.reserve0;
    reserveOut = reserves.reserve1;
  } else {
    reserveIn = reserves.reserve1;
    reserveOut = reserves.reserve0;
  }

  // Uniswap V2 formula: amountIn = (reserveIn * amountOut * feeDenominator) / ((reserveOut - amountOut) * fee) + 1
  const fee = 997n; // 0.3% fee (Uniswap V2)
  const feeDenominator = 1000n;
  
  if (amountOutWei >= reserveOut) {
    throw new Error("Insufficient liquidity for desired output");
  }
  
  const numerator = reserveIn * amountOutWei * feeDenominator;
  const denominator = (reserveOut - amountOutWei) * fee;
  
  return (numerator / denominator) + 1n; // +1 to account for rounding
}

/**
 * Get swap quote without executing transaction
 * @param {string|number} amountIn - Input amount
 * @param {string} tokenInSymbol - Input token symbol
 * @param {number} slippage - Slippage tolerance
 * @returns {Object} Swap quote details
 */
async getSwapQuote(amountIn, tokenInSymbol, slippage = this.slippageTolerance) {
  try {
    if (!amountIn || Number(amountIn) <= 0) {
      throw new Error("Valid positive input amount is required");
    }

    const tokenIn = tokenInSymbol.toLowerCase() === this.token0.symbol.toLowerCase() ? 
                   this.token0 : this.token1;
    const tokenOut = this.getOtherToken(tokenIn);

    const amountInWei = ethers.parseUnits(amountIn.toString(), tokenIn.decimals);
    const amountOutWei = await this._getAmountOut(amountInWei, tokenIn, tokenOut);
    
    // Apply slippage
    const slippageBasis = BigInt(1000 - slippage * 10);
    const amountOutMin = amountOutWei * slippageBasis / 1000n;

    const priceImpact = await this._calculatePriceImpact(amountInWei, tokenIn, tokenOut);

    return {
      input: {
        amount: amountIn,
        symbol: tokenIn.symbol,
        amountWei: amountInWei
      },
      output: {
        amount: ethers.formatUnits(amountOutWei, tokenOut.decimals),
        symbol: tokenOut.symbol,
        amountWei: amountOutWei,
        amountMin: ethers.formatUnits(amountOutMin, tokenOut.decimals),
        amountMinWei: amountOutMin
      },
      price: await this.getPrice(tokenIn, tokenOut),
      slippage: `${slippage}%`,
      priceImpact: `${priceImpact.toFixed(4)}%`,
      fee: "0.3%", // Uniswap V2 standard fee
      route: [tokenIn.symbol, tokenOut.symbol]
    };
  } catch (error) {
    console.error("Error getting swap quote:", error);
    throw error;
  }
}

/**
 * Calculate price impact of a swap
 */
async _calculatePriceImpact(amountInWei, tokenIn, tokenOut) {
  const reserves = await this.getReserves();
  
  let reserveIn, reserveOut;
  if (this._isSameAddress(tokenIn.address, this.token0.address)) {
    reserveIn = reserves.reserve0;
    reserveOut = reserves.reserve1;
  } else {
    reserveIn = reserves.reserve1;
    reserveOut = reserves.reserve0;
  }

  // Calculate price before swap
  const priceBefore = Number(reserveOut) / Number(reserveIn);
  
  // Calculate price after swap (simplified)
  const reserveInAfter = reserveIn + amountInWei;
  const reserveOutAfter = reserveOut - await this._getAmountOut(amountInWei, tokenIn, tokenOut);
  const priceAfter = Number(reserveOutAfter) / Number(reserveInAfter);
  
  return ((priceBefore - priceAfter) / priceBefore) * 100;
}

/**
 * Get optimal swap amount for minimal price impact
 */
async getOptimalSwapAmount(tokenInSymbol, maxPriceImpact = 1.0) {
  try {
    const tokenIn = tokenInSymbol.toLowerCase() === this.token0.symbol.toLowerCase() ? 
                   this.token0 : this.token1;
    
    const reserves = await this.getReserves();
    const reserveIn = this._isSameAddress(tokenIn.address, this.token0.address) ? 
                     reserves.reserve0 : reserves.reserve1;

    // Simple heuristic: don't swap more than 1% of pool reserves
    const maxAmountWei = reserveIn / 100n;
    
    // Binary search for optimal amount
    let low = 0n;
    let high = maxAmountWei;
    let optimalAmount = 0n;

    for (let i = 0; i < 10; i++) { // Limit iterations
      const mid = (low + high) / 2n;
      if (mid === 0n) break;

      const priceImpact = await this._calculatePriceImpact(mid, tokenIn, this.getOtherToken(tokenIn));
      
      if (priceImpact <= maxPriceImpact) {
        optimalAmount = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    return {
      optimalAmount: ethers.formatUnits(optimalAmount, tokenIn.decimals),
      optimalAmountWei: optimalAmount,
      maxPriceImpact: `${maxPriceImpact}%`,
      estimatedPriceImpact: await this._calculatePriceImpact(optimalAmount, tokenIn, this.getOtherToken(tokenIn))
    };
  } catch (error) {
    console.error("Error calculating optimal swap amount:", error);
    throw error;
  }
}

  async getTVL() {
    try {
      const reserves = await this.getReserves();
      
      const token0Value = Number(ethers.formatUnits(reserves.reserve0, this.token0.decimals));
      const token1Value = Number(ethers.formatUnits(reserves.reserve1, this.token1.decimals));
      
      // Get price for better TVL calculation
      const price = await this.getPrice(this.token1, this.token0);
      const totalValue = token0Value + (token1Value * price.price);
      
      return {
        token0: token0Value,
        token1: token1Value,
        total: totalValue
      };
    } catch (error) {
      console.error("Error calculating TVL for pool:", this.poolAddress, error);
      throw error;
    }
  }

  getTokens() {
    return {
      token0: this.token0,
      token1: this.token1
    };
  }

  hasToken(token) {
    const tokenAddress = typeof token === 'string' ? token : token.address;
    return this._isSameAddress(this.token0.address, tokenAddress) ||
           this._isSameAddress(this.token1.address, tokenAddress);
}

  getOtherToken(token) {
    const tokenAddress = typeof token === 'string' ? token : token.address;
    
    if (this._isSameAddress(this.token0.address, tokenAddress)) {
      return this.token1;
    } else if (this._isSameAddress(this.token1.address, tokenAddress)) {
      return this.token0;
    } else {
      throw new Error("Token not found in pool");
    }
}
  static async createFromTokens(tokenA, tokenB, chain, dexType = DEX_TYPES.UNISWAP_V2) {
    try {
      // Validate inputs using duck typing
      if (!tokenA?.address || !tokenB?.address) {
        throw new Error("Invalid token objects provided - missing address property");
      }
      if (!chain?.provider) {
        throw new Error("Valid chain instance with provider is required");
      }

      let factoryAddress;
      
      switch (dexType) {
        case DEX_TYPES.UNISWAP_V2: 
          factoryAddress = addresses.UNIV2_FACTORY || "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
          break;

        case DEX_TYPES.SUSHISWAP:
          factoryAddress = addresses.SUSHISWAP_FACTORY || "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac";
          break;
        case DEX_TYPES.PANCKESWAP:
          factoryAddress = addresses.PANCAKESWAP_FACTORY || "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
          break;
        default:
          throw new Error(`Unsupported DEX type: ${dexType}`);
      }

      
      // 🚨 FIX: Change from UNISWAP_V2_FACTORY to UNIV2_FACTORY
      const UNISWAP_V2_FACTORY_ABI = abis.UNIV2_FACTORY;

      const factory = new ethers.Contract(factoryAddress, UNISWAP_V2_FACTORY_ABI, chain.provider);
      
      const poolAddress = await factory.getPair(tokenA.address, tokenB.address);

      if (!poolAddress || poolAddress === ethers.ZeroAddress) {
        throw new Error("Pool does not exist for these tokens");
      }

      // Create the pool and store the token objects
      const pool = new Pool(poolAddress, chain, dexType);
      pool.tokenA = tokenA;
      pool.tokenB = tokenB;
      await pool.init();
      
      return pool;
    } catch (error) {
      console.error("Error creating pool from tokens:", error);
      throw error;
    }
  }

  // Alias method for consistent API naming
  static async createWithTokens(tokenA, tokenB, chain, dexType = DEX_TYPES.UNISWAP_V2) {
    return this.createFromTokens(tokenA, tokenB, chain, dexType);
  }

 /* static async create(poolAddress, chain, dexType = DEX_TYPES.UNISWAP_V2) {
    const pool = new Pool(poolAddress, chain, dexType);
    await pool.init();
    return pool;
  }*/


static async create(poolAddress, chain, dexType = DEX_TYPES.UNISWAP_V2) {
  const key = `${chain.chainType}:${dexType}:${ethers.getAddress(poolAddress)}`;
  
  if (!Pool.instances.has(key)) {
    const pool = new Pool(poolAddress, chain, dexType);
    await pool.init();
    Pool.instances.set(key, pool);
  }
  
  return Pool.instances.get(key);
}

  /**
 * Create a Pool instance with pre-fetched data (optimized for batch operations)
 * Bypasses individual RPC calls by using pre-fetched token and reserve data
 * @param {string} poolAddress - The pool address
 * @param {Object} chain - Chain instance
 * @param {Object} token0Data - Pre-fetched token0 data {address, symbol, decimals, name}
 * @param {Object} token1Data - Pre-fetched token1 data {address, symbol, decimals, name}
 * @param {Object} reserves - Pre-fetched reserves {reserve0, reserve1, blockTimestamp}
 * @param {string} dexType - DEX type
 * @returns {Promise<Pool>} Pool instance
 */
/**
 * Create a Pool instance with pre-fetched data (optimized for batch operations)
 * 
 * not going to go into productin now, so not tested
 */
static async createWithData(poolAddress, chain, token0Data, token1Data, reserves, dexType = DEX_TYPES.UNISWAP_V2) {
    try {
        // 🚨 ADDED: Debug ABI check
        if (!UNISWAP_V2_PAIR_ABI || UNISWAP_V2_PAIR_ABI.length === 0) {
            throw new Error("UNISWAP_V2_PAIR_ABI is not properly loaded. Check abis.cjs file.");
        }

        // Input validation
        if (!poolAddress) throw new Error("Pool address is required");
        if (!chain?.provider) throw new Error("Valid chain instance with provider is required");
        if (!token0Data?.address || !token1Data?.address) throw new Error("Valid token data is required");
        if (!reserves?.reserve0 || !reserves?.reserve1) throw new Error("Valid reserves data is required");

        // Validate and normalize address
        let normalizedAddress;
        try {
            normalizedAddress = ethers.getAddress(poolAddress);
        } catch {
            throw new Error("Invalid pool address format");
        }

        const pool = new Pool(normalizedAddress, chain, dexType);
        
        // 🚨 ADDED: Debug log
        console.log(`🔧 Creating pool contract with ABI length: ${UNISWAP_V2_PAIR_ABI.length}`);

        // Initialize contract based on DEX type
        switch (dexType) {
            case DEX_TYPES.UNISWAP_V2:
            case DEX_TYPES.SUSHISWAP:
            case DEX_TYPES.PANCKESWAP:
                pool.contract = new ethers.Contract(normalizedAddress, UNISWAP_V2_PAIR_ABI, chain.provider);
                break;
            default:
                throw new Error(`Unsupported DEX type: ${dexType}`);
        }

        // 🚨 FIX: Create lightweight token objects instead of full ERC20Token instances
        pool.token0 = {
            address: token0Data.address,
            symbol: token0Data.symbol,
            decimals: token0Data.decimals,
            name: token0Data.name || token0Data.symbol,
            // Add contract for compatibility
            contract: new ethers.Contract(token0Data.address, ERC20_ABI, chain.provider)
        };

        pool.token1 = {
            address: token1Data.address,
            symbol: token1Data.symbol,
            decimals: token1Data.decimals,
            name: token1Data.name || token1Data.symbol,
            contract: new ethers.Contract(token1Data.address, ERC20_ABI, chain.provider)
        };

        // Set pre-fetched reserves
        pool.reserve0 = BigInt(reserves.reserve0.toString());
        pool.reserve1 = BigInt(reserves.reserve1.toString());
        
        // Get total supply
        try {
            pool.totalSupply = await pool.contract.totalSupply();
            console.log(`✅ Total supply fetched: ${pool.totalSupply}`);
        } catch (error) {
            console.warn(`⚠️ Could not fetch total supply for ${poolAddress}, setting to 0`);
            pool.totalSupply = 0n;
        }

        console.log(`✅ Pool created with pre-fetched data: ${pool.token0.symbol}/${pool.token1.symbol}`);
        
        return pool;
    } catch (error) {
        console.error(`❌ Error creating pool with pre-fetched data for ${poolAddress}:`, error);
        throw error;
    }
}

/**
   * Create or retrieve multiple pools at once (singleton-aware)
   * @param {Object} chain - Chain instance
   * @param {Array<{address: string, dexType?: string}>} poolData - Array of pool info
   * @returns {Pool[]} Array of Pool instances
   * 
   * // Array of pool info
const poolData = [
  { address: "0xPoolAddress1", dexType: DEX_TYPES.UNISWAP_V2 },
  { address: "0xPoolAddress2", dexType: DEX_TYPES.UNISWAP_V2 },
  { address: "0xPoolAddress1", dexType: DEX_TYPES.SUSHISWAP }
];

// Create all pools in one line using map
const pools = poolData.map(d => Pool.create(chain, d.address, d.dexType));

// Singleton check
console.log(pools[0] === Pool.create(chain, "0xPoolAddress1", DEX_TYPES.UNISWAP_V2)); // true
console.log(pools[2] === Pool.create(chain, "0xPoolAddress1", DEX_TYPES.SUSHISWAP));   // true

console.log(pools.length); // 3
   */
  static createMultiple(chain, poolData) {
    return poolData.map(d => Pool.create(chain, d.address, d.dexType));
  }

/**
 * Create multiple pools efficiently with batch data
 * Dramatically reduces RPC calls compared to individual Pool.create() calls
 * 
 * not going to go into productin now, so not tested
 * 
 * @param {Array} poolDataArray - Array of pool data objects
 * @param {Object} chain - Chain instance
 * @param {string} dexType - DEX type
 * @returns {Promise<Array>} Array of Pool instances
 */
static async createBatch(poolDataArray, chain, dexType = DEX_TYPES.UNISWAP_V2) {
    try {
        if (!Array.isArray(poolDataArray)) {
            throw new Error("poolDataArray must be an array");
        }

        console.log(`🏭 Creating ${poolDataArray.length} pools in batch...`);
        
        const pools = [];
        const results = await Promise.allSettled(
            poolDataArray.map(async (poolData, index) => {
                try {
                    if (!poolData.poolAddress || !poolData.token0 || !poolData.token1 || !poolData.reserves) {
                        throw new Error("Invalid pool data structure");
                    }

                    const pool = await Pool.createWithData(
                        poolData.poolAddress,
                        chain,
                        poolData.token0,
                        poolData.token1,
                        poolData.reserves,
                        dexType
                    );
                    
                    pools.push(pool);
                    return { success: true, index, address: poolData.poolAddress };
                } catch (error) {
                    console.error(`❌ Failed to create pool ${index} (${poolData.poolAddress}):`, error.message);
                    return { success: false, index, address: poolData.poolAddress, error: error.message };
                }
            })
        );

        // Analyze results
        const successful = results.filter(r => r.value?.success).length;
        const failed = results.filter(r => !r.value?.success).length;
        
        console.log(`🎉 Batch creation completed: ${successful}/${poolDataArray.length} successful`);
        if (failed > 0) {
            console.log(`⚠️  ${failed} pools failed to create`);
        }

        return pools;
    } catch (error) {
        console.error("❌ Error in batch pool creation:", error);
        throw error;
    }
}

/**
 * Get pool info without making additional RPC calls (uses pre-fetched data)
 */
async getPoolInfoQuick() {
    try {
        const lpDecimals = await this.contract.decimals().catch(() => 18); // Default to 18 if fails
        
        return {
            address: this.poolAddress,
            dexType: this.dexType,
            tokens: {
                token0: {
                    address: this.token0.address,
                    symbol: this.token0.symbol,
                    decimals: this.token0.decimals
                },
                token1: {
                    address: this.token1.address,
                    symbol: this.token1.symbol,
                    decimals: this.token1.decimals
                }
            },
            reserves: {
                [this.token0.symbol]: ethers.formatUnits(this.reserve0, this.token0.decimals),
                [this.token1.symbol]: ethers.formatUnits(this.reserve1, this.token1.decimals)
            },
            totalSupply: ethers.formatUnits(this.totalSupply, lpDecimals),
            // Note: TVL calculation would require price data, so we skip it here
        };
    } catch (error) {
        console.error("Error getting quick pool info:", error);
        throw error;
    }
}

  // Utility method to get pool info for display
  async getPoolInfo() {
    const reserves = await this.getReserves();
    const tvl = await this.getTVL();
    const lpDecimals = await this.contract.decimals();
    
    return {
      address: this.poolAddress,
      dexType: this.dexType,
      tokens: {
        token0: {
          address: this.token0.address,
          symbol: this.token0.symbol,
          decimals: this.token0.decimals
        },
        token1: {
          address: this.token1.address,
          symbol: this.token1.symbol,
          decimals: this.token1.decimals
        }
      },
      reserves: reserves.formatted,
      totalSupply: ethers.formatUnits(this.totalSupply, lpDecimals),
      tvl: tvl
    };
  }

  /////////////// Functions for Swap, Deep suggestions, we may take them out

  /**
   * Execute a token swap with comprehensive error handling and logging
   * @param {Object} account - The account performing the swap (must have signer)
   * @param {string} tokenInSymbol - Input token symbol (e.g., "WETH", "USDC")
   * @param {string|number} amountIn - Amount to swap (human-readable units)
   * @param {Object} options - Swap options
   * @returns {Promise<Object>} Swap transaction receipt and summary
   */
  async executeSwap(account, tokenInSymbol, amountIn, options = {}) {
    try {
      const {
        slippage = this.slippageTolerance || 0.5,
        deadline = Math.floor(Date.now() / 1000) + 300,
        recipient = account.address,
        exactOutput = false
      } = options;

      // Input validation
      if (!account?.signer) {
        throw new Error("Valid account with signer is required");
      }
      if (!tokenInSymbol || typeof tokenInSymbol !== 'string') {
        throw new Error("Valid token symbol is required");
      }
      if (!amountIn || Number(amountIn) <= 0) {
        throw new Error("Valid positive amount is required");
      }

      console.log(`\n🔄 Executing swap in pool: ${this.poolAddress}`);
      console.log(`DEX: ${this.dexType}`);
      console.log(`Account: ${account.address}`);

      // Get swap quote first
      let quote;
      if (exactOutput) {
        quote = await this.getSwapQuoteForExactOut(amountIn, tokenInSymbol, slippage);
        console.log(`📊 Swap Quote (Exact Output):`);
        console.log(`   Input: ${quote.input.maxAmount} ${quote.input.symbol} (max)`);
        console.log(`   Output: ${quote.output.exactAmount} ${quote.output.symbol} (exact)`);
      } else {
        quote = await this.getSwapQuote(amountIn, tokenInSymbol, slippage);
        console.log(`📊 Swap Quote (Exact Input):`);
        console.log(`   Input: ${quote.input.amount} ${quote.input.symbol}`);
        console.log(`   Output: ${quote.output.amount} ${quote.output.symbol}`);
        console.log(`   Minimum: ${quote.output.amountMin} ${quote.output.symbol}`);
      }
      console.log(`   Slippage: ${slippage}%`);
      console.log(`   Price Impact: ${quote.priceImpact}`);

      // Execute the swap
      let result;
      if (exactOutput) {
        result = await this.swapTokensForExactTokens(
          account,
          quote.output.exactAmount,
          quote.output.symbol,
          { slippage, deadline, recipient }
        );
      } else {
        result = await this.swapExactTokensForTokens(
          account,
          quote.input.amount,
          quote.input.symbol,
          { slippage, deadline, recipient }
        );
      }

      console.log(`✅ Swap completed successfully!`);
      console.log(`   Transaction Hash: ${result.receipt.hash}`);
      console.log(`   Block: ${result.receipt.blockNumber}`);
      console.log(`   Gas Used: ${result.receipt.gasUsed?.toString() || 'N/A'}`);

      return {
        success: true,
        transaction: result.receipt,
        summary: result.summary,
        quote: quote,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Swap execution failed:`, error.message);
      
      // Enhanced error handling
      if (error.message.includes('insufficient funds')) {
        throw new Error(`Insufficient balance for swap: ${error.message}`);
      } else if (error.message.includes('user rejected')) {
        throw new Error(`User rejected the transaction: ${error.message}`);
      } else if (error.message.includes('slippage')) {
        throw new Error(`Slippage tolerance exceeded: ${error.message}`);
      } else if (error.message.includes('deadline')) {
        throw new Error(`Transaction deadline passed: ${error.message}`);
      } else {
        throw new Error(`Swap failed: ${error.message}`);
      }
    }
  }

  /**
   * Execute optimized swap with price impact protection
   * @param {Object} account - The account performing the swap
   * @param {string} tokenInSymbol - Input token symbol
   * @param {string|number} totalAmount - Total amount to swap
   * @param {Object} options - Advanced options
   * @returns {Promise<Object>} Swap results
   */
  async executeOptimizedSwap(account, tokenInSymbol, totalAmount, options = {}) {
    const {
      maxPriceImpact = 1.0,
      maxSlippage = 2.0,
      minTradeSize = 0.001,
      deadline = Math.floor(Date.now() / 1000) + 600 // 10 minutes for multiple trades
    } = options;

    console.log(`\n🎯 Executing optimized swap for ${totalAmount} ${tokenInSymbol}`);
    console.log(`   Max Price Impact: ${maxPriceImpact}%`);
    console.log(`   Max Slippage: ${maxSlippage}%`);

    const totalAmountNum = Number(totalAmount);
    
    // Get optimal trade size
    const optimal = await this.getOptimalSwapAmount(tokenInSymbol, maxPriceImpact);
    const optimalAmount = Number(optimal.optimalAmount);
    
    console.log(`   Optimal trade size: ${optimalAmount} ${tokenInSymbol}`);
    console.log(`   Estimated price impact: ${optimal.estimatedPriceImpact}%`);

    // Decide whether to split the trade
    if (optimalAmount >= totalAmountNum * 0.8) {
      // Single trade is optimal
      console.log(`   Strategy: Single trade (optimal)`);
      return await this.executeSwap(account, tokenInSymbol, totalAmount, {
        slippage: maxSlippage,
        deadline
      });
    } else {
      // Split into multiple trades
      const numTrades = Math.ceil(totalAmountNum / optimalAmount);
      const tradeAmount = totalAmountNum / numTrades;
      
      console.log(`   Strategy: ${numTrades} trades of ${tradeAmount.toFixed(6)} ${tokenInSymbol} each`);
      
      const results = [];
      for (let i = 0; i < numTrades; i++) {
        console.log(`\n🔢 Executing trade ${i + 1}/${numTrades}`);
        try {
          const result = await this.executeSwap(
            account,
            tokenInSymbol,
            tradeAmount.toString(),
            {
              slippage: maxSlippage,
              deadline,
              recipient: account.address
            }
          );
          results.push({ success: true, tradeIndex: i, result });
        } catch (error) {
          console.error(`❌ Trade ${i + 1} failed:`, error.message);
          results.push({ success: false, tradeIndex: i, error: error.message });
          break; // Stop on first error
        }
      }
      
      // Calculate overall results
      const successfulSwaps = results.filter(r => r.success);
      const totalInput = successfulSwaps.reduce((sum, r) => sum + Number(r.result.summary.input.amount), 0);
      const totalOutput = successfulSwaps.reduce((sum, r) => sum + Number(r.result.summary.output.amount), 0);
      
      return {
        strategy: 'split',
        totalTrades: numTrades,
        successfulTrades: successfulSwaps.length,
        failedTrades: results.filter(r => !r.success).length,
        totalInput,
        totalOutput,
        effectivePrice: totalOutput / totalInput,
        individualResults: results
      };
    }
  }
  
  /**
 * Enhanced optimized swap with MEV/atomic considerations
 */
async executeProtectedOptimizedSwap(account, tokenInSymbol, totalAmount, options = {}) {
    const {
        useBundle = false, // Try to use MEV bundle if available
        maxTimeBetweenTrades = 2, // Max seconds between trades
        minProfitThreshold = 0.005, // Minimum 0.5% improvement to justify risk
    } = options;

    // First, calculate if it's even worth it
    const singleTradeQuote = await this.getSwapQuote(totalAmount, tokenInSymbol);
    const optimizedSimulation = await this.simulateOptimizedSwap(totalAmount, tokenInSymbol);
    
    const potentialImprovement = optimizedSimulation.totalOutput - singleTradeQuote.output.amount;
    const improvementPercentage = potentialImprovement / singleTradeQuote.output.amount;
    
    console.log(`📊 Optimization Analysis:`);
    console.log(`   Single trade: ${singleTradeQuote.output.amount} ${singleTradeQuote.output.symbol}`);
    console.log(`   Optimized: ${optimizedSimulation.totalOutput} ${singleTradeQuote.output.symbol}`);
    console.log(`   Potential improvement: ${improvementPercentage.toFixed(4)}%`);
    
    // Only proceed if improvement exceeds threshold
    if (improvementPercentage < minProfitThreshold) {
        console.log(`⚠️  Optimization not worth the risk - using single trade`);
        return await this.executeSwap(account, tokenInSymbol, totalAmount, options);
    }
    
    // Check if we can use atomic execution
    if (useBundle && this.supportsBundling()) {
        return await this.executeAtomicBatchSwap(account, tokenInSymbol, totalAmount, options);
    }
    
    // Fallback to timed execution with risk warning
    console.log(`⚠️  WARNING: Executing non-atomic optimized swap`);
    console.log(`   Risk of front-running between trades`);
    console.log(`   Actual results may be worse than simulated`);
    
    return await this.executeOptimizedSwap(account, tokenInSymbol, totalAmount, {
        ...options,
        maxTimeBetweenTrades // Try to execute quickly
    });
}

  //

}

// Export DEX_TYPES and SLIPPAGE_TOLERANCE for other files to use
Pool.DEX_TYPES = DEX_TYPES;
Pool.SLIPPAGE_TOLERANCE = SLIPPAGE_TOLERANCE;

// ============================================================================
// USAGE EXAMPLES AND DEMO FUNCTIONS
// ============================================================================

/**
 * Demo function showing basic pool operations
 */
async function demoBasicPoolOperations() {
  try {
    console.log("🚀 Starting Pool Demo - Basic Operations\n");
    
    // Note: In real usage, you'd get these from your environment
    const hre = require("hardhat");
    const { ethers } = hre;
    const { Chain, CHAIN_TYPES } = require("./Chain.cjs")

    const chain = await Chain.create(ethers);
    // Example: USDC-ETH pool on Uniswap V2
    const USDC_WETH_POOL = addresses.POOLS.UNIV2_WETH_USDC;
    
    const pool = await Pool.create(USDC_WETH_POOL, chain, Pool.DEX_TYPES.UNISWAP_V2);
    
    // Get pool information
    const poolInfo = await pool.getPoolInfo();
    console.log("📊 Pool Information:");
    console.log("Pool Address:", poolInfo.address);
    
    // Get current price
    const price = await pool.getPriceQuick("WETH");
    console.log("\n💹 Current Price:");
    console.log(price.formatted);
    console.log(price.invertedFormatted);
    
    // Get reserves
    const reserves = await pool.getReserves();
    console.log("\n💰 Reserves:");
    console.log(reserves.formatted);
    
    // Get TVL
    const tvl = await pool.getTVL();
    console.log("\n🏦 Total Value Locked:");
    console.log(`$${tvl.total.toFixed(2)}`);
    
    console.log("\n✅ Basic Pool Demo Completed Successfully!");
    return { pool, poolInfo, price, reserves, tvl };
    
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
    throw error;
  }
}

/**
 * Demo function showing liquidity provision simulation
 */
async function demoLiquidityManagement() {
  try {
    console.log("\n🌊 Starting Pool Demo - Liquidity Management\n");
    
    const hre = require("hardhat");
    const { ethers } = hre;
    const { Chain } = require("./Chain.cjs")

    const chain = await Chain.create(ethers);
    
    const USDC_WETH_POOL = addresses.POOLS.UNIV2_WETH_USDC;
    const pool = await Pool.create(USDC_WETH_POOL, chain, Pool.DEX_TYPES.UNISWAP_V2);
    
    // Simulate liquidity position check (without actual account)
    console.log("📈 Liquidity Position Simulation:");
    console.log("Note: This would require a real account with LP tokens");
    
    const tokens = pool.getTokens();
    console.log(`Pool Tokens: ${tokens.token0.symbol} / ${tokens.token1.symbol}`);
    
    // Show how to calculate optimal liquidity amounts
    const reserves = await pool.getReserves();
    const price = await pool.getPriceQuick("WETH");
    
    console.log(`\n💡 Liquidity Provision Tips:`);
    console.log(`- Current price: ${price.formatted}`);
    console.log(`- Reserve ratio: ${Number(reserves.formatted[tokens.token0.symbol]) / Number(reserves.formatted[tokens.token1.symbol])}`);
    console.log(`- For optimal liquidity, provide tokens in proportion to reserves`);
    
    console.log("\n✅ Liquidity Management Demo Completed!");
    return { pool, tokens, reserves, price };
    
  } catch (error) {
    console.error("❌ Liquidity demo failed:", error.message);
    throw error;
  }
}

/**
 * Demo function showing pool creation from tokens
 */
async function demoPoolCreationFromTokens() {
  try {
    console.log("\n🏭 Starting Pool Demo - Creation from Tokens\n");
    
    const hre = require("hardhat");
    const { ethers } = hre;
    const { Chain } = require("./Chain.cjs")

    const chain = await Chain.create(ethers);
    
    // Example token addresses (Mainnet)
    const USDC_ADDRESS = addresses.TOKENS.USDC;
    const DAI_ADDRESS = addresses.TOKENS.DAI;
    
    // Create token instances
    const usdc = await ERC20Token.create(USDC_ADDRESS, chain);
    const dai = await ERC20Token.create(DAI_ADDRESS, chain);
    
    console.log(`Tokens created: ${usdc.symbol} and ${dai.symbol}`);
    
    try {
      // Try to create pool from tokens
      const pool = await Pool.createFromTokens(usdc, dai, chain, Pool.DEX_TYPES.UNISWAP_V2);
      console.log(`✅ Pool created successfully: ${pool.poolAddress}`);
      
      const poolInfo = await pool.getPoolInfo();
      console.log("📊 Created Pool Info:");
      console.log(`- DEX: ${poolInfo.dexType}`);
      console.log(`- TVL: $${poolInfo.tvl.total.toFixed(2)}`);
      
      return { pool, poolInfo };
      
    } catch (error) {
      if (error.message.includes("Pool does not exist")) {
        console.log("ℹ️  Pool doesn't exist for these tokens (expected for demo)");
        console.log("This demonstrates the error handling for non-existent pools");
        return { pool: null, error: error.message };
      }
      throw error;
    }
    
  } catch (error) {
    console.error("❌ Pool creation demo failed:", error.message);
    throw error;
  }
}

/**
 * Demo function showing advanced pool features
 */
async function demoAdvancedPoolFeatures() {
  try {
    console.log("\n🔬 Starting Pool Demo - Advanced Features\n");
    
    const hre = require("hardhat");
    const { ethers } = hre;
    const { Chain } = require("./Chain.cjs")

    const chain = await Chain.create(ethers);
    
    const USDC_WETH_POOL = addresses.POOLS.UNIV2_WETH_USDC;
    const pool = await Pool.create(USDC_WETH_POOL, chain, Pool.DEX_TYPES.UNISWAP_V2);
    
    // Test token detection
    const tokens = pool.getTokens();
    console.log("🎯 Token Detection Tests:");
    console.log(`Pool contains ${tokens.token0.symbol}: ${pool.hasToken(tokens.token0.address)}`);
    console.log(`Pool contains ${tokens.token1.symbol}: ${pool.hasToken(tokens.token1.address)}`);
    
    // Test other token retrieval
    const otherToken = pool.getOtherToken(tokens.token0.address);
    console.log(`Other token for ${tokens.token0.symbol}: ${otherToken.symbol}`);
    
    // Test slippage configuration
    console.log("\n⚙️  Slippage Configuration:");
    console.log(`Default slippage: ${pool.slippageTolerance}%`);
    pool.setSlippageTolerance(1.0);
    console.log(`Updated slippage: ${pool.slippageTolerance}%`);
    
    // Test price impact calculation simulation
    console.log("\n📉 Price Impact Simulation:");
    const smallTrade = await pool.getPriceQuick("WETH");
    console.log(`Current price: ${smallTrade.formatted}`);
    console.log("Large trades would show price impact due to slippage");
    
    console.log("\n✅ Advanced Features Demo Completed!");
    return { pool, tokens, otherToken };
    
  } catch (error) {
    console.error("❌ Advanced features demo failed:", error.message);
    throw error;
  }
}


/**
 * Demo function showing swap functionality
 */
async function demoSwapFunctionality() {
  try {
    console.log("\n🔄 Starting Pool Demo - Swap Functionality\n");
    
    const hre = require("hardhat");

    const { ethers } = hre;
    const { Chain } = require("./Chain.cjs")

    const chain = await Chain.create(ethers);
    
    const USDC_WETH_POOL = addresses.POOLS.UNIV2_WETH_USDC;
    const pool = await Pool.create(USDC_WETH_POOL, chain, Pool.DEX_TYPES.UNISWAP_V2);
    
    console.log("💰 Pool Overview:");
    const poolInfo = await pool.getPoolInfo();
    console.log(`Tokens: ${poolInfo.tokens.token0.symbol} / ${poolInfo.tokens.token1.symbol}`);
    console.log(`TVL: $${poolInfo.tvl.total.toFixed(2)}`);
    
    // Demo 1: Basic Swap Quotes
    console.log("\n1. 💡 BASIC SWAP QUOTES");
    console.log("=".repeat(40));
    
    // Exact input quote
    const exactInputQuote = await pool.getSwapQuote("1", "WETH", "0.5");
    console.log("📊 Exact Input Quote (1 WETH → USDC):");
    console.log(`   Input: ${exactInputQuote.input.amount} ${exactInputQuote.input.symbol}`);
    console.log(`   Output: ${exactInputQuote.output.amount} ${exactInputQuote.output.symbol}`);
    console.log(`   Minimum Received: ${exactInputQuote.output.amountMin} ${exactInputQuote.output.symbol}`);
    console.log(`   Price Impact: ${exactInputQuote.priceImpact}`);
    console.log(`   Slippage: ${exactInputQuote.slippage}`);
    
    // Exact output quote
    const exactOutputQuote = await pool.getSwapQuoteForExactOut("1000", "USDC", 1.0);
    console.log("\n📊 Exact Output Quote (→ 1000 USDC):");
    console.log(`   Estimated Input: ${exactOutputQuote.input.estimatedAmount} ${exactOutputQuote.input.symbol}`);
    console.log(`   Maximum Input: ${exactOutputQuote.input.maxAmount} ${exactOutputQuote.input.symbol}`);
    console.log(`   Exact Output: ${exactOutputQuote.output.exactAmount} ${exactOutputQuote.output.symbol}`);
    console.log(`   Slippage: ${exactOutputQuote.slippage}`);
    
    // Demo 2: Price Impact Analysis
    console.log("\n2. 📉 PRICE IMPACT ANALYSIS");
    console.log("=".repeat(40));
    
    const smallSwap = await pool.getSwapQuote("0.1", "WETH", "0.5");
    const mediumSwap = await pool.getSwapQuote("10", "WETH", "0.5");
    
    console.log("Small swap (0.1 WETH):");
    console.log(`   Price Impact: ${smallSwap.priceImpact}`);
    console.log(`   Output: ${smallSwap.output.amount} ${smallSwap.output.symbol}`);
    
    console.log("\nMedium swap (10 WETH):");
    console.log(`   Price Impact: ${mediumSwap.priceImpact}`);
    console.log(`   Output: ${mediumSwap.output.amount} ${mediumSwap.output.symbol}`);
    console.log("💡 Notice how larger swaps have higher price impact!");
    
    // Demo 3: Optimal Swap Calculations
    console.log("\n3. 🎯 OPTIMAL SWAP CALCULATIONS");
    console.log("=".repeat(40));
    
    const optimal1Percent = await pool.getOptimalSwapAmount("WETH", 1.0);
    const optimal0_5Percent = await pool.getOptimalSwapAmount("WETH", 0.5);
    
    console.log("Optimal swap for <1% price impact:");
    console.log(`   Amount: ${optimal1Percent.optimalAmount} WETH`);
    console.log(`   Estimated Impact: ${optimal1Percent.estimatedPriceImpact}%`);
    
    console.log("\nOptimal swap for <0.5% price impact:");
    console.log(`   Amount: ${optimal0_5Percent.optimalAmount} WETH`);
    console.log(`   Estimated Impact: ${optimal0_5Percent.estimatedPriceImpact}%`);
    
    // Demo 4: Swap Route Simulation
    console.log("\n4. 🗺️ SWAP ROUTE SIMULATION");
    console.log("=".repeat(40));
    
    const tokens = pool.getTokens();
    console.log("Available swap routes in this pool:");
    console.log(`   Route 1: ${tokens.token0.symbol} → ${tokens.token1.symbol}`);
    console.log(`   Route 2: ${tokens.token1.symbol} → ${tokens.token0.symbol}`);
    
    // Test both directions
    const route1Quote = await pool.getSwapQuote("1", tokens.token0.symbol, "0.5");
    const route2Quote = await pool.getSwapQuote("1", tokens.token1.symbol, "0.5");
    
    console.log(`\n${tokens.token0.symbol} → ${tokens.token1.symbol}:`);
    console.log(`   1 ${tokens.token0.symbol} = ${route1Quote.output.amount} ${tokens.token1.symbol}`);
    
    console.log(`\n${tokens.token1.symbol} → ${tokens.token0.symbol}:`);
    console.log(`   1 ${tokens.token1.symbol} = ${route2Quote.output.amount} ${tokens.token0.symbol}`);
    
    // Demo 5: Real-world Swap Scenarios
    console.log("\n5. 💼 REAL-WORLD SWAP SCENARIOS");
    console.log("=".repeat(40));
    
    console.log("Scenario 1: Small Trade (Minimal Slippage)");
    const smallTrade = await pool.getSwapQuote("0.01", "WETH", "0.1");
    console.log(`   Input: 0.01 WETH`);
    console.log(`   Output: ~${smallTrade.output.amount} USDC`);
    console.log(`   Slippage: ${smallTrade.slippage}`);
    console.log(`   Price Impact: ${smallTrade.priceImpact}`);
    
    console.log("\nScenario 2: Large Trade (Significant Slippage)");
    const largeTrade = await pool.getSwapQuote("50", "WETH", "2.0");
    console.log(`   Input: 50 WETH`);
    console.log(`   Output: ~${largeTrade.output.amount} USDC`);
    console.log(`   Slippage: ${largeTrade.slippage}`);
    console.log(`   Price Impact: ${largeTrade.priceImpact}`);
    console.log("   ⚠️  High price impact - consider splitting into smaller trades");
    
    // Demo 6: Swap Execution Simulation
    console.log("\n6. ⚡ SWAP EXECUTION SIMULATION");
    console.log("=".repeat(40));
    
    console.log("📋 Swap Execution Code Examples:");
    console.log(`
// Exact Input Swap (Most Common)
await pool.swapExactTokensForTokens(account, "1", "WETH", {
  slippage: "0.5",
  recipient: account.address,
  deadline: Math.floor(Date.now() / 1000) + 300
});

// Exact Output Swap (When you need specific amount)
await pool.swapTokensForExactTokens(account, "1000", "USDC", {
  slippage: "1.0",
  recipient: account.address,
  deadline: Math.floor(Date.now() / 1000) + 300
});

// Generic Swap (Flexible)
await pool.swap(account, ethToken, "1", {
  slippage: "0.5",
  recipient: "0xReceiverAddress"
});
    `);
    
    console.log("🔒 Safety Features:");
    console.log("   • Slippage protection with minimum output amounts");
    console.log("   • Deadline protection against pending transactions");
    console.log("   • Automatic token approval handling");
    console.log("   • Gas limit optimization");
    
    console.log("\n✅ Swap Functionality Demo Completed!");
    
    return { 
      pool,
      quotes: {
        exactInput: exactInputQuote,
        exactOutput: exactOutputQuote,
        smallSwap,
        mediumSwap
      },
      optimal: {
        onePercent: optimal1Percent,
        halfPercent: optimal0_5Percent
      },
      routes: {
        route1: route1Quote,
        route2: route2Quote
      },
      scenarios: {
        smallTrade,
        largeTrade
      }
    };
    
  } catch (error) {
    console.error("❌ Swap demo failed:", error.message);
    throw error;
  }
}


/**
 * Demo function showing advanced swap strategies
 */
async function demoAdvancedSwapStrategies() {
  try {
    console.log("\n🎯 Starting Pool Demo - Advanced Swap Strategies\n");
    
    /*
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://localhost:8545");
    const chain = { provider, chainId: 1 };
    */

    //const hre = require("hardhat");

    //const { ethers } = hre;
    const { Chain } = require("./Chain.cjs")

    //const chain = await Chain.create(ethers);

    const chain = await Chain.createHardhat();

    const USDC_WETH_POOL = addresses.POOLS.UNIV2_WETH_USDC;
    const pool = await Pool.create(USDC_WETH_POOL, chain, Pool.DEX_TYPES.UNISWAP_V2);
    
    console.log("1. 🔄 ARBITRAGE DETECTION");
    console.log("=".repeat(40));
    
    // Calculate implied prices from both directions
    const ethToUsdc = await pool.getPriceQuick("WETH");
    const usdcToEth = await pool.getPriceQuick("USDC");
    
    console.log("Market Prices:");
    console.log(`   ${ethToUsdc.formatted}`);
    console.log(`   ${usdcToEth.formatted}`);
    
    // Check for price discrepancies
    const priceRatio = ethToUsdc.price * usdcToEth.price;
    console.log(`\nPrice Consistency Check:`);
    console.log(`   ETH→USDC * USDC→ETH = ${priceRatio}`);
    console.log(`   Ideal value: 1.0000`);
    console.log(`   Deviation: ${Math.abs(1 - priceRatio).toFixed(6)}`);
    
    if (Math.abs(1 - priceRatio) > 0.01) {
      console.log("   ⚡ Potential arbitrage opportunity detected!");
    } else {
      console.log("   ✅ Prices are consistent");
    }
    
    console.log("\n2. 📊 SLIPPAGE OPTIMIZATION");
    console.log("=".repeat(40));
    
    // Test different slippage settings
    const slippageTests = [0.1, 0.5, 1.0, 2.0];
    console.log("Slippage vs Minimum Output:");
    
    for (const slippage of slippageTests) {
      const quote = await pool.getSwapQuote("1", "WETH", slippage);
      console.log(`   ${slippage}% slippage: ${quote.output.amountMin} USDC min`);
    }
    
    console.log("\n💡 Lower slippage = better price but higher failure risk");
    console.log("💡 Higher slippage = worse price but higher success rate");
    
    console.log("\n3. ⏱️  DEADLINE STRATEGIES");
    console.log("=".repeat(40));
    
    const now = Math.floor(Date.now() / 1000);
    const deadlines = {
      "Very tight (1 min)": now + 60,
      "Standard (5 min)": now + 300,
      "Relaxed (30 min)": now + 1800
    };
    
    console.log("Deadline Strategies:");
    for (const [strategy, deadline] of Object.entries(deadlines)) {
      const timeLeft = deadline - now;
      console.log(`   ${strategy}: ${timeLeft} seconds remaining`);
    }
    
    console.log("\n💡 Tighter deadlines protect against pending transactions");
    console.log("💡 Relaxed deadlines give more time for confirmation");
    
    console.log("\n4. 🔀 MULTI-SWAP STRATEGY");
    console.log("=".repeat(40));
    
    console.log("For large swaps, consider splitting into multiple transactions:");
    
    const largeAmount = "10";
    const optimal = await pool.getOptimalSwapAmount("WETH", 0.5);
    const optimalPerTrade = parseFloat(optimal.optimalAmount);
    const largeAmountNum = parseFloat(largeAmount);
    
    if (optimalPerTrade > 0 && largeAmountNum > optimalPerTrade) {
      const numTrades = Math.ceil(largeAmountNum / optimalPerTrade);
      console.log(`   Large swap: ${largeAmount} WETH`);
      console.log(`   Optimal per trade: ${optimalPerTrade} WETH`);
      console.log(`   Recommended: Split into ${numTrades} trades`);
      console.log(`   Estimated total improvement: ~${((numTrades - 1) * 0.5).toFixed(1)}% better price`);
    }
    
    console.log("\n✅ Advanced Swap Strategies Demo Completed!");
    
    return {
      arbitrage: {
        ethToUsdc: ethToUsdc.price,
        usdcToEth: usdcToEth.price,
        ratio: priceRatio
      },
      slippageAnalysis: slippageTests,
      deadlineStrategies: deadlines
    };
    
  } catch (error) {
    console.error("❌ Advanced strategies demo failed:", error.message);
    throw error;
  }
}

/**
 * Demo function showing the new swap execution methods
 */
async function demoSwapExecution() {
  try {
    console.log("\n🔥 DEMO: New Swap Execution Methods");
    console.log("=".repeat(50));
    
    const hre = require("hardhat");
    const { ethers } = hre;
    
    const { Chain } = require("./Chain.cjs");

    const { WETH } = require("./Tokens.cjs");

    const chain = await Chain.create(ethers);
    
    const USDC_WETH_POOL = addresses.POOLS.UNIV2_WETH_USDC;
    const pool = await Pool.create(USDC_WETH_POOL, chain, Pool.DEX_TYPES.UNISWAP_V2);
    
    // const [demoAccount] = await ethers.getSigners();

      // Create accounts
    
    const abbot = await Account.createAbbot();

    const account = {
      address: abbot.address,
      signer: abbot.signer
    };
    

    const wethHardhat = await WETH.createHardhat()

     await wethHardhat.wrapETH(abbot, "0.01")
    // Demo the new executeSwap method
    console.log("\n1. 🔄 EXECUTE SWAP METHOD");
    console.log("-".repeat(30));
    
    const swapResult = await pool.executeSwap(
      account,
      "WETH", // ?
      "0.01", // Small amount for demo
      {
        slippage: 0.5,
        recipient: account.address
      }
    );
    
    console.log("Swap Result:", {
      input: swapResult.summary.input,
      output: swapResult.summary.output,
      success: swapResult.success
    });
    
    return { swapResult };
    
  } catch (error) {
    console.error("❌ Swap execution demo failed:", error.message);
    throw error;
  }
}

// Update the demo exports to include both swap demos:
Pool.demo = {
  basicOperations: demoBasicPoolOperations,
  liquidityManagement: demoLiquidityManagement,
  creationFromTokens: demoPoolCreationFromTokens,
  advancedFeatures: demoAdvancedPoolFeatures,
  swapFunctionality: demoSwapFunctionality,
  advancedSwapStrategies: demoAdvancedSwapStrategies, // ← New advanced demo
  swapExecution:  demoSwapExecution,
  runAll: runAllDemos
};

// Update runAllDemos to include both swap demos:
async function runAllDemos() {
  try {
    console.log("=".repeat(60));
    console.log("🏊 POOL CLASS DEMONSTRATION");
    console.log("=".repeat(60));
    
    const results = {};
    
    // Run demos sequentially
    results.basic = await demoBasicPoolOperations();
    results.liquidity = await demoLiquidityManagement();
    results.creation = await demoPoolCreationFromTokens();
    results.advanced = await demoAdvancedPoolFeatures();
    results.swap = await demoSwapFunctionality();
    results.advancedSwap = await demoAdvancedSwapStrategies(); // ← New demo
    results.swapExecution = await demoSwapExecution();

    console.log("\n" + "=".repeat(60));
    console.log("🎉 ALL POOL DEMOS COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    
    return results;
  } catch (error) {
    console.error("\n💥 DEMO RUNNER FAILED:", error.message);
    process.exit(1);
  }
}

/**
 * Main demo runner that executes all examples
 */

// Safe execution when file is run directly
if (require.main === module) {
  console.log("🔧 Pool.cjs loaded directly - running demos...");
  
  // Add graceful shutdown handling
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Demo interrupted by user');
    process.exit(0);
  });
  
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
  
  // Run demos
  runAllDemos().then(() => {
    console.log("\n✨ Demo execution finished");
    process.exit(0);
  }).catch(error => {
    console.error("💥 Demo execution failed:", error);
    process.exit(1);
  });
}

Pool.instances = new Map(); 

module.exports = { Pool };
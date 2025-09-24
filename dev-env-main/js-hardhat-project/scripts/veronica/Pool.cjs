const { ethers } = require("ethers");
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const { ERC20Token } = require("./ERC20Token.cjs");

const ERC20_ABI = abis.ERC20;
const UNISWAP_V2_PAIR_ABI = abis.UNISWAP_V2_PAIR;

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
      
      console.log("\n🏊 Pool Initialized:");
      console.log("Address:", this.poolAddress);
      console.log("DEX Type:", this.dexType);
      console.log("Token 0:", this.token0.address, `(${this.token0.symbol})`);
      console.log("Token 1:", this.token1.address, `(${this.token1.symbol})`);
      console.log("Reserves:", {
        [this.token0.symbol]: ethers.formatUnits(this.reserve0, this.token0.decimals),
        [this.token1.symbol]: ethers.formatUnits(this.reserve1, this.token1.decimals)
      });

      return this;
    } catch (error) {
      console.error(`Error initializing pool at ${this.poolAddress}:`, error);
      throw error;
    }
  }

  async _loadPoolData() {
    try {
      // Get token addresses with error handling
      const [token0Address, token1Address] = await Promise.all([
        this.contract.token0().catch(() => { 
          throw new Error("Failed to get token0 address from pool contract"); 
        }),
        this.contract.token1().catch(() => { 
          throw new Error("Failed to get token1 address from pool contract"); 
        })
      ]);

      // Validate token addresses
      if (!token0Address || token0Address === ethers.ZeroAddress) {
        throw new Error("Invalid token0 address from pool");
      }
      if (!token1Address || token1Address === ethers.ZeroAddress) {
        throw new Error("Invalid token1 address from pool");
      }

      // Use existing token objects if they match, otherwise create new ones
      if (this.tokenA && this._isSameAddress(this.tokenA.address, token0Address)) {
        this.token0 = this.tokenA;
      } else if (this.tokenA && this._isSameAddress(this.tokenA.address, token1Address)) {
        this.token0 = this.tokenA;
      } else {
        this.token0 = await ERC20Token.create(token0Address, this.chain);
      }

      if (this.tokenB && this._isSameAddress(this.tokenB.address, token1Address)) {
        this.token1 = this.tokenB;
      } else if (this.tokenB && this._isSameAddress(this.tokenB.address, token0Address)) {
        this.token1 = this.tokenB;
      } else {
        this.token1 = await ERC20Token.create(token1Address, this.chain);
      }

      // Get reserves with error handling
      const reserves = await this.contract.getReserves().catch(() => {
        throw new Error("Failed to get reserves from pool contract");
      });
      
      this.reserve0 = reserves[0];
      this.reserve1 = reserves[1];

      // Get total supply
      this.totalSupply = await this.contract.totalSupply().catch(() => {
        throw new Error("Failed to get total supply from pool contract");
      });

    } catch (error) {
      console.error("Error loading pool data for pool:", this.poolAddress, error);
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
          factoryAddress = addresses.UNISWAP_V2_FACTORY || "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
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

      const UNISWAP_V2_FACTORY_ABI = abis.UNISWAP_V2_FACTORY;
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

  static async create(poolAddress, chain, dexType = DEX_TYPES.UNISWAP_V2) {
    const pool = new Pool(poolAddress, chain, dexType);
    await pool.init();
    return pool;
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
}

// Export DEX_TYPES and SLIPPAGE_TOLERANCE for other files to use
Pool.DEX_TYPES = DEX_TYPES;
Pool.SLIPPAGE_TOLERANCE = SLIPPAGE_TOLERANCE;

module.exports = Pool;
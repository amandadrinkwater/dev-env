const { ethers } = require("ethers");
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const ERC20Token = require("./ERC20Token.cjs");

const ERC20_ABI = abis.ERC20;
const UNISWAP_V2_ROUTER_ABI = abis.UNISWAP_V2_ROUTER || require("@uniswap/v2-periphery/build/IUniswapV2Router02.json").abi;
const UNISWAP_V2_FACTORY_ABI = abis.UNISWAP_V2_FACTORY || require("@uniswap/v2-core/build/IUniswapV2Factory.json").abi;
const UNISWAP_V2_PAIR_ABI = abis.UNISWAP_V2_PAIR || require("@uniswap/v2-core/build/IUniswapV2Pair.json").abi;

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
    if (!chain) throw new Error("Chain instance is required");
    
    this.poolAddress = poolAddress;
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
  }

  async init() {
    try {
      // Initialize based on DEX type
      switch (this.dexType) {
        case DEX_TYPES.UNISWAP_V2:
          this.contract = new ethers.Contract(this.poolAddress, UNISWAP_V2_PAIR_ABI, this.provider);
          break;
        case DEX_TYPES.SUSHISWAP:
          this.contract = new ethers.Contract(this.poolAddress, UNISWAP_V2_PAIR_ABI, this.provider);
          break;
        case DEX_TYPES.PANCKESWAP:
          this.contract = new ethers.Contract(this.poolAddress, UNISWAP_V2_PAIR_ABI, this.provider);
          break;
        // Add other DEX types here as needed
        default:
          throw new Error(`Unsupported DEX type: ${this.dexType}`);
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
      // Get token addresses
      const [token0Address, token1Address] = await Promise.all([
        this.contract.token0(),
        this.contract.token1()
      ]);

      // Use existing token objects if they match, otherwise create new ones
      if (this.tokenA && this.tokenA.address.toLowerCase() === token0Address.toLowerCase()) {
        this.token0 = this.tokenA;
      } else if (this.tokenA && this.tokenA.address.toLowerCase() === token1Address.toLowerCase()) {
        this.token0 = this.tokenA;
      } else {
        this.token0 = await ERC20Token.create(token0Address, this.chain);
      }

      if (this.tokenB && this.tokenB.address.toLowerCase() === token1Address.toLowerCase()) {
        this.token1 = this.tokenB;
      } else if (this.tokenB && this.tokenB.address.toLowerCase() === token0Address.toLowerCase()) {
        this.token1 = this.tokenB;
      } else {
        this.token1 = await ERC20Token.create(token1Address, this.chain);
      }

      // Get reserves
      const reserves = await this.contract.getReserves();
      this.reserve0 = reserves[0];
      this.reserve1 = reserves[1];

      // Get total supply
      this.totalSupply = await this.contract.totalSupply();

    } catch (error) {
      console.error("Error loading pool data:", error);
      throw error;
    }
  }

  async getReserves() {
    try {
      const reserves = await this.contract.getReserves();
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
      console.error("Error fetching reserves:", error);
      throw error;
    }
  }

  async getPrice(tokenIn, tokenOut) {
    try {
      const tokenInAddress = typeof tokenIn === 'string' ? tokenIn : tokenIn.address;
      const tokenOutAddress = typeof tokenOut === 'string' ? tokenOut : tokenOut.address;
      
      const reserves = await this.getReserves();
      
      let reserveIn, reserveOut, tokenInObj, tokenOutObj;
      
      if (tokenInAddress.toLowerCase() === this.token0.address.toLowerCase()) {
        reserveIn = reserves.reserve0;
        reserveOut = reserves.reserve1;
        tokenInObj = this.token0;
        tokenOutObj = this.token1;
      } else if (tokenInAddress.toLowerCase() === this.token1.address.toLowerCase()) {
        reserveIn = reserves.reserve1;
        reserveOut = reserves.reserve0;
        tokenInObj = this.token1;
        tokenOutObj = this.token0;
      } else {
        throw new Error("Token not found in pool");
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
      console.error("Error calculating price:", error);
      throw error;
    }
  }

  async addLiquidity(account, amount0, amount1, options = {}) {
    try {
      const { slippage = SLIPPAGE_TOLERANCE, deadline = Math.floor(Date.now() / 1000) + 300 } = options;

      console.log(`\n💧 Adding liquidity to pool ${this.poolAddress}...`);

      // Approve tokens
      await this.token0.approve(account, this.poolAddress, amount0);
      await this.token1.approve(account, this.poolAddress, amount1);

      const amount0Desired = ethers.parseUnits(amount0, this.token0.decimals);
      const amount1Desired = ethers.parseUnits(amount1, this.token1.decimals);

      // Calculate minimum amounts with slippage tolerance
      const amount0Min = amount0Desired * (1000 - slippage * 10) / 1000;
      const amount1Min = amount1Desired * (1000 - slippage * 10) / 1000;

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
      console.error("Error adding liquidity:", error);
      throw error;
    }
  }

  async removeLiquidity(account, liquidityAmount, options = {}) {
    try {
      const { slippage = SLIPPAGE_TOLERANCE, deadline = Math.floor(Date.now() / 1000) + 300 } = options;

      console.log(`\n🔥 Removing liquidity from pool ${this.poolAddress}...`);

      // Approve LP tokens
      const lpToken = new ERC20Token(this.poolAddress, this.chain);
      await lpToken.init();
      await lpToken.approve(account, this.poolAddress, liquidityAmount);

      const lpDecimals = await this.contract.decimals();
      const liquidity = ethers.parseUnits(liquidityAmount, lpDecimals);

      // Calculate minimum amounts with slippage
      const totalSupply = await this.contract.totalSupply();
      const amount0Min = this.reserve0 * liquidity / totalSupply * (1000 - slippage * 10) / 1000;
      const amount1Min = this.reserve1 * liquidity / totalSupply * (1000 - slippage * 10) / 1000;

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
      console.error("Error removing liquidity:", error);
      throw error;
    }
  }

  async getLiquidityPosition(account) {
    try {
      const lpToken = new ERC20Token(this.poolAddress, this.chain);
      await lpToken.init();
      
      const balance = await lpToken.getBalance(account);
      const lpDecimals = await this.contract.decimals();
      const totalSupplyFormatted = Number(ethers.formatUnits(this.totalSupply, lpDecimals));
      const share = Number(balance.formatted) / totalSupplyFormatted;

      const reserves = await this.getReserves();
      const token0Amount = share * Number(ethers.formatUnits(reserves.reserve0, this.token0.decimals));
      const token1Amount = share * Number(ethers.formatUnits(reserves.reserve1, this.token1.decimals));

      return {
        lpBalance: balance,
        share: share * 100, // percentage
        underlyingValue: {
          [this.token0.symbol]: token0Amount,
          [this.token1.symbol]: token1Amount
        },
        totalValue: token0Amount + token1Amount * (await this.getPrice(this.token1, this.token0)).price
      };
    } catch (error) {
      console.error("Error getting liquidity position:", error);
      throw error;
    }
  }

  async getTVL() {
    try {
      const reserves = await this.getReserves();
      // This is a simplified TVL calculation - in production you'd want to get prices from an oracle
      const token0Value = Number(ethers.formatUnits(reserves.reserve0, this.token0.decimals));
      const token1Value = Number(ethers.formatUnits(reserves.reserve1, this.token1.decimals));
      
      return {
        token0: token0Value,
        token1: token1Value,
        total: token0Value + token1Value // Simplified, assumes 1:1 price ratio
      };
    } catch (error) {
      console.error("Error calculating TVL:", error);
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
    return this.token0.address.toLowerCase() === tokenAddress.toLowerCase() ||
           this.token1.address.toLowerCase() === tokenAddress.toLowerCase();
  }

  getOtherToken(token) {
    const tokenAddress = typeof token === 'string' ? token : token.address;
    
    if (this.token0.address.toLowerCase() === tokenAddress.toLowerCase()) {
      return this.token1;
    } else if (this.token1.address.toLowerCase() === tokenAddress.toLowerCase()) {
      return this.token0;
    } else {
      throw new Error("Token not found in pool");
    }
  }

  static async createFromTokens(tokenA, tokenB, chain, dexType = DEX_TYPES.UNISWAP_V2) {
    try {
      // Validate that both parameters are ERC20Token instances
      if (!(tokenA instanceof ERC20Token) || !(tokenB instanceof ERC20Token)) {
        throw new Error("Both parameters must be ERC20Token instances");
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

      const factory = new ethers.Contract(factoryAddress, UNISWAP_V2_FACTORY_ABI, chain.provider);
      
      // Use the token addresses from the token objects
      const poolAddress = await factory.getPair(tokenA.address, tokenB.address);

      if (poolAddress === ethers.ZeroAddress) {
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
      totalSupply: ethers.formatUnits(this.totalSupply, await this.contract.decimals()),
      tvl: tvl
    };
  }
}

module.exports = Pool;
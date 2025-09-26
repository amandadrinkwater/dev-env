const { ethers, assert } = require("ethers");
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const { ERC20Token } = require("./ERC20Token.cjs");
const contracts = require("../utils/contracts.cjs");
const Pool = require("./Pool.cjs"); // Import the Pool class
const { Chain } = require("./Chain.cjs");


class ContractUniswapQuery {
    // make it singleton 
    constructor(chain) {    
        if (ContractUniswapQuery.instance) {
            return ContractUniswapQuery.instance;
        }

        this.id = 'Contract UniswapQuery';
        this.address = contracts.FlashBotsUniswapQuery.address;
        this.chain = chain; // ethereum
        this.provider = chain.provider;
        this.contract = new ethers.Contract(this.address, contracts.FlashBotsUniswapQuery.ABI, this.provider);
        
        ContractUniswapQuery.instance = this;
    }

    static async getInstance(_ethers) {
        if (!ContractUniswapQuery.instance) {
            const chain = await Chain.create(_ethers);            
            ContractUniswapQuery.instance = new ContractUniswapQuery(chain);
        }
        return ContractUniswapQuery.instance;
    }

    async getActualBlock() {
        try {
            return await this.chain.getLatestBlock().number;
        } catch (error) {
            console.error("Error fetching actual block:", error);
            throw error;
        }
    }

    async getPairsByIndexRange(factoryAddress, startIndex, endIndex) {
        try {
            const pairs = await this.contract.getPairsByIndexRange(factoryAddress, startIndex, endIndex);
            return pairs;
        } catch (error) {
            console.error("Error fetching pairs by index range:", error);
            throw error;
        }
    }

    async getPairAddressesByIndexRange(factoryAddress, startIndex, endIndex) {
        try {
            const pairs = await this.contract.getPairsByIndexRange(factoryAddress, startIndex, endIndex);
            const pairAddresses = pairs.map(p => p[2]);
            return pairAddresses;
        } catch (error) {
            console.error("Error fetching pairs by index range:", error);
            throw error;
        }
    }

    async getReservesByPairs(pairs) {
        const pairAddresses = pairs.map(p => p[2]);
        try {
            const reserves = await this.contract.getReservesByPairs(pairAddresses);
            return reserves;
        } catch (error) {
            console.error("Error fetching reserves by pairs:", error);
            throw error;
        }
    }

    /**
     * ORIGINAL METHOD: Get Pool objects from index range (individual RPC calls)
     * Good for small batches or debugging
     * @param {number} fromIndex - Starting index
     * @param {number} toIndex - Ending index
     * @param {string} factoryAddress - Uniswap factory address (optional)
     * @param {string} dexType - DEX type from Pool.DEX_TYPES
     * @returns {Promise<Array>} Array of Pool objects
     */
    async getPoolsByIndexRange(fromIndex, toIndex, factoryAddress = null, dexType = Pool.DEX_TYPES.UNISWAP_V2) {

        // we may deprecate this method 

        try {
            console.log(`\n🏊 Fetching pools from index ${fromIndex} to ${toIndex} (individual calls)...`);
            
            // Validate inputs
            if (fromIndex < 0 || toIndex < fromIndex) {
                throw new Error(`Invalid index range: fromIndex=${fromIndex}, toIndex=${toIndex}`);
            }

            // Use default factory address if not provided
            const factoryAddr = factoryAddress || addresses.FACTORIES.UNIV2;
            if (!factoryAddr) {
                throw new Error("Factory address not provided and no default found");
            }

            // Get pairs from the query contract
            const pairs = await this.getPairsByIndexRange(factoryAddr, fromIndex, toIndex);
            
            if (!pairs || pairs.length === 0) {
                console.log("⚠️  No pairs found in the specified index range");
                return [];
            }

            console.log(`📊 Found ${pairs.length} pairs, creating Pool objects...`);

            const pools = [];
            let successCount = 0;
            let errorCount = 0;

            // Process each pair and create Pool objects (individual calls)
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i];
                const [token0Address, token1Address, poolAddress] = pair;

                try {
                    // Skip if pool address is zero
                    if (poolAddress === ethers.ZeroAddress) {
                        console.log(`⏭️  Skipping pair ${fromIndex + i} - zero address`);
                        errorCount++;
                        continue;
                    }

                    console.log(`🔧 Creating Pool ${i + 1}/${pairs.length}: ${poolAddress}`);

                    // Create Pool object (this makes individual RPC calls)
                    const pool = await Pool.create(poolAddress, this.chain, dexType);
                    
                    // Verify the pool was initialized correctly
                    if (pool && pool.token0 && pool.token1) {
                        pools.push(pool);
                        successCount++;
                        
                        console.log(`✅ Pool created: ${pool.token0.symbol}/${pool.token1.symbol}`);
                    } else {
                        console.log(`❌ Failed to initialize pool at ${poolAddress}`);
                        errorCount++;
                    }

                } catch (error) {
                    console.error(`❌ Error creating pool for address ${poolAddress}:`, error.message);
                    errorCount++;
                    continue;
                }
            }

            console.log(`\n🎉 Individual call method completed:`);
            console.log(`   ✅ Successful: ${successCount}`);
            console.log(`   ❌ Failed: ${errorCount}`);
            console.log(`   📊 Total: ${pools.length} pools ready`);

            return pools;

        } catch (error) {
            console.error("❌ Error in getPoolsByIndexRange:", error);
            throw error;
        }
    }

    /**
     * OPTIMIZED METHOD: Get pools using batch reserves fetching (MUCH FASTER)
     * Uses getReservesByPairs for bulk operations - O(1) for reserves instead of O(n)
     * @param {number} fromIndex - Starting index
     * @param {number} toIndex - Ending index
     * @param {string} factoryAddress - Factory address
     * @param {string} dexType - DEX type
     * @returns {Promise<Array>} Array of Pool objects
     */
    
    async getPoolsByIndexRangeOptimized(fromIndex, toIndex, factoryAddress = null, dexType = Pool.DEX_TYPES.UNISWAP_V2) {
    try {
        console.log(`\n⚡ OPTIMIZED: Fetching pools from index ${fromIndex} to ${toIndex} (batch reserves)...`);
        
        // Validate inputs
        if (fromIndex < 0 || toIndex < fromIndex) {
            throw new Error(`Invalid index range: fromIndex=${fromIndex}, toIndex=${toIndex}`);
        }

        const factoryAddr = factoryAddress || addresses.FACTORIES.UNIV2;
        
        if (!factoryAddr) {
            throw new Error("Factory address not provided and no default found in addresses.FACTORIES.UNIV2");
        }

        console.log(`🔧 Using factory address: ${factoryAddr}`);
        
        // Step 1: Get pairs data in one call
        const pairs = await this.getPairsByIndexRange(factoryAddr, fromIndex, toIndex);
        
        if (!pairs || pairs.length === 0) {
            console.log("⚠️  No pairs found in the specified index range");
            return [];
        }

        console.log(`📊 Found ${pairs.length} pairs, fetching reserves in batch...`);

        // Step 2: Get reserves for all pairs in one batch call
        const reserves = await this.getReservesByPairs(pairs);
        
        // Step 3: Create token data cache to avoid duplicate RPC calls
        const tokenCache = new Map();
        const poolDataArray = [];

        // Step 4: Prepare pool data for batch creation
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const [token0Address, token1Address, poolAddress] = pair;
            
            if (poolAddress === ethers.ZeroAddress) {
                console.log(`⏭️  Skipping pair ${fromIndex + i} - zero address`);
                continue;
            }

            try {
                // Get token data with caching
                const token0Data = await this._getTokenData(token0Address, tokenCache);
                const token1Data = await this._getTokenData(token1Address, tokenCache);
                
                if (token0Data && token1Data) {
                    poolDataArray.push({
                        poolAddress,
                        token0: token0Data,
                        token1: token1Data,
                        reserves: {
                            reserve0: reserves[i][0],
                            reserve1: reserves[i][1],
                            blockTimestamp: reserves[i][2]
                        }
                    });
                }
            } catch (error) {
                console.error(`❌ Error preparing pool data for ${poolAddress}:`, error.message);
            }
        }

        console.log(`🔄 Creating ${poolDataArray.length} pools in batch...`);
        
        // Step 5: Create all pools in batch
        const pools = await Pool.createBatch(poolDataArray, this.chain, dexType);
        
        console.log(`🎉 Optimized batch creation completed: ${pools.length} pools ready`);
        return pools;

    } catch (error) {
        console.error("❌ Error in optimized pool fetching:", error);
        throw error;
    }
}
    /**
     * Helper method to get token data with caching
     */
    async _getTokenData(tokenAddress, cache) {
        if (cache.has(tokenAddress)) {
            return cache.get(tokenAddress);
        }

        try {
            // Create token instance and initialize to get symbol/decimals
            const token = await ERC20Token.create(tokenAddress, this.chain);
            
            const tokenData = {
                address: tokenAddress,
                symbol: token.symbol,
                decimals: token.decimals,
                name: token.name
            };
            
            cache.set(tokenAddress, tokenData);
            return tokenData;
            
        } catch (error) {
            console.error(`❌ Error fetching token data for ${tokenAddress}:`, error.message);
            return null;
        }
    }

    /**
     * SMART METHOD: Choose the best approach automatically
     * @param {number} fromIndex - Starting index
     * @param {number} toIndex - Ending index
     * @param {Object} options - Configuration options
     * @returns {Promise<Array>} Array of Pool objects
     */
    async getPoolsByIndexRangeSmart(fromIndex, toIndex, options = {}) {
        const {
            factoryAddress = null,
            dexType = Pool.DEX_TYPES.UNISWAP_V2,
            strategy = 'auto', // 'auto', 'individual', 'optimized'
            minForOptimized = 3, // Use optimized for 3+ pools
            skipErrors = true
        } = options;

        const totalPools = toIndex - fromIndex + 1;
        
        // Choose strategy
        let selectedStrategy = strategy;
        if (strategy === 'auto') {
            selectedStrategy = totalPools >= minForOptimized ? 'optimized' : 'individual';
        }

        console.log(`🔧 Smart strategy: ${selectedStrategy} for ${totalPools} pools`);

        try {
            if (selectedStrategy === 'optimized') {
                return await this.getPoolsByIndexRangeOptimized(fromIndex, toIndex, factoryAddress, dexType);
            } else {
                return await this.getPoolsByIndexRange(fromIndex, toIndex, factoryAddress, dexType);
            }
        } catch (error) {
            if (!skipErrors) throw error;
            
            console.error(`❌ Smart strategy failed, falling back to individual calls:`, error.message);
            return await this.getPoolsByIndexRange(fromIndex, toIndex, factoryAddress, dexType);
        }
    }

    /**
     * Enhanced version with additional options and filtering
     */
    async getPoolsByIndexRangeWithOptions(fromIndex, toIndex, options = {}) {
        const {
            factoryAddress = null, // ? how is the default handed...
            dexType = Pool.DEX_TYPES.UNISWAP_V2,
            strategy = 'optimized',
            minLiquidityUSD = 0,
            tokenFilter = null,
            skipErrors = true,
            batchSize = 10
        } = options;

        try {
            console.log(`\n🏊 Fetching pools with options from index ${fromIndex} to ${toIndex}...`);
            
            // First, get pools using selected strategy
            const pools = await this.getPoolsByIndexRangeSmart(fromIndex, toIndex, {
                factoryAddress,
                dexType,
                strategy,
                skipErrors
            });

            // Apply filters if specified
            const filteredPools = await this._filterPools(pools, {
                minLiquidityUSD,
                tokenFilter,
                skipErrors
            });

            console.log(`🎉 Filtering completed: ${filteredPools.length}/${pools.length} pools match criteria`);
            return filteredPools;

        } catch (error) {
            console.error("❌ Error in getPoolsByIndexRangeWithOptions:", error);
            throw error;
        }
    }

    /**
     * Helper method to filter pools based on criteria
     */
    async _filterPools(pools, filters) {
        const { minLiquidityUSD, tokenFilter, skipErrors } = filters;
        const filteredPools = [];

        for (const pool of pools) {
            try {
                let includePool = true;

                // Check liquidity filter
                if (minLiquidityUSD > 0) {
                    const tvl = await pool.getTVL();
                    if (tvl.total < minLiquidityUSD) {
                        includePool = false;
                    }
                }

                // Check token filter
                if (tokenFilter && includePool) {
                    const hasToken = pool.hasToken(tokenFilter);
                    if (!hasToken) {
                        includePool = false;
                    }
                }

                if (includePool) {
                    filteredPools.push(pool);
                }

            } catch (error) {
                console.error(`❌ Error filtering pool ${pool.poolAddress}:`, error.message);
                if (!skipErrors) throw error;
            }
        }

        return filteredPools;
    }

    /**
     * Get pool information summary for a range of indices
     */
    async getPoolsSummaryByIndexRange(fromIndex, toIndex, options = {}) {
        const { strategy = 'optimized' } = options;
        
        try {
            const pools = await this.getPoolsByIndexRangeSmart(fromIndex, toIndex, { strategy });
            
            const summary = {
                totalPools: pools.length,
                pools: [],
                totalTVL: 0,
                tokens: new Set(),
                byDex: {},
                strategyUsed: strategy
            };

            for (const pool of pools) {
                try {
                    const poolInfo = await pool.getPoolInfo();
                    const tvl = await pool.getTVL();
                    
                    summary.pools.push({
                        address: pool.poolAddress,
                        tokens: `${poolInfo.tokens.token0.symbol}/${poolInfo.tokens.token1.symbol}`,
                        tvl: tvl.total,
                        reserves: poolInfo.reserves
                    });

                    summary.totalTVL += tvl.total;
                    summary.tokens.add(poolInfo.tokens.token0.symbol);
                    summary.tokens.add(poolInfo.tokens.token1.symbol);

                    // Group by DEX type
                    if (!summary.byDex[pool.dexType]) {
                        summary.byDex[pool.dexType] = { count: 0, tvl: 0 };
                    }
                    summary.byDex[pool.dexType].count++;
                    summary.byDex[pool.dexType].tvl += tvl.total;

                } catch (error) {
                    console.error(`❌ Error processing pool ${pool.poolAddress}:`, error.message);
                }
            }

            summary.tokens = Array.from(summary.tokens);
            summary.averageTVL = summary.totalPools > 0 ? summary.totalTVL / summary.totalPools : 0;

            return summary;

        } catch (error) {
            console.error("❌ Error in getPoolsSummaryByIndexRange:", error);
            throw error;
        }
    }

    /**
     * Performance comparison between methods
     * we may kill this function when in production
     */
    /**
 * Performance comparison between methods
 * we may kill this function when in production
 */
    async  comparePerformance(fromIndex, toIndex) {
        console.log(`\n📊 PERFORMANCE COMPARISON: indices ${fromIndex} to ${toIndex}`);
        console.log("=".repeat(50));

        // Test individual method
        const individualStart = Date.now();
        const individualPools = await this.getPoolsByIndexRange(fromIndex, toIndex);
        const individualTime = Date.now() - individualStart;

        // Test optimized method
        const optimizedStart = Date.now();
        const optimizedPools = await this.getPoolsByIndexRangeOptimized(fromIndex, toIndex);
        const optimizedTime = Date.now() - optimizedStart;

        const results = {
            individual: {
                time: individualTime,
                pools: individualPools.length
            },
            optimized: {
                time: optimizedTime,
                pools: optimizedPools.length
            },
            improvement: null
        };

        if (results.individual.time && results.optimized.time) {
            results.improvement = {
                absolute: results.individual.time - results.optimized.time,
                percentage: ((results.individual.time - results.optimized.time) / results.individual.time * 100).toFixed(1)
            };
        }

        console.log(`\n🎯 Results:`);
        console.log(`   Individual: ${results.individual.pools} pools in ${results.individual.time}ms`);
        console.log(`   Optimized: ${results.optimized.pools} pools in ${results.optimized.time}ms`);
        
        if (results.improvement) {
            console.log(`   Improvement: ${results.improvement.percentage}% faster`);
        }

        return results;
    }
}

module.exports = { ContractUniswapQuery };

// Enhanced example usage
async function main() {
    const hre = require("hardhat");
    const { ethers } = hre;
    
    // Get singleton instance
    const uniswapQuery = await ContractUniswapQuery.getInstance(ethers);
    
    // Example 1: Compare performance
    console.log("\n1. 📊 PERFORMANCE COMPARISON");
    await uniswapQuery.comparePerformance(0, 2);

    // Example 2: Smart strategy
    console.log("\n2. 🔧 SMART STRATEGY EXAMPLES");
    
    // Small batch - will use individual calls
    const smallPools = await uniswapQuery.getPoolsByIndexRangeSmart(0, 2, { strategy: 'auto' });
    console.log(`Small batch (0-2): ${smallPools.length} pools`);
    
    // Larger batch - will use optimized calls
    const largePools = await uniswapQuery.getPoolsByIndexRangeSmart(0, 9, { strategy: 'auto' });
    console.log(`Large batch (0-9): ${largePools.length} pools`);

    // Example 3: Filtered pools
    console.log("\n3. 🔍 FILTERED POOLS");
    const filteredPools = await uniswapQuery.getPoolsByIndexRangeWithOptions(0, 4, {
        minLiquidityUSD: 1000, // liquitid is just for USD???
        tokenFilter: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" // USDC
    });
    console.log(`Filtered pools: ${filteredPools.length}`);

    // Example 4: Summary information
    console.log("\n4. 📈 SUMMARY INFORMATION");
    const summary = await uniswapQuery.getPoolsSummaryByIndexRange(0, 4);
    console.log("Summary:", {
        totalPools: summary.totalPools,
        totalTVL: `$${summary.totalTVL.toFixed(2)}`,
        uniqueTokens: summary.tokens.length
    });
}

if (require.main === module) {
    main().catch(console.error);
}
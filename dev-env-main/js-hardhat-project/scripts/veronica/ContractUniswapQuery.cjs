const { ethers } = require("ethers");
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const { ERC20Token } = require("./ERC20Token.cjs");
const contracts = require("../utils/contracts.cjs");

class ContractUniswapQuery {
    constructor(chain) {           
        this.address = contracts.FlashBotsUniswapQuery.address;
        this.chain = chain; // ethereum
        this.provider = chain.provider;
        this.contract = new ethers.Contract(this.address, contracts.FlashBotsUniswapQuery.ABI, this.provider);
    }

    async init() {
        return this;
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

    async getReservesByPairs(pairs) {
        try {
           
            const reserves = await this.contract.getReservesByPairs(pairs.map(p => p[2])); 
            // usually p[2] is the actual pair address in [token0, token1, pair]

            return reserves;
        } catch (error) {
            console.error("Error fetching reserves by pairs:", error);
            throw error;
        }
    }

}
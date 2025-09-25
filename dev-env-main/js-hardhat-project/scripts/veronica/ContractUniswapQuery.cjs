const { ethers } = require("ethers");
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const { ERC20Token } = require("./ERC20Token.cjs");
const contracts = require("../utils/contracts.cjs");

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
    }

    async init() {
        return this;
    }

    helloWorld() {
        console.log('I am ' + this.id + ' at ' + this.address);
    }

    static getInstance(chain) {
        if (!ContractUniswapQuery.instance) {
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

    // async getTokensAddressesByPair() 

    async getReservesByPairs(pairs) {

        const pairAddresses = pairs.map(p => p[2]);
        try {
           
            const reserves = await this.contract.getReservesByPairs(pairAddresses); 
            // usually p[2] is the actual pair address in [token0, token1, pair]

            return reserves;
        } catch (error) {
            console.error("Error fetching reserves by pairs:", error);
            throw error;
        }
    }


}

module.exports = { ContractUniswapQuery };

// Example usage
async function main() {
    // Setup provider (using default Hardhat provider here)
 //   const provider = new ethers.JsonRpcProvider("http://    localhost:8545");
    const hre = require("hardhat");
    const { ethers } = hre;
    //const provider = ethers.provider;

    // Create chain instance
    const { Chain } = require("../veronica/Chain.cjs");
    const chain = await Chain.create(ethers);

    // Get singleton instance of ContractUniswapQuery
    const uniswapQuery = ContractUniswapQuery.getInstance(chain);
    uniswapQuery.helloWorld();

    // Fetch actual block
    const actualBlock = await uniswapQuery.getActualBlock();
    console.log("Actual Block:", actualBlock);

    // Fetch pairs by index range
    const factoryAddress = addresses.FACTORIES.UNIV2;
    const pairs = await uniswapQuery.getPairsByIndexRange(factoryAddress, 0, 5);
    console.log("Pairs:", pairs);

    const pairAddresses= await uniswapQuery.getPairAddressesByIndexRange(factoryAddress, 0, 5);
    console.log("Pair Addresses:" + pairAddresses);


    // Fetch reserves by pairs
    const reserves = await uniswapQuery.getReservesByPairs(pairs);
    console.log("Reserves:", reserves);

}

if (require.main === module) {
    main().catch(console.error);
}
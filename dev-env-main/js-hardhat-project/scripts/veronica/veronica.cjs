
const { Account } = require("./Account.cjs");
const { ContractUniswapQuery } = require("./ContractUniswapQuery.cjs");

class Veronica {

    constructor (mainnetFlag = true) { 

      this.whale = null;
      this.abbot = null;
      this.ContractUniswapQuery = null;

      this.mainnetFlag = mainnetFlag

    }

    async initHardhat() {
        this.whale = await Account.createWhaleUSDC();
        this.abbot = await Account.createAbbot();
        this.uniswapQuery = await ContractUniswapQuery.getInstanceAtHardhat();

        return this; // Return instance for chaining
    }

    async initMainnet() {

    }

    async execute() {

      if (!this.whale || !this.abbot) {
        if (!this.mainnetFlag) {
            await this.initHardhat();
        }
        else {
            await this.initMainnet(); // stil need to implement
        }
      }

      // Small batch - will use individual calls
      const smallPools = await this.uniswapQuery.getPoolsByIndexRangeSmart(0, 9, { strategy: 'auto' });
      console.log(`Small batch (0-9): ${smallPools.length} pools`);

      // yus

      process.exit(0) // in the future, we may create a signal exit that shall alert all objects to clear
        
    }
}

const veronica = new Veronica(false) // to run on hardhat

veronica.execute()


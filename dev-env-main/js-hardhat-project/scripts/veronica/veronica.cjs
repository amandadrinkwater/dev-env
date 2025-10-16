
const { Account } = require("./Account.cjs");
const { ContractUniswapQuery } = require("./ContractUniswapQuery.cjs");

class Veronica {

    constructor () { 

      this.whale = null;
      this.abbot = null;
      this.ContractUniswapQuery = null;

    }

    static async getInstanceHardhat () {

      if (!Veronica._instance ) {
        Veronica._instance = new Veronica() // to run on hardhat
        await Veronica._instance.initHardhat()
      }

      return Veronica._instance
    }

    // later we can create a generic get instaca that read from Chain
    // like Account,etc... 

    static async getInstanceMainnet () {

      if (!Veronica._instance ) {
        Veronica._instance = new Veronica() // to run on hardhat
        await Veronica._instance.initMainnet()
      }

      return Veronica._instance
    }

    async initHardhat() {
        this.whale = await Account.createWhaleUSDC();
        this.abbot = await Account.createAbbot();
        this.uniswapQuery = await ContractUniswapQuery.getInstanceAtHardhat();

        return this; // Return instance for chaining
    }

    async initMainnet() {
      // ?? 
    }

    async execute() { 

      
      // Small batch - will use individual calls
      const smallPools = await this.uniswapQuery.getPoolsByIndexRangeSmart(0, 9, { strategy: 'auto' });
      console.log(`Small batch (0-9): ${smallPools.length} pools`);

      const balanceOfAbbot = await this.abbot.getNativeBalance()
      console.log(`Balance of Abbot: ${balanceOfAbbot}`)

      // yus

      process.exit(0) // in the future, we may create a signal exit that shall alert all objects to clear
        
    }
}


// Wrap execution in an async function
async function main() {
    const veronica = await Veronica.getInstanceHardhat();
    await veronica.execute();
}

// Execute and handle errors
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
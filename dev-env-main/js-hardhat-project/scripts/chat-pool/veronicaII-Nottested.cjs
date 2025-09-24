const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
//const {getToken} = require("../utils/dexUtils.cjs");

const USDC = addresses.TOKENS.USDC;
const DAI = addresses.TOKENS.DAI;
const ERC20_ABI = abis.ERC20;

//const whaleUSDC = addresses.WHALES.USDC
//const whaleDAI = addresses.WHALES.DAI

const abbot = addresses.HARDHAT_ACCOUNTS.Abbot.address


// helper function so you can query any ERC20 balance (e.g. whale, your signer)

// app - Chain

class Chain {

    static HARDHAT = 'hardhat'
    static ETHEREUM = 'ethereum'
            DEFAULT = 'default'

    constructor(ethers) {
        this.ethers = ethers
        this.provider = ethers.provider
    }

    async init() {

        this.network = '';
        this.name = this.DEFAULT;
        this.chainType = this.DEFAULT;

    }

    async getGasInfo() {

        const feeData = await this.provider.getFeeData();

        const gasPrice = feeData.gasPrice
        const maxFeePerGas = feeData.maxFeePerGas
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas

        return {
            gasPrice: ethers.formatUnits(gasPrice, "gwei") + " gwei",
            maxFeePerGas: maxFeePerGas ? ethers.formatUnits(maxFeePerGas, "gwei") + " gwei" : undefined,
            maxPriorityFeePerGas: maxPriorityFeePerGas ? ethers.formatUnits(maxPriorityFeePerGas, "gwei") + " gwei" : undefined
        }
    }

    async getLatestBlock() {
        this.block = await this.provider.getBlock("latest");
        this.blockNumber = this.block.number;
        return this.block
    }

    // factory method
    // chainType: hardhat, ethereum, polygon, avalanche, fantom, arbitrum, optimism
    // chainId: 1, 5, 137, 43114, 250, 42161, 10

    // add chainType param to constructor ?? yes

    static async create(ethers, chainType)  {

        let chain = new Chain(ethers)

        switch(chainType) {
            case this.HARDHAT:
                chain = new HardhatChain(ethers)
                break;
            default:
                console.log(`default`);
            }

        await chain.init()

        console.log(`\n=== Connected to ${chain.name} network ===`)

        return chain
    }
}

class HardhatChain extends Chain {

    constructor(ethers) {
        super(ethers)
    }

    async init()  {

        super.init();

        this.network = await this.provider.getNetwork();
        this.chainType = Chain.HARDHAT;
        this.name = this.network.name;
        
        console.log("Connected to network:", this.network.name, "Chain ID:", this.network.chainId);

        await this.getLatestBlock();    
        console.log("Latest Block Number:", this.blockNumber);

        await this.getGasInfo();
        console.log("Gas Info:", {
            gasPrice: ethers.formatUnits(this.gasPrice, "gwei") + " gwei",
            maxFeePerGas: this.maxFeePerGas ? ethers.formatUnits(this.maxFeePerGas, "gwei") + " gwei" : undefined,
            maxPriorityFeePerGas: this.maxPriorityFeePerGas ? ethers.formatUnits(this.maxPriorityFeePerGas, "gwei") + " gwei" : undefined
        });     

    }

}

class Account {
    constructor(address, chain) {
        this.address = address 
        this.ethers = chain.ethers // hardhat only ???, what do when ethers is not from hardhat ??
        //this.ethers = ethers ?? 
        this.provider = this.ethers.provider
        this.signer = null
        // must have private key for production
    }

    async init() {

        this.signer = await this.ethers.getSigner(this.address); // hardhat ??

    }

    async getFuelBalance() {
        // ETH in our case

        const rawBalance = await this.provider.getBalance(this.address);
        const balance = ethers.formatEther(rawBalance);
       
        return balance;
    }

    // trasnfer ETH

    async transferETH(toAddress, amount, options = {}) {
        console.log(`\n💸 Transferring ${amount} ETH from ${this.address} to ${toAddress}...`);
        
        const value = ethers.parseEther(amount.toString());
        const senderBalance = await this.provider.getBalance(this.address);
        
        if (senderBalance < value) {
            throw new Error(`Insufficient ETH balance. Needed: ${ethers.formatEther(value)} ETH, Has: ${ethers.formatEther(senderBalance)} ETH`);
        }
        
        // Get current fee data for EIP-1559 networks
        const feeData = await this.provider.getFeeData();
        
        const txParams = {
            to: toAddress,
            value: value,
            gasLimit: options.gasLimit || await this.signer.estimateGas({ to: toAddress, value: value })
        };
        
        // EIP-1559 fee market parameters (London upgrade)
        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            // Use provided values or fall back to network estimates
            txParams.maxFeePerGas = options.maxFeePerGas || feeData.maxFeePerGas;
            txParams.maxPriorityFeePerGas = options.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas;
        } else {
            // Legacy gas pricing for pre-London networks
            txParams.gasPrice = options.gasPrice || feeData.gasPrice;
        }
        
        console.log(`Transaction parameters:`, {
            value: ethers.formatEther(value),
            gasLimit: txParams.gasLimit.toString(),
            maxFeePerGas: txParams.maxFeePerGas ? ethers.formatUnits(txParams.maxFeePerGas, "gwei") + " gwei" : undefined,
            maxPriorityFeePerGas: txParams.maxPriorityFeePerGas ? ethers.formatUnits(txParams.maxPriorityFeePerGas, "gwei") + " gwei" : undefined,
            gasPrice: txParams.gasPrice ? ethers.formatUnits(txParams.gasPrice, "gwei") + " gwei" : undefined
        });
        
        const tx = await this.signer.sendTransaction(txParams);
        console.log(`Transaction hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`Effective gas price: ${ethers.formatUnits(receipt.gasPrice, "gwei")} gwei`);
        
        return receipt;
    }

    // transfer ERC20



    static async create(chain, address) {

        // remarks watch for pre-defined account in hardhat like Abbot, Baker, Charlie

        let account; // Declare locally instead of using parameter

        switch (chain.chainType) {
            case Chain.HARDHAT:
                account = new AccountAtHardhat(address, chain)
                console.log('Created Hardhat Account')
                break;
            default:
                account = new Account(address, chain) // Create regular account for default
                console.log('Created Default Account')
        }
        
        await account.init()
        
        return account
    }
    
}

class AccountAtHardhat extends Account {

    constructor(accountAddress, chain) {
        super(accountAddress, chain)
        
    }

    async init() {
        await super.init();

        await this.provider.send(
            "hardhat_impersonateAccount",
            [this.address]
        );

        this.signer = await this.ethers.getSigner(this.address);
    }

    async setBalance (amount) {
        await this.provider.send("hardhat_setBalance", [
                this.address,
                ethers.toBeHex(ethers.parseEther(amount)), // 10 ETH
        ]);
    }

    // fund impersonated account with Token from whale impersonate account

}


/**
 * TokenERC20 utility class
 */
class TokenERC20 {
    // check if digits are ok

    constructor(tokenAddress, chain) {
        
        /** @type {ethers.providers.Provider} */
        this.provider = chain.provider;

        /** @type {ethers.Contract} */
        this.contract = new ethers.Contract(tokenAddress, ERC20_ABI, chain.provider);

        /** @type {number|null} */
        this.decimals = 0;

        /** @type {string|null} */
        this.symbol = "";

        /** @type {string|null} */
        this.name = "";
    }

    async init() {
        this.decimals = await this.contract.decimals();
        this.symbol = await this.contract.symbol();
        this.name = await this.contract.name();
        
        console.log("\nToken Address:", await this.contract.getAddress());
        console.log("Token Name:", this.name);
        console.log("Token Symbol:", this.symbol);
        console.log("Token Decimals:", this.decimals);
        
        return this;
    }

    async getTotalSupply() {

        const totalSupply = await this.contract.totalSupply();
        console.log("Token Total Supply:", ethers.formatUnits(totalSupply, this.decimals));
        return totalSupply;

    }

    // ERC20 balance
    async getTokenBalance(account) {

        //const decimals = await this.contract.decimals();
        const rawBalance = await this.contract.balanceOf(account.address);
        const balance = ethers.formatUnits(rawBalance, this.decimals);

        console.log(`💰 Balance of ${await this.contract.symbol()} for ${account.address}:`, balance);
        return balance;
    }

    

   // ERC20 transfer with pre-checks
    async transfer(fromAccount, toAccount, amount) {

        // Do you also want me to add a check before transfer (verify fromAddress has enough balance & ETH for gas) so it fails gracefully instead of reverting on-chain?
        // estimate gas
    const fromSigner = fromAccount.signer; // ✅ Use the account's signer
    
    const tokenHolder = this.contract.connect(fromSigner);
    const tokenHolderBalance = await tokenHolder.balanceOf(fromAccount.address);

    const transferAmount = ethers.parseUnits(amount, this.decimals);
    
    console.log(`\n💸 Transferring ${ethers.formatUnits(transferAmount, this.decimals)} ${this.symbol} from ${fromAccount.address} to ${toAccount.address}...`);
    
    const transferTx = await tokenHolder.transfer(toAccount.address, transferAmount);
    await transferTx.wait();
    }

    // approve(spender, amount)
    // allowance(owner, spender)

    // whale impersonation snippet

    // error messages return structured JSON objects (with fields like reason, needed, have) instead of plain text logs, so you can consume them in a frontend/GUI later?

    static async create(tokenAddress, chain) {
        const token = new TokenERC20(tokenAddress, chain);
        await token.init();
        return token;   
    }

}

// DEX, Router, Factory, Pair, Swap, AddLiquidity, RemoveLiquidity, Farm, Stake, Lend, Borrow, Flashloan


//

async function main() {

    // const provider = await init();

    const chain = await Chain.create(ethers, Chain.HARDHAT);
    console.log('Block Number:', chain.blockNumber);

    // const testingAccount = await Account.create(chain, addresses.WALLETS.MAINNET01.address);
    
    const whaleAccount = await Account.create(chain, addresses.WHALES.USDC);
    const abbot = await Account.create(chain, addresses.HARDHAT_ACCOUNTS.Abbot.address);

    console.log('Address: ', whaleAccount.address)
    console.log('Whale Balance Fuel:', await whaleAccount.getFuelBalance())

    console.log('Signer: ', whaleAccount.signer.address)

    //whaleAccount.setBalance("100.0") // 10 ETH
    //console.log('Whale Balance Fuel:', await whaleAccount.getFuelBalance()) 
    
    const tokenERC20 = await TokenERC20.create(USDC, chain);
    const TokenTotalSupply = await tokenERC20.getTotalSupply();
    console.log('Token Total Supply:', ethers.formatUnits(TokenTotalSupply, tokenERC20.decimals))

    const whaleTokenBalance  = await tokenERC20.getTokenBalance(whaleAccount) ;
    console.log('Whale Token Balance Before:', whaleTokenBalance)
    console.log('Abbot Token Balance Before:', await tokenERC20.getTokenBalance(abbot))

    await tokenERC20.transfer(whaleAccount, abbot, "10.5");

    // Check balances after
    console.log("\n=== AFTER TRANSFER ===");

    console.log("Whale Token Balance After:", await tokenERC20.getTokenBalance(whaleAccount));
    console.log("Abbot Token Balance After:", await tokenERC20.getTokenBalance(abbot)); 
    
}

// utils para ver preco de gasolina, etc que estao nos chats

main().catch(console.error);

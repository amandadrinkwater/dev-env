const  addresses  = require('../utils/addresses.cjs');
const { Chain } = require('./Chain.cjs');
const { ERC20Token } = require('./ERC20Token.cjs')
const  ABIS  = require('../utils/abis.cjs')

const WETH_ABI = ABIS.WETH_ABI

class WETH extends ERC20Token {

    /*

    


    */

    constructor (tokenAddress, chain) {
        super(tokenAddress, chain)

        console.log("Constructor WETH")

        // this.contract = new ethers.Contract(tokenAddress, WETH_ABI, chain.provider);
            

    }



  // Then when you need to wrap:
    async wrapETH(account, amount) {

        console.log(`Account: ${account} Amount: ${amount}`)

        // check if it has funds 

        /*
        const wethWithSigner = this.contract.connect(account.signer);
        const tx = await wethWithSigner.deposit({
            value: ethers.parseEther(amount.toString())
        });
        return await tx.wait(); */
    }

    // create for sepolia and for mainnet

    static async createHardhat() {

        const tokenAddress = addresses.TOKENS.WETH;
        const chain = await Chain.createHardhat()

        const key = `${chain.chainType}:${tokenAddress}`;
    
        if (!ERC20Token.instances.has(key)) {
            const token = await new WETH(tokenAddress, chain);
            await token.init(); 
            console.log("WETH Address:" + token.getAddress())
            ERC20Token.instances.set(key, token);
        }
    
        return ERC20Token.instances.get(key);
    }

    static async createMainnet() {
        //not tested

        const tokenAddress = addresses.TOKENS.WETH;
        const chain = await Chain.createEthereumMainnet()

        const key = `${chain.chainType}:${tokenAddress}`;
    
        if (!ERC20Token.instances.has(key)) {
            const token = await new WETH(tokenAddress, chain);
            await token.init();
            ERC20Token.instances.set(key, token);
        }
    
        return ERC20Token.instances.get(key);
    }

    static async createSepolia() {
        // not tested

        const tokenAddress = addresses.TOKENS.WETH;
        const chain = await Chain.createEthereumSepolia()

        const key = `${chain.chainType}:${tokenAddress}`;
    
        if (!ERC20Token.instances.has(key)) {
            const token = new WETH(tokenAddress, chain);
            await token.init();
            ERC20Token.instances.set(key, token);
        }
    
        return ERC20Token.instances.get(key);
    }
}

class USDC extends ERC20Token {

    constructor (tokenAddress, chain) {
        super(tokenAddress, chain);
    }

    static async createHardhat() {
        const tokenAddress = addresses.TOKENS.USDC; // ✅ FIXED
        const chain = await Chain.createHardhat();

        const key = `${chain.chainType}:${tokenAddress}`;
    
        if (!ERC20Token.instances.has(key)) {
            const token = new USDC(tokenAddress, chain);
            await token.init();
            ERC20Token.instances.set(key, token);
        }
    
        return ERC20Token.instances.get(key);
    }

    static async createMainnet() {
        // not tested
        const tokenAddress = addresses.TOKENS.USDC; 
        const chain = await Chain.createEthereumMainnet();

        const key = `${chain.chainType}:${tokenAddress}`;
    
        if (!ERC20Token.instances.has(key)) {
            const token = new USDC(tokenAddress, chain);
            await token.init();
            ERC20Token.instances.set(key, token);
        }
    
        return ERC20Token.instances.get(key);
    }

    static async createSepolia() {
        // not tested
        const tokenAddress = addresses.TOKENS.USDC; 
        const chain = await Chain.createEthereumSepolia();

        const key = `${chain.chainType}:${tokenAddress}`;
    
        if (!ERC20Token.instances.has(key)) {
            const token = new USDC(tokenAddress, chain);
            await token.init();
            ERC20Token.instances.set(key, token);
        }
    
        return ERC20Token.instances.get(key);
    }
}

module.exports = { WETH, USDC }

const  addresses  = require('../utils/addresses.cjs');
const { Chain } = require('./Chain.cjs');
const {ERC20Token } = require('./ERC20Token.cjs')

class WETH extends ERC20Token {

    constructor (tokenAddress, chain) {
        super(tokenAddress, chain)
    }

    async wrap () {
        
    }

    // create for sepolia and for mainnet

    static async createHardhat() {

        const tokenAddress = addresses.TOKENS.WETH;
        const chain = await Chain.createHardhat()

        const key = `${chain.chainType}:${tokenAddress}`;
    
        if (!ERC20Token.instances.has(key)) {
            const token = new WETH(tokenAddress, chain);
            await token.init();
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
            const token = new WETH(tokenAddress, chain);
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
        // note tested
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
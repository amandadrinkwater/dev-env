module.exports = {
  TOKENS: { // put digits, symbold etc..
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    DAI:  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
  },

  ROUTERS: {
    UNIV2:  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
    SUSHI:  "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // SushiSwap (V2-style)
    UNIV3:  "0xE592427A0AEce92De3Edee1F18E0157C05861564"  // Uniswap V3 SwapRouter
  },

  FACTORIES: {
    UNIV2:  "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    SUSHI:  "0xC0AeE478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
    UNIV3:  "0x1F98431c8aD98523631AE4a59f267346ea31F984"
  },

  QUOTERS: {
    // Uniswap V3 QuoterV2 (recommended)
    UNIV3_QUOTER_V2: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e"
  },

  
  WHALES: {
    
    WETH: "0xBda109309f9FafA6Dd6A9CB9f1Df4085B27Ee8eF",

    USDC: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", 
    
    DAI:  "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503",

    /*
          {
            "47": "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503",
            "5D": "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643" 
          },
    */

    AAVE: ["0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503"],

  },

  HARDHAT_ACCOUNTS: {

    // account is wrong, must be address
    // put nicknames
    Abbot: {
        address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        privKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    }, 
    
    Costello: {
        address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        privKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    }, 

    Spock: {
        address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        privKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
    }, 
  },

  WALLETS: {

    MAINNET01: { 
      address: "0x954447cd671c6181282f12352e1c838944554df8", 
      privKey: "0x13e1bad48b5002f2644d05037300fa22065cc8914698ba801c6dcbe948c66dbc"
    },

    MAINNET02: { 
      address: "0xc2479652659900f6d1d0d55632c92b3bfe1cfb20",
      privKey: "0x73da9e815d7ea74cbb6857bca5b6705d7df02b882009a4d442610db6c96e413a" 
    },

    VITALIK:    "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B", 
    BINANCE7:   "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8", // not verified
    UNISWAPV2:  "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    COINBASE_1: "0x71660c4005ba85c37ccec55d0c4493e66fe775d3",
    COINBASE_2: "0x503828976d22510aad0201ac7ec88293211d23da",
    COINBASE_3: "0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740",
    COINBASE_4: "0x3cd751e6b0078be393132286c442345e5dc49699"
  },

  V3_FEES: { // in hundredths of a bip: 500 = 0.05%, 3000 = 0.30%, 10000 = 1%
    LOW: 500,
    MEDIUM: 3000,
    HIGH: 10000
  }
};

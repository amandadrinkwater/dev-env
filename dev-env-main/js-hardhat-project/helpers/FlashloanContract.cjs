

// FlashloanContract.js
const { ethers } = require("ethers");

const ABI = [
  {
    "inputs":[{"internalType":"contract IUniswapV2Factory","name":"uniswapFactory","type":"address"}],
    "stateMutability":"payable","type":"constructor"
  },
  {"inputs":[],"name":"WETH_address","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"_uniswapFactory","outputs":[{"internalType":"contract IUniswapV2Factory","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {
    "inputs":[
      {"internalType":"address payable","name":"_to","type":"address"},
      {"internalType":"uint256","name":"_value","type":"uint256"},
      {"internalType":"bytes","name":"_data","type":"bytes"}
    ],
    "name":"call","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],
    "stateMutability":"payable","type":"function"
  },
  {
    "inputs":[
      {"internalType":"address","name":"token0","type":"address"},
      {"internalType":"address","name":"token1","type":"address"},
      {"internalType":"uint256","name":"amountToBorrow","type":"uint256"},
      {"internalType":"bytes","name":"_params","type":"bytes"}
    ],
    "name":"flashloan","outputs":[],"stateMutability":"nonpayable","type":"function"
  },
  {
    "inputs":[
      {"internalType":"address","name":"sender","type":"address"},
      {"internalType":"uint256","name":"amount0","type":"uint256"},
      {"internalType":"uint256","name":"amount1","type":"uint256"},
      {"internalType":"bytes","name":"data","type":"bytes"}
    ],
    "name":"uniswapV2Call","outputs":[],"stateMutability":"nonpayable","type":"function"
  },
  {"stateMutability":"payable","type":"receive"}
];

class FlashloanContract {
  constructor(address, signerOrProvider) {
    this.address = address;
    this.contract = new ethers.Contract(address, ABI, signerOrProvider);
  }

  // ============ Read Functions ============
  async getWETHAddress() { return await this.contract.WETH_address(); }
  async getFactoryAddress() { return await this.contract._uniswapFactory(); }

  // ============ Write Functions ============
  async executeFlashloan(token0, token1, amountToBorrow, params = "0x") {
    const tx = await this.contract.flashloan(token0, token1, amountToBorrow, params);
    const receipt = await tx.wait();
    await this.logState("flashloan", { token0, token1, amountToBorrow, txHash: receipt.hash });
    return receipt;
  }

  async lowLevelCall(to, value, data) {
    const tx = await this.contract.call(to, value, data, { value });
    const receipt = await tx.wait();
    await this.logState("lowLevelCall", { to, value, txHash: receipt.hash });
    return receipt;
  }

  // ============ Helper: Encode array of tuples ============
  encodeParamsArray(paramsArray, tupleTypes = ["address", "uint256", "uint256"]) {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder;
    const types = [`tuple(${tupleTypes.join(",")})[]`];
    // Map objects to tuple arrays
    const tuples = paramsArray.map(p => Object.values(p));
    return abiCoder.encode(types, [tuples]);
  }

  // ============ Logging Helper ============
  async logState(action = "N/A", extra = {}) {
    const [weth, factory] = await Promise.all([
      this.getWETHAddress(),
      this.getFactoryAddress()
    ]);

    console.log("========== Contract State ==========");
    console.log(" Contract Address:", this.address);
    console.log(" WETH Address    :", weth);
    console.log(" Factory Address :", factory);
    console.log(" Last Action     :", action);
    if (Object.keys(extra).length > 0) {
      console.log(" Extra Info      :", extra);
    }
    console.log("====================================");
  }

  raw() { return this.contract; }
}

module.exports = FlashloanContract;



require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const forkBlock = process.env.BLOCK_NUMBER ? Number(process.env.BLOCK_NUMBER) : undefined;
const gasPrice = process.env.GAS_PRICE ? Number(process.env.GAS_PRICE) : undefined;

console.log(`➡️ Hardhat will fork from: ${forkBlock ?? "latest block"}`);
console.log(`➡️ Gas price: ${gasPrice ?? "Hardhat default"}`);

module.exports = {
  solidity: { version: "0.8.26", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_URL || "",
        blockNumber: forkBlock
      },
      gasPrice, 
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: process.env.ALCHEMY_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: gasPrice
    }
  }
};

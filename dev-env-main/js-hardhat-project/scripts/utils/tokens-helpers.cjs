// utils/helpers.cjs
const { ethers } = require("hardhat");
const addresses = require("./addresses.cjs");
const abis = require("./abis.cjs");

async function getToken(symbol, signerOrProvider) {
  const addr = addresses.TOKENS[symbol];
  if (!addr) throw new Error(`Unknown token: ${symbol}`);
  const erc20 = new ethers.Contract(addr, abis.ERC20, signerOrProvider);
  const decimals = await erc20.decimals();
  return { contract: erc20, decimals, address: addr };
}

function getRouter(signerOrProvider) {
  return new ethers.Contract(addresses.ROUTERS.UNIV2, abis.UNIV2_ROUTER, signerOrProvider);
}

function getFactory(signerOrProvider) {
  return new ethers.Contract(addresses.FACTORIES.UNIV2, abis.UNIV2_FACTORY, signerOrProvider);
}

module.exports = {
  getToken,
  getRouter,
  getFactory,
};

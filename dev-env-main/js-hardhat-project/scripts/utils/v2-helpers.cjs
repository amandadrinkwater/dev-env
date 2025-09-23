

const { ethers } = require("hardhat");
const abis = require("./abis.cjs");
const addresses = require("./addresses.cjs");

function v2Router(name) {
  const addr = addresses.ROUTERS[name];
  return new ethers.Contract(addr, abis.UNIV2_ROUTER, ethers.provider);
}

function v2RouterWithSigner(name, signer) {
  const addr = addresses.ROUTERS[name];
  return new ethers.Contract(addr, abis.UNIV2_ROUTER, signer);
}

function v2Factory(name) {
  const addr = addresses.FACTORIES[name];
  return new ethers.Contract(addr, abis.UNIV2_FACTORY, ethers.provider);
}

async function v2PairFor(factoryName, tokenA, tokenB) {
  const f = v2Factory(factoryName);
  return await f.getPair(tokenA, tokenB);
}

async function v2Reserves(factoryName, tokenA, tokenB) {
  const pairAddr = await v2PairFor(factoryName, tokenA, tokenB);
  if (pairAddr === ethers.ZeroAddress) return null;
  const pair = new ethers.Contract(pairAddr, abis.UNIV2_PAIR, ethers.provider);
  const [r0, r1] = await pair.getReserves();
  const t0 = await pair.token0();
  const t1 = await pair.token1();
  return { pairAddr, r0, r1, t0, t1 };
}

function priceFromReserves(tokenIn, tokenOut, reserves) {
  const { r0, r1, t0, t1 } = reserves;
  if (tokenIn.toLowerCase() === t0.toLowerCase() && tokenOut.toLowerCase() === t1.toLowerCase()) {
    // price = r1 / r0 (ignoring 0.3% fee)
    return Number(r1) / Number(r0);
  }
  if (tokenIn.toLowerCase() === t1.toLowerCase() && tokenOut.toLowerCase() === t0.toLowerCase()) {
    return Number(r0) / Number(r1);
  }
  throw new Error("Token order mismatch vs pair");
}

module.exports = {
  v2Router, v2RouterWithSigner, v2Factory, v2PairFor, v2Reserves, priceFromReserves
};

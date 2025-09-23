
const hre = require("hardhat");
const { ethers } = hre;
const abis = require("../utils/abis.cjs");
const addresses = require("../utils/addresses.cjs");
const { v2RouterWithSigner } = require("../utils/v2-helpers.cjs");

const TOKENS = [
  addresses.TOKENS.USDC,
  addresses.TOKENS.DAI,
  addresses.TOKENS.USDT,
];

async function quote(router, amountIn, path) {
  try {
    const amounts = await router.getAmountsOut(amountIn, path);
    return amounts[amounts.length - 1];
  } catch {
    return 0n;
  }
}

async function checkPair(signer, base, token, amountIn, dexA, dexB) {
  const rA = v2RouterWithSigner(dexA, signer);
  const rB = v2RouterWithSigner(dexB, signer);

  // base -> token on A
  const outA = await quote(rA, amountIn, [base, token]);
  if (outA === 0n) return null;

  // token -> base on B
  const outB = await quote(rB, outA, [token, base]);
  if (outB === 0n) return null;

  const profit = outB - amountIn; // in base units (e.g., WETH)
  return { token, dexA, dexB, outA, outB, profit };
}

async function main() {
  const [me] = await ethers.getSigners();
  const BASE = addresses.TOKENS.WETH;
  const START = ethers.parseEther("5"); // start size

  console.log("Scanning UniV2 <-> Sushi for cyclical WETH opportunities...");

  while (true) {
    let best = { profit: -1n };
    for (const t of TOKENS) {
      const a = await checkPair(me, BASE, t, START, "UNIV2", "SUSHI");
      const b = await checkPair(me, BASE, t, START, "SUSHI", "UNIV2");
      for (const r of [a, b]) {
        if (r && r.profit > best.profit) best = r;
      }
    }

    if (best.profit > 0n) {
      console.log(`[OPP] ${best.dexA} -> ${best.dexB} via ${best.token} | profit ~ ${ethers.formatEther(best.profit)} WETH`);
      // (optional) trigger execution script here
      // e.g., spawn child process to arbitrage-exec.cjs passing args
    } else {
      console.log("No profitable opp right now.");
    }

    await new Promise(r => setTimeout(r, 5000)); // 5s poll
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


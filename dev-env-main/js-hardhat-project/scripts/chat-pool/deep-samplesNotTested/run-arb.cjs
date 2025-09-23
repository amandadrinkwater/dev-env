// scripts/run-arb-example.cjs
const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");

async function main() {
  const provider = ethers.provider;
  const abbotCfg = addresses.HARDHAT_ACCOUNTS.Abbot;
  const abbot = await ethers.getSigner(abbotCfg.address);

  const USDC = addresses.TOKENS.USDC;
  const DAI = addresses.TOKENS.DAI;
  const USDT = addresses.TOKENS.USDT;

  const ERC20 = abis.ERC20;
  const ROUTER = addresses.ROUTERS.UNIV2;
  const ROUTER_ABI = abis.UNIV2_ROUTER;

  const arbAddress = process.env.ARB_ADDRESS || "0xREPLACE_WITH_DEPLOYED";
  const arb = await ethers.getContractAt("ArbitrageExecutor", arbAddress);

  const router = new ethers.Contract(ROUTER, ROUTER_ABI, provider);

  const usdc = new ethers.Contract(USDC, ERC20, provider);
  const digitsUSDC = await usdc.decimals();

  // fund Abbot
  const whale = addresses.WHALES.USDC;
  await provider.send("hardhat_impersonateAccount", [whale]);
  const whaleSigner = await ethers.getSigner(whale);
  await (await usdc.connect(whaleSigner).transfer(abbot.address, ethers.parseUnits("300", digitsUSDC))).wait();

  // approve contract
  await (await usdc.connect(abbot).approve(arbAddress, ethers.MaxUint256)).wait();

  // two-step paths
  const path1 = [USDC, DAI];
  const path2 = [DAI, USDT];
  const paths = [path1, path2];

  const slippageBps = 50;
  const amountIn = ethers.parseUnits("300", digitsUSDC);

  // compute minOuts
  const amountsOut1 = await router.getAmountsOut(amountIn, path1);
  const out1 = amountsOut1[amountsOut1.length - 1];
  const minOut1 = out1 * BigInt(10000 - slippageBps) / 10000n;

  const amountsOut2 = await router.getAmountsOut(out1, path2);
  const out2 = amountsOut2[amountsOut2.length - 1];
  const minOut2 = out2 * BigInt(10000 - slippageBps) / 10000n;

  const minOuts = [minOut1, minOut2];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  const arbWithAbbot = arb.connect(abbot);
  const tx = await arbWithAbbot.executeChainedSwaps(amountIn, paths, minOuts, deadline, { gasLimit: 2_000_000 });
  const rec = await tx.wait();
  console.log("Arbitrage executed, gasUsed:", rec.gasUsed.toString());
}

main().catch(console.error);

const hre = require("hardhat");
const { ethers } = hre;
const abis = require("../utils/abis.cjs");
const addresses = require("../utils/addresses.cjs");
const { impersonate } = require("../utils/impersonate.cjs");
const { v2RouterWithSigner, v2Reserves, priceFromReserves } = require("../utils/v2-helpers.cjs");

async function logPrices(tag) {
  const resUni = await v2Reserves("UNIV2", addresses.TOKENS.WETH, addresses.TOKENS.USDC);
  if (!resUni) throw new Error("No WETH/USDC pair on UniV2?");
  const pUni = priceFromReserves(addresses.TOKENS.WETH, addresses.TOKENS.USDC, resUni);

  const resSushi = await v2Reserves("SUSHI", addresses.TOKENS.WETH, addresses.TOKENS.USDC);
  const pSushi = resSushi ? priceFromReserves(addresses.TOKENS.WETH, addresses.TOKENS.USDC, resSushi) : NaN;

  console.log(`\n[${tag}] Prices (approx, no fees):`);
  console.log(`UniV2  WETH->USDC: ~${pUni.toFixed(2)} USDC/WETH`);
  if (resSushi) console.log(`Sushi  WETH->USDC: ~${pSushi.toFixed(2)} USDC/WETH`);
}

async function main() {
  console.log("Impersonating WETH whale...");
  const whale = await impersonate(addresses.WHALES.WETH[0], addresses.WALLETS.MAINNET01, "100");

  console.log("Balance of Whale: ");
  const weth = new ethers.Contract(addresses.TOKENS.WETH, abis.ERC20, whale);
  const uniRouter = v2RouterWithSigner("UNIV2", whale);

  await logPrices("before");

  // Approve router to spend whale WETH
  const amountIn = ethers.parseEther("500"); // try 100–2000 depending on how much you want to skew
  await (await weth.approve(uniRouter.target, amountIn)).wait();

  // Big swap WETH -> USDC to push price
  const path = [addresses.TOKENS.WETH, addresses.TOKENS.USDC];
  const deadline = Math.floor(Date.now() / 1000) + 600;

  console.log(`Swapping ${ethers.formatEther(amountIn)} WETH to USDC on UniV2...`);
  await (await uniRouter.swapExactTokensForTokens(
    amountIn,
    0,
    path,
    await whale.getAddress(),
    deadline
  )).wait();

  await logPrices("after");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

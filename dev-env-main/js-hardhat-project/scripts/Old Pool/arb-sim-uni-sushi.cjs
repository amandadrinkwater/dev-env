

const hre = require("hardhat");
const { ethers } = hre;
const abis = require("../utils/abis.cjs");
const addresses = require("../utils/addresses.cjs");
const { v2RouterWithSigner } = require("../utils/v2-helpers.cjs");

const FEE_BPS = 30; // 0.30% per V2 hop

function applyV2Fee(amount) {
  // Uniswap V2 fee model: amount * 997/1000
  return amount * (1 - FEE_BPS / 10000);
}

async function quote(router, amountIn, path) {
  const amounts = await router.getAmountsOut(amountIn, path);
  return amounts[amounts.length - 1];
}

async function runPath(amountInWei, signer, path1, dex1, path2, dex2) {
  const r1 = v2RouterWithSigner(dex1, signer);
  const r2 = v2RouterWithSigner(dex2, signer);

  const out1 = await quote(r1, amountInWei, path1);
  // apply rough fee approximation (already included on-chain in getAmountsOut, but we show logic)
  const out1Adj = out1; // getAmountsOut already factors fees for each hop

  const out2 = await quote(r2, out1Adj, path2);
  const profitWei = out2 - amountInWei;

  return { out1, out2, profitWei };
}

async function main() {
  const [me] = await ethers.getSigners();

  const amountIn = ethers.parseEther("10"); // 10 WETH start
  const WETH = addresses.TOKENS.WETH;
  const USDC = addresses.TOKENS.USDC;

  // Two directions:
  // Path A: UniV2 WETH->USDC, then Sushi USDC->WETH
  const resA = await runPath(
    amountIn, me,
    [WETH, USDC], "UNIV2",
    [USDC, WETH], "SUSHI"
  );

  // Path B: Sushi WETH->USDC, then UniV2 USDC->WETH
  const resB = await runPath(
    amountIn, me,
    [WETH, USDC], "SUSHI",
    [USDC, WETH], "UNIV2"
  );

  const pA = Number(ethers.formatEther(resA.profitWei));
  const pB = Number(ethers.formatEther(resB.profitWei));
  console.log(`Path A (Uni->Sushi) profit: ${pA} WETH`);
  console.log(`Path B (Sushi->Uni) profit: ${pB} WETH`);

  let best = "NONE";
  if (pA > 0 || pB > 0) {
    best = pA > pB ? "A" : "B";
  }
  console.log(`Best path: ${best}`);

  // (Optional) Execute the profitable path on fork
  // NOTE: This actually swaps in your local fork (no real funds), but you still need balances/approvals.
  if (best !== "NONE") {
    // approve WETH on both routers to be safe
    const weth = new ethers.Contract(WETH, abis.ERC20, me);
    await (await weth.approve(addresses.ROUTERS.UNIV2, amountIn)).wait();
    await (await weth.approve(addresses.ROUTERS.SUSHI, amountIn)).wait();

    if (best === "A") {
      // UniV2 WETH->USDC
      const r1 = v2RouterWithSigner("UNIV2", me);
      await (await r1.swapExactTokensForTokens(amountIn, 0, [WETH, USDC], me.address, Math.floor(Date.now()/1000)+600)).wait();

      // Sushi USDC->WETH
      const usdcBal = await (new ethers.Contract(USDC, abis.ERC20, me)).balanceOf(me.address);
      const r2 = v2RouterWithSigner("SUSHI", me);
      await (await r2.swapExactTokensForTokens(usdcBal, 0, [USDC, WETH], me.address, Math.floor(Date.now()/1000)+600)).wait();
    } else {
      // Sushi WETH->USDC
      const r1 = v2RouterWithSigner("SUSHI", me);
      await (await r1.swapExactTokensForTokens(amountIn, 0, [WETH, USDC], me.address, Math.floor(Date.now()/1000)+600)).wait();

      // UniV2 USDC->WETH
      const usdcBal = await (new ethers.Contract(USDC, abis.ERC20, me)).balanceOf(me.address);
      const r2 = v2RouterWithSigner("UNIV2", me);
      await (await r2.swapExactTokensForTokens(usdcBal, 0, [USDC, WETH], me.address, Math.floor(Date.now()/1000)+600)).wait();
    }

    const finalWeth = await (new ethers.Contract(WETH, abis.ERC20, me)).balanceOf(me.address);
    console.log("Final WETH:", ethers.formatEther(finalWeth));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

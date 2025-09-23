// scripts/multihop-swap.js
// Usage: npx hardhat run --network localhost scripts/multihop-swap.js
// Requires: Hardhat mainnet fork, addresses.cjs + abis.cjs in ../utils

/*

Purpose: full multi-hop swap using the Uniswap V2 router 
(example path USDC → DAI → USDT → WETH). Abbot funds are used 
and Abbot receives final token.

*/

const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");

const USDC = addresses.TOKENS.USDC;
const DAI = addresses.TOKENS.DAI;
const USDT = addresses.TOKENS.USDT;
const WETH = addresses.TOKENS.WETH;

const ERC20_ABI = abis.ERC20;
const UNIV2_ROUTER = addresses.ROUTERS.UNIV2;
const UNIV2_ROUTER_ABI = abis.UNIV2_ROUTER;

const sponsorAmount = "200"; // change if you want
const digitsETH = 18;

async function main() {
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  console.log("Network:", network.name, "chainId:", network.chainId);

  // token contracts
  const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);
  const dai = new ethers.Contract(DAI, ERC20_ABI, provider);
  const usdt = new ethers.Contract(USDT, ERC20_ABI, provider);
  const weth = new ethers.Contract(WETH, ERC20_ABI, provider);

  const digitsUSDC = await usdc.decimals();
  const digitsDAI = await dai.decimals();
  const digitsUSDT = await usdt.decimals();
  const digitsWETH = await weth.decimals();

  // Abbot account (Hardhat local account from your addresses)
  const abbot = addresses.HARDHAT_ACCOUNTS.Abbot;
  const abbotSigner = await ethers.getSigner(abbot.address);

  console.log("Abbot:", abbotSigner.address);

  // Impersonate whale to fund Abbot (use addresses.WHALES.USDC)
  const whale = addresses.WHALES.USDC;
  await provider.send("hardhat_impersonateAccount", [whale]);
  const whaleSigner = await ethers.getSigner(whale);

  const usdcWithWhale = usdc.connect(whaleSigner);
  const usdcWithAbbot = usdc.connect(abbotSigner);

  const transferAmount = ethers.parseUnits(sponsorAmount, digitsUSDC);
  console.log(`Transferring ${ethers.formatUnits(transferAmount, digitsUSDC)} USDC from whale -> Abbot`);
  const t = await usdcWithWhale.transfer(abbotSigner.address, transferAmount);
  await t.wait();

  // Approve router by Abbot for the amount we want to swap
  const router = new ethers.Contract(UNIV2_ROUTER, UNIV2_ROUTER_ABI, provider);
  const routerWithAbbot = router.connect(abbotSigner);

  console.log("Approving router to spend Abbot's USDC...");
  const approveTx = await usdcWithAbbot.approve(UNIV2_ROUTER, transferAmount);
  await approveTx.wait();
  console.log("Approved.");

  // Multi-hop path
  const path = [USDC, DAI, USDT, WETH];
  const amountIn = ethers.parseUnits("200", digitsUSDC); // swap 200 USDC
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  console.log("Querying amountsOut for path:", path);
  const amountsOut = await router.getAmountsOut(amountIn, path);

  const finalOut = amountsOut[amountsOut.length - 1];
  // set slippage tolerance (e.g., 1% = 99/100)
  const minOut = (finalOut * 99n) / 100n;

  console.log("Amount in:", ethers.formatUnits(amountIn, digitsUSDC), "USDC");
  console.log("Expected final out:", ethers.formatUnits(finalOut, digitsWETH), "WETH");
  console.log("Minimum out (1% slippage):", ethers.formatUnits(minOut, digitsWETH), "WETH");

  try {
    const swap = await routerWithAbbot.swapExactTokensForTokens(
      amountIn,
      minOut,
      path,
      abbotSigner.address, // Abbot receives final token
      deadline
    );
    console.log("Swap tx sent:", swap.hash);
    const receipt = await swap.wait();
    console.log("Swap confirmed, gasUsed:", receipt.gasUsed.toString());

    const wethBal = await weth.balanceOf(abbotSigner.address);
    console.log("Abbot WETH balance:", ethers.formatUnits(wethBal, digitsWETH));
  } catch (err) {
    console.error("Swap failed:", err.message);
  }
}

main().catch(console.error);

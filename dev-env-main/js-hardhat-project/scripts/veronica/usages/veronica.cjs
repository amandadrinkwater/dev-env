const hre = require("hardhat");
const { ethers } = hre;

const addresses = require("../../utils/addresses.cjs");
const abis = require("../../utils/abis.cjs");

const USDC = addresses.TOKENS.USDC;
const DAI = addresses.TOKENS.DAI;
const ERC20_ABI = abis.ERC20;

const UNISWAP_V2_ROUTER = addresses.ROUTERS.UNIV2;
const UNISWAP_ROUTER_ABI = abis.UNIV2_ROUTER;
const UNISWAP_V2_FACTORY = addresses.FACTORIES.UNIV2;
const UNISWAP_FACTORY_ABI = abis.UNIV2_FACTORY;
const UNISWAP_PAIR_ABI = abis.UNIV2_PAIR;

const digitsETH = 18;
const sponsorAmount = "1000";

async function main() {
  console.log("\n🐋 Starting Yus with Moby Dick ...");

  const provider = ethers.provider;
  const network = await provider.getNetwork();
  console.log("Connected to network:", network.name, "Chain ID:", network.chainId);

  // === USDC contract ===
  const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);

  const nameUSDC = await usdc.name();
  const symbolUSDC = await usdc.symbol();
  const digitsUSDC = await usdc.decimals();
  const totalSupplyUSDC = await usdc.totalSupply();

  console.log("\nUSDC Address: ", await usdc.getAddress());
  console.log("USDC Name:", nameUSDC);
  console.log("USDC Symbol:", symbolUSDC);
  console.log("USDC Digits:", digitsUSDC);
  console.log("USDC Total Supply:", ethers.formatUnits(totalSupplyUSDC, digitsUSDC));

  // === DAI contract ===
  const dai = new ethers.Contract(DAI, ERC20_ABI, provider);

  const nameDai = await dai.name();
  const symbolDai = await dai.symbol();
  const digitsDai = await dai.decimals();
  const totalSupplyDai = await dai.totalSupply();

  console.log("\nDAI Address: ", await dai.getAddress());
  console.log("DAI Name:", nameDai);
  console.log("DAI Symbol:", symbolDai);
  console.log("DAI Digits:", digitsDai);
  console.log("DAI Total Supply:", ethers.formatUnits(totalSupplyDai, digitsDai));

  // === Abbot account ===
  const abbot = addresses.HARDHAT_ACCOUNTS.Abbot;
  const abbotSigner = await ethers.getSigner(abbot.address);
  const usdcWithAbbot = usdc.connect(abbotSigner);

  console.log("\nAbbot Address: " + abbotSigner.address);

  const abbotETHBalanceBefore = await provider.getBalance(abbotSigner.address);
  console.log("Abbot ETH Balance Before:", ethers.formatUnits(abbotETHBalanceBefore, digitsETH));

  const abbotUSDCBalanceBefore = await usdcWithAbbot.balanceOf(abbotSigner.address);
  console.log("Abbot USDC balance:", ethers.formatUnits(abbotUSDCBalanceBefore, digitsUSDC));

  console.log("\nIMPORTANT: In this simulation, Abbot has ETH funded by Hardhat.\n");

  // === Whale sponsor ===
  const whaleSponsorAddress = addresses.WHALES.USDC;

  await provider.send("hardhat_impersonateAccount", [whaleSponsorAddress]);
  const whaleSigner = await ethers.getSigner(whaleSponsorAddress);
  const usdcWithWhale = usdc.connect(whaleSigner);

  console.log("Whale Address:", whaleSigner.address);

  const whaleETHBalanceBefore = await provider.getBalance(whaleSigner.address);
  console.log("Whale ETH Balance Before:", ethers.formatUnits(whaleETHBalanceBefore, digitsETH));

  const whaleUSDCBalanceBefore = await usdcWithWhale.balanceOf(whaleSigner.address);
  console.log("Whale USDC balance:", ethers.formatUnits(whaleUSDCBalanceBefore, digitsUSDC));

  // === Sponsor transfer ===
  const transferAmount = ethers.parseUnits(sponsorAmount, digitsUSDC);

  console.log(`\n💸 Transferring ${ethers.formatUnits(transferAmount, digitsUSDC)} USDC from whale to Abbot...`);
  const sponsorTx = await usdcWithWhale.transfer(abbotSigner.address, transferAmount);
  await sponsorTx.wait();
  console.log("✅ Transfer To Abbot completed");

  console.log("\n💰 Balances after transfer:");
  console.log("Whale USDC:", ethers.formatUnits(await usdc.balanceOf(whaleSigner.address), digitsUSDC));
  console.log("Abbot USDC:", ethers.formatUnits(await usdc.balanceOf(abbotSigner.address), digitsUSDC));

  // === Setup Uniswap Router ===
  const router = new ethers.Contract(UNISWAP_V2_ROUTER, UNISWAP_ROUTER_ABI, provider);
  const routerWithAbbot = router.connect(abbotSigner);

  // ✅ Approve with Abbot (fix)
  console.log("\n✅ Approving USDC for Uniswap Router...");
  const approveAmount = ethers.parseUnits(sponsorAmount, digitsUSDC);
  const approveTx = await usdcWithAbbot.approve(UNISWAP_V2_ROUTER, approveAmount);
  await approveTx.wait();
  console.log("USDC approval confirmed by Abbot");

  // === Get Pool Info ===
  const factory = new ethers.Contract(UNISWAP_V2_FACTORY, UNISWAP_FACTORY_ABI, provider);
  const pairAddress = await factory.getPair(USDC, DAI);

  if (pairAddress === ethers.ZeroAddress) {
    console.log("❌ No liquidity pool exists for USDC-DAI pair");
    process.exit(1);
  } else {
    console.log("\n🏊 DAI-USDC Pool address:", pairAddress);
  }

  const pair = new ethers.Contract(pairAddress, UNISWAP_PAIR_ABI, provider);

  const token0 = await pair.token0();
  const token1 = await pair.token1();
  console.log("Token 0:", token0);
  console.log("Token 1:", token1);

  const reserves = await pair.getReserves();
  let reserveUSDC, reserveDAI;

  if (token0 === USDC) {
    reserveUSDC = reserves.reserve0;
    reserveDAI = reserves.reserve1;
  } else {
    reserveUSDC = reserves.reserve1;
    reserveDAI = reserves.reserve0;
  }

  console.log("\n💧 Pool Liquidity:");
  console.log("USDC Reserve:", ethers.formatUnits(reserveUSDC, digitsUSDC));
  console.log("DAI Reserve:", ethers.formatUnits(reserveDAI, digitsDai));

  const totalLPSupply = await pair.totalSupply();
  console.log("\nTotal LP Token Supply:", ethers.formatUnits(totalLPSupply, 18));

  // === Price Info ===
  const usdcValue = Number(ethers.formatUnits(reserveUSDC, digitsUSDC));
  const daiValue = Number(ethers.formatUnits(reserveDAI, digitsDai));
  const totalValue = usdcValue + daiValue;
  const ratio = usdcValue > 0 ? daiValue / usdcValue : 0;

  console.log("\nTotal Pool Value (approx):", totalValue.toFixed(2), "USD");
  console.log("DAI/USDC Ratio:", ratio.toFixed(4));

  // === Swap ===
  console.log("\n📊 Setting up swap parameters...");
  const amountIn = ethers.parseUnits("100", digitsUSDC);
  const path = [USDC, DAI];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  console.log("🔍 Calculating expected output...");
  const amountsOut = await router.getAmountsOut(amountIn, path);
  const amountOutMin = (amountsOut[1] * 95n) / 100n;

  console.log("Amount in:", ethers.formatUnits(amountIn, digitsUSDC), "USDC");
  console.log("Expected amount out:", ethers.formatUnits(amountsOut[1], digitsDai), "DAI");
  console.log("Minimum amount out (5% slippage):", ethers.formatUnits(amountOutMin, digitsDai), "DAI");

  console.log("\n🔄 Executing swap on Uniswap V2...");
  try {
    const swapTx = await routerWithAbbot.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      abbotSigner.address,
      deadline
    );

    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await swapTx.wait();
    console.log("✅ Swap executed successfully!");
    console.log("Transaction hash:", receipt.hash);
    console.log("Gas used:", receipt.gasUsed.toString());
  } catch (error) {
    console.error("❌ Swap failed:", error.message);
    if (error.message.includes("INSUFFICIENT_OUTPUT_AMOUNT") || error.message.includes("slippage")) {
      console.log("💡 Try increasing slippage tolerance or using a smaller amount");
    }
  }
}

main().catch(console.error);

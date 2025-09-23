

const { ethers } = require('ethers');
const addresses = require("../utils/addresses.cjs");

// Mainnet addresses
const UNISWAP_V2_ROUTER = addresses.ROUTERS.UNIV2;
const UNISWAP_V2_FACTORY = addresses.FACTORIES.UNIV2;

// Token addresses
const WETH = addresses.TOKENS.WETH;
const USDC = addresses.TOKENS.USDC;

// Use one of Hardhat's built-in accounts as our whale
// Hardhat account #19 (index 18) - we'll use this as our USDC whale
const HARDHAT_WHALE = addresses.WHALES_HARDHAT[1].account;
const HARDHAT_WHALE_PRIVATE_KEY = addresses.WHALES_HARDHAT[1].privKey;

// Your deployer private key (using another Hardhat account)
const DEPLOYER_PRIVATE_KEY = process.env.RECEIVER_PRIVATE_KEY || addresses.WHALES_HARDHAT[0].privKey; // Account #0

// ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) returns (bool)" // Added mint function for testing
];

// Uniswap Router ABI
const UNISWAP_ROUTER_ABI = [
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
  "function factory() view returns (address)"
];

// Uniswap Factory ABI
const UNISWAP_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address pair)"
];

async function main() {
  console.log("🐋 Starting Uniswap V2 pool manipulation with Moby Dick (Hardhat whale)...");
  
  // Create provider connected to local Hardhat node
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  
  // Create whale wallet using Hardhat's built-in account
  const whale = new ethers.Wallet(HARDHAT_WHALE_PRIVATE_KEY, provider);
  
  // Create deployer wallet (another Hardhat account)
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

  console.log("🐋 Moby Dick (Whale):", whale.address);
  console.log("👨‍💼 Deployer:", deployer.address);

  // Get token contracts using ABI
  const weth = new ethers.Contract(WETH, ERC20_ABI, deployer);
  const usdc = new ethers.Contract(USDC, ERC20_ABI, deployer);
  
  // Connect whale to token contracts
  const usdcWithWhale = usdc.connect(whale);

  // Check initial balances
  console.log("\n💰 Initial balances:");
  console.log("Deployer ETH:", ethers.formatEther(await provider.getBalance(deployer.address)));
  console.log("Whale ETH:", ethers.formatEther(await provider.getBalance(whale.address)));
  console.log("Deployer WETH:", ethers.formatUnits(await weth.balanceOf(deployer.address), 18));
  console.log("Deployer USDC:", ethers.formatUnits(await usdc.balanceOf(deployer.address), 6));
  console.log("Whale USDC:", ethers.formatUnits(await usdc.balanceOf(whale.address), 6));

  // Mint USDC to whale (since we're on a fork, we can manipulate tokens)
  console.log("\n🪙 Minting USDC to whale...");
  try {
    // Try to mint USDC - this might work on some forked tokens
    const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    const mintTx = await usdcWithWhale.mint(whale.address, mintAmount);
    await mintTx.wait();
    console.log("✅ Minted 1,000,000 USDC to whale");
  } catch (error) {
    console.log("❌ Mint failed (token might not have mint function), using alternative approach...");
    
    // Alternative: Use Hardhat to set token balance
    await provider.send("hardhat_setBalance", [
      whale.address,
      "0x1000000000000000000000", // Ensure whale has ETH for gas
    ]);
    
    // If mint fails, we'll just work with whatever balance the whale has
    console.log("Using existing whale USDC balance:", ethers.formatUnits(await usdc.balanceOf(whale.address), 6));
  }

  // Transfer USDC from whale to deployer
  const transferAmount = ethers.parseUnits("50000", 6); // 50,000 USDC
  
  console.log(`\n💸 Transferring ${ethers.formatUnits(transferAmount, 6)} USDC from whale to deployer...`);
  
  const transferTx = await usdcWithWhale.transfer(deployer.address, transferAmount);
  await transferTx.wait();
  
  console.log("✅ Transfer completed");

  // Check balances after transfer
  console.log("\n💰 Balances after transfer:");
  console.log("Deployer USDC:", ethers.formatUnits(await usdc.balanceOf(deployer.address), 6));
  console.log("Whale USDC:", ethers.formatUnits(await usdc.balanceOf(whale.address), 6));

  // Get Uniswap Router using ABI
  const router = new ethers.Contract(UNISWAP_V2_ROUTER, UNISWAP_ROUTER_ABI, deployer);
  const factory = new ethers.Contract(UNISWAP_V2_FACTORY, UNISWAP_FACTORY_ABI, deployer);

  // The pool already exists on mainnet and is available on your fork
  const pairAddress = await factory.getPair(WETH, USDC);
  console.log("\n🏊 WETH-USDC Pool address:", pairAddress);

  // Let's check the current pool price first
  console.log("\n=== Current pool state ===");
  await checkPoolPrice(router, weth, usdc);

  // Now manipulate the price with a large swap
  console.log("\n=== 🎯 Manipulating price ===");
  const swapAmount = ethers.parseUnits("25000", 6); // 25,000 USDC swap
  
  // Execute the swap
  await executeSwap(router, usdc, weth, deployer, swapAmount, provider);

  console.log("\n=== Price after manipulation ===");
  await checkPoolPrice(router, weth, usdc);

  console.log("\n✅ Pool manipulation completed!");
}

// Simplified swap execution without complex access lists
async function executeSwap(router, tokenIn, tokenOut, signer, amountIn, provider) {
  const path = [tokenIn.address, tokenOut.address];
  
  // Check price before swap
  const amountsOutBefore = await router.getAmountsOut(amountIn, path);
  console.log(`📊 Before: ${ethers.formatUnits(amountIn, 6)} USDC -> ${ethers.formatUnits(amountsOutBefore[1], 18)} WETH`);

  // Approve token spending first
  console.log("⏳ Approving token spending...");
  const approveTx = await tokenIn.connect(signer).approve(router.target, amountIn);
  await approveTx.wait();
  console.log("✅ Approval confirmed");

  // Get minimum amount out with 5% slippage
  const amountOutMin = amountsOutBefore[1] * 95n / 100n;
  const deadline = Math.floor(Date.now() / 1000) + 300;

  console.log("🔄 Executing swap...");
  const swapTx = await router.connect(signer).swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    signer.address,
    deadline
  );
  
  const receipt = await swapTx.wait();
  console.log("✅ Swap completed");
  console.log("📝 Transaction hash:", receipt.hash);
  console.log("⛽ Gas used:", receipt.gasUsed.toString());

  // Check price after swap
  const amountsOutAfter = await router.getAmountsOut(amountIn, path);
  console.log(`📊 After: ${ethers.formatUnits(amountIn, 6)} USDC -> ${ethers.formatUnits(amountsOutAfter[1], 18)} WETH`);

  const priceImpact = (Number(amountsOutBefore[1] - amountsOutAfter[1]) / Number(amountsOutBefore[1])) * 100;
  console.log(`📉 Price impact: ${priceImpact.toFixed(2)}%`);
}

async function checkPoolPrice(router, tokenA, tokenB) {
  const path1 = [tokenA.address, tokenB.address];
  const path2 = [tokenB.address, tokenA.address];

  const amountIn = ethers.parseUnits("1", 18);
  
  try {
    const amountsOut1 = await router.getAmountsOut(amountIn, path1);
    console.log(`1 WETH = ${ethers.formatUnits(amountsOut1[1], 6)} USDC`);
  } catch (error) {
    console.log("❌ Could not get WETH->USDC price:", error.message);
  }

  const usdcAmountIn = ethers.parseUnits("1000", 6);
  try {
    const amountsOut2 = await router.getAmountsOut(usdcAmountIn, path2);
    console.log(`1000 USDC = ${ethers.formatUnits(amountsOut2[1], 18)} WETH`);
  } catch (error) {
    console.log("❌ Could not get USDC->WETH price:", error.message);
  }
}

main().catch(console.error);
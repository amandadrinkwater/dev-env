
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");


const { ethers } = require('hardhat');


/*
    // Alternative: Use Hardhat to set token balance
    await provider.send("hardhat_setBalance", [
      sender.address,
      "0x1000000000000000000000", // Ensure whale has ETH for gas
    ]);
    */
    

// comment this when using hardhat, to use with RPC node

/* const { ethers } = require('ethers'); 

const senderAddress = addresses.HARDHAT_ACCOUNTS[0].account;
const senderPrivKey = addresses.HARDHAT_ACCOUNTS[0].privKey;

const receiverAddress = addresses.HARDHAT_ACCOUNTS[1].account;
const receiverPrivKey = addresses.HARDHAT_ACCOUNTS[1].privKey;

// Create sender wallet 
const sender = new ethers.Wallet(senderPrivKey, provider); // no

  // Create receiver wallet 
const receiver = new ethers.Wallet(receiverPrivKey, provider);

*/

// Mainnet addresses
const UNISWAP_V2_ROUTER = addresses.ROUTERS.UNIV2;
const UNISWAP_V2_FACTORY = addresses.FACTORIES.UNIV2;

// Token addresses
const USDC = addresses.TOKENS.USDC;
const DAI = addresses.TOKENS.DAI;


const ERC20_ABI = [

  // Basic Functions
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) returns (bool)", // Added mint function for testing
  'function name() view returns (string)',
    'function symbol() view returns (string)',
    "function decimals() view returns (uint8)",
    'function totalSupply() view returns (uint256)',
  
  // Balance and transfers
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"

];

/*
const WETH_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)'
  ]; */

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

const UNISWAP_PAIR_ABI = [
      "function token0() external view returns (address)",
      "function token1() external view returns (address)",
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
      "function totalSupply() external view returns (uint256)",
      "function balanceOf(address) external view returns (uint256)"
    ];

async function main() {

  console.log("🐋 Starting Uniswap V2 pool manipulation with Moby Dick (Hardhat whale)...");
  
  // Create provider connected to local Hardhat node
  // const provider = new ethers.JsonRpcProvider('http://localhost:8545');

  const provider = ethers.provider;

  const network = await provider.getNetwork();
  console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
  
  const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);
  
  const nameUsdc = await usdc.name();
  const symbolUsdc = await usdc.symbol();
  const digitsUsdc = await usdc.decimals();
  const totalSupplyUsdc = await usdc.totalSupply();
  
  console.log('USDC Address: ', await usdc.getAddress());
  console.log('USDC Name:', nameUsdc);
  console.log('USDC Symbol:', symbolUsdc);
  console.log('USDC Digits: ', digitsUsdc)
  console.log('USDC Total Supply:', ethers.formatEther(totalSupplyUsdc));
    
  const dai = new ethers.Contract(DAI, ERC20_ABI, provider);

  const nameDai = await dai.name();
  const symbolDai = await dai.symbol();
  const digitsDai = await dai.decimals();
  const totalSupplyDai = await dai.totalSupply();
  
  console.log('DAI Address: ', await dai.getAddress());
  console.log('DAI Name:', nameDai);
  console.log('DAI Symbol:', symbolDai);
  console.log('DAI Digits', digitsDai);
  console.log('DAI Total Supply:', ethers.formatEther(totalSupplyDai));


  // Sender impersonating whale
const senderAddress = addresses.WHALES.USDC;

console.log('Sender Address:', senderAddress); 

    // Impersonate whale

    await provider.send(
      "hardhat_impersonateAccount",
      [senderAddress]
    );

const senderSigner = await ethers.getSigner(senderAddress);

console.log('Whale Address: ' + (senderSigner).address);

//const senderSignerWithProvider = senderSigner.connect(provider);

console.log("🐋 Moby Dick (Whale) - Sender:",  (senderSigner).address);
  

  // Get token contracts using ABI
  // const weth = new ethers.Contract(WETH, ERC20_ABI, provider);
  // const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);

  

  //const token = await ethers.getContractAt(ERC20_ABI, tokenAddress);

  
  // Connect whale to read/ Write token contracts
  const usdcWithWhale = usdc.connect(senderSigner);
  const daiWithWhale = dai.connect(senderSigner);

  

  // Check initial balances
  console.log("\n💰 Initial balances:");

  const whaleUsdcBalance = await usdcWithWhale.balanceOf(senderAddress);
  console.log('Whale USDC balance:', ethers.formatUnits(whaleUsdcBalance, 6)); // USDC has 6 decimals
  const whaleDaiBalance = await daiWithWhale.balanceOf(senderAddress);
  console.log('Whale Dai balance:', ethers.formatUnits(whaleDaiBalance, 18)); // USDC has 6 decimals

/// receiver

const receiverAddress = addresses.HARDHAT_ACCOUNTS.Costello.address;
console.log("👨‍💼 Receiver:", receiverAddress);

// Connect whale to token contracts

/*

option 1
const receiverWallet = new ethers.Wallet(receiverPrivKey, provider);

// Then connect the contract to the wallet
const usdcWithReceiver = usdc.connect(receiverWallet);

option 2 
impersonate using Hardhat

*/

const receiverSigner = await ethers.getSigner(receiverAddress);

// Then connect the contract to the signer
const usdcWithReceiver = usdc.connect(receiverSigner);
const receiverUsdcBalance = await usdcWithReceiver.balanceOf(receiverAddress);
console.log('Receiver USDC balance:', ethers.formatUnits(receiverUsdcBalance, 6)); // USDC has 6 decimals
  
const daiWithReceiver = dai.connect(receiverSigner);
const receiverDaiBalance = await daiWithReceiver.balanceOf(receiverAddress);
console.log('Receiver USDC balance:', ethers.formatUnits(receiverDaiBalance, 6)); // USDC has 6 decimals
  

// Example: Transfer some USDC
// await usdcWithWhale.transfer(receiverAddress, amount);

  // Mint USDC to whale (since we're on a fork, we can manipulate tokens)
  /*console.log("\n🪙 Minting USDC to sender...");
  try {
    // Try to mint USDC - this might work on some forked tokens
    const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
    const mintTx = await usdcReadWithWhale.mint(sender.address, mintAmount);
    await mintTx.wait();
    console.log("✅ Minted 1,000,000 USDC to whale");
  } catch (error) {
    console.log("❌ Mint failed (token might not have mint function), using alternative approach...");
    
    
    // If mint fails, we'll just work with whatever balance the whale has
    console.log("Using existing sender USDC balance:", ethers.formatUnits(await usdc.balanceOf(sender.address), 6));
  }*/


  // Transfer USDC from whale to deployer
  const transferAmount = ethers.parseUnits("500", 6); // 500 USDC
  
  console.log(`\n💸 Transferring ${ethers.formatUnits(transferAmount, 6)} USDC from whale to deployer...`);
  
  const transferTx = await usdcWithWhale.transfer(receiverAddress, transferAmount);
  await transferTx.wait();
  
  console.log("✅ Transfer completed");

  // Check balances after transfer
  console.log("\n💰 Balances after transfer:");
  console.log("Sender USDC:", ethers.formatUnits(await usdc.balanceOf(senderAddress), 6));
  console.log("Receiver USDC:", ethers.formatUnits(await usdc.balanceOf(receiverAddress), 6));

  // Get Uniswap Router using ABI
  const router = new ethers.Contract(UNISWAP_V2_ROUTER, UNISWAP_ROUTER_ABI, provider);
  const routerWithWhale = router.connect(senderSigner);

  // Approve USDC spending first
  console.log('\n✅ Approving USDC for Uniswap Router...');
  const approveAmount = ethers.parseUnits("800", digitsUsdc); // Approve 800 USDC
  const approveTx = await usdcWithWhale.approve(UNISWAP_V2_ROUTER, approveAmount);
  await approveTx.wait();
  console.log('USDC approval confirmed');
  
  const factory = new ethers.Contract(UNISWAP_V2_FACTORY, UNISWAP_FACTORY_ABI, provider);
  
  // The pool already exists on mainnet and is available on your fork
  const pairAddress = await factory.getPair(USDC, DAI);
  

  if (pairAddress === ethers.ZeroAddress) {
    console.log('❌ No liquidity pool exists for USDC-DAI pair');
    // send error...
  } else {
    console.log("\n🏊 WETH-USDC Pool address:", pairAddress);
  }

  /*
  // Let's check the current pool price first
  console.log("\n=== Current pool state ===");
  await checkPoolPrice(router, usdc, usdc);

  // Now manipulate the price with a large swap
  console.log("\n=== 🎯 Manipulating price ===");
  const swapAmount = ethers.parseUnits("25000", 6); // 25,000 USDC swap
  
  // Execute the swap
  await executeSwap(router, usdc, usdc, receiver, swapAmount, provider);

  console.log("\n=== Price after manipulation ===");
  await checkPoolPrice(router, usdc, usdc);

  console.log("\n✅ Pool manipulation completed!");

  */

   const pair = new ethers.Contract(pairAddress, UNISWAP_PAIR_ABI, provider);
    
   // Get token addresses in the pair
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    console.log('Token 0:', token0);
    console.log('Token 1:', token1);

    // Get reserves
    const reserves = await pair.getReserves();
    let reserveUSDC, reserveDAI;
    
    if (token0 === USDC) {
      reserveUSDC = reserves.reserve0;
      reserveDAI = reserves.reserve1;
    } else {
      reserveUSDC = reserves.reserve1;
      reserveDAI = reserves.reserve0;
    }

    console.log('\n💧 Pool Liquidity:');
    console.log('USDC Reserve:', ethers.formatUnits(reserveUSDC, digitsUsdc));
    console.log('DAI Reserve:', ethers.formatUnits(reserveDAI, digitsDai));

     // Calculate pool value and ratio
    const usdcValue = Number(ethers.formatUnits(reserveUSDC, digitsUsdc));
    const daiValue = Number(ethers.formatUnits(reserveDAI, digitsDai));
    const totalValue = usdcValue + daiValue; // Simplified, assuming 1:1 price
    const ratio = usdcValue > 0 ? daiValue / usdcValue : 0;

    console.log('Total Pool Value (approx):', totalValue.toFixed(2), 'USD');
    console.log('DAI/USDC Ratio:', ratio.toFixed(4));

    // Get total supply of LP tokens
    const totalLPSupply = await pair.totalSupply();
    console.log('Total LP Token Supply:', ethers.formatEther(totalLPSupply));
    // what is LP supply ??

    // If there's no liquidity, 
    // you may need to add some first or use hardhat_setBalance to simulate it.
    // how to add or use setBalance to simulate liquidity?

    // Set up receiver (using one of your hardhat accounts)
  
  console.log('\n👤 Receiver Address:', receiverAddress);

  console.log('\n📊 Setting up swap parameters...');
  const amountIn = ethers.parseUnits("100", digitsUsdc); // Swap 100 USDC
  const path = [USDC, DAI]; // USDC -> DAI swap path
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

  // Get expected output amount to set slippage tolerance
  console.log('🔍 Calculating expected output...');
  const amountsOut = await router.getAmountsOut(amountIn, path);
  const amountOutMin = amountsOut[1] * 95n / 100n; // 5% slippage tolerance (95% of expected)

  console.log('Amount in:', ethers.formatUnits(amountIn, digitsUsdc), 'USDC');
  console.log('Expected amount out:', ethers.formatUnits(amountsOut[1], digitsDai), 'DAI');
  console.log('Minimum amount out (5% slippage):', ethers.formatUnits(amountOutMin, digitsDai), 'DAI');

  // Execute the swap
  console.log('\n🔄 Executing swap on Uniswap V2...');
  try {
    const swapTx = await routerWithWhale.swapExactTokensForTokens(
      amountIn,           // amount of USDC to swap
      amountOutMin,       // minimum DAI to accept (with slippage)
      path,               // [USDC, DAI] swap path
      senderAddress,      // send DAI to whale address (could also use receiverAddress)
      deadline            // transaction deadline
    );

    // can I send to another pool?
    // what is the command in TX EIP 1559?
    
    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await swapTx.wait();
    console.log('✅ Swap executed successfully!');
    console.log('Transaction hash:', receipt.hash);
    console.log('Gas used:', receipt.gasUsed.toString());

      // Check balances after swap
    console.log('\n💰 Balances after swap:');
    const finalUsdcBalance = await usdc.balanceOf();
    const finalDaiBalance = await dai.balanceOf(senderAddress);
    
    console.log('Whale USDC balance:', ethers.formatUnits(finalUsdcBalance, digitsUsdc));
    console.log('Whale DAI balance:', ethers.formatUnits(finalDaiBalance, digitsDai));
  
    // Calculate profit/loss
    const usdcChange = whaleUsdcBalance - finalUsdcBalance;
    const daiChange = finalDaiBalance - whaleDaiBalance;
    
    console.log('\n📈 Swap results:');
    console.log('USDC spent:', ethers.formatUnits(usdcChange, digitsUsdc));
    console.log('DAI received:', ethers.formatUnits(daiChange, digitsDai));
    
    // Calculate effective exchange rate
    if (usdcChange > 0) {
      const exchangeRate = Number(ethers.formatUnits(daiChange, digitsDai)) / 
                           Number(ethers.formatUnits(usdcChange, digitsUsdc));
      console.log('Effective exchange rate:', exchangeRate.toFixed(6), 'DAI/USDC');
    }

    // Get reserves
    const reservesAfterSwap = await pair.getReserves();
    let reserveUSDCAfterSwap, reserveDAIAfterSwap;
    
    if (token0 === USDC) {
      reserveUSDCAfterSwap = reservesAfterSwap.reserve0;
      reserveDAIAfterSwap = reservesAfterSwap.reserve1;
    } else {
      reserveUSDCAfterSwap = reservesAfterSwap.reserve1;
      reserveDAIAfterSwap = reservesAfterSwap.reserve0;
    }

    console.log('\n💧 Pool Liquidity Before Swap:');
    console.log('USDC Reserve:', ethers.formatUnits(reserveUSDC, digitsUsdc));
    console.log('DAI Reserve:', ethers.formatUnits(reserveDAI, digitsDai));

    console.log('\n💧 Pool Liquidity After Swap:');
    console.log('USDC Reserve After Swap:', ethers.formatUnits(reserveUSDCAfterSwap, digitsUsdc));
    console.log('DAI Reserve After Swap:', ethers.formatUnits(reserveDAIAfterSwap, digitsDai));

  
  } catch (error) {
    console.error('❌ Swap failed:', error.message);
    
    // Check if it's a slippage error
    if (error.message.includes('INSUFFICIENT_OUTPUT_AMOUNT') || 
        error.message.includes('slippage')) {
      console.log('💡 Try increasing slippage tolerance or using a smaller amount');
    }
  }

  // Clean up: Stop impersonation
  console.log('\n🧹 Cleaning up...');
  await provider.send("hardhat_stopImpersonatingAccount", [senderAddress]);
  console.log("✅ Whale impersonation stopped");

  console.log("\n🎉 Script completed successfully!");

}

/*
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
}*/

main().catch(console.error);
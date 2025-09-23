

const { ethers } = require('ethers');
const addresses = require("../utils/addresses.cjs");

// upgrade with new code of Deepseek, verify his code before then matches with this one before copy-paste

// Mainnet addresses
const UNISWAP_V2_ROUTER = addresses.ROUTERS.UNIV2;
const UNISWAP_V2_FACTORY = addresses.FACTORIES.UNIV2;

// Token addresses
const WETH = addresses.TOKENS.WETH;
const USDC = addresses.TOKENS.USDC;

// Whale addresses
const USDC_WHALE = addresses.WHALES.USDC[0];

// Your deployer private key (from environment variable or config)
const RECEIVER_PRIVATE_KEY = process.env.RECEIVER_PRIVATE_KEY || "0x13e1bad48b5002f2644d05037300fa22065cc8914698ba801c6dcbe948c66dbc";

// ERC20 ABI (minimal version for what we need)
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// Uniswap Router ABI (only the functions we need)
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

// Storage slot constants
const RESERVE0_SLOT = "0x0000000000000000000000000000000000000000000000000000000000000000";
const RESERVE1_SLOT = "0x0000000000000000000000000000000000000000000000000000000000000001";

async function transferUSDCFromWhale(provider, usdcContract, whaleAddress, recipient, amount) {
  // Impersonate the whale
  await provider.send('hardhat_impersonateAccount', [whaleAddress]);
  
  // Encode the transfer function call
  const usdcInterface = new ethers.Interface([
    'function transfer(address to, uint256 amount) returns (bool)'
  ]);
  
  const transferData = usdcInterface.encodeFunctionData('transfer', [
    recipient,
    amount
  ]);
  
  // Send the transaction directly
  const txHash = await provider.send('eth_sendTransaction', [{
    from: whaleAddress,
    to: usdcContract.target, // or usdcContract.address
    data: transferData,
    gas: ethers.toQuantity(100000) // sufficient gas for ERC20 transfer
  }]);
  
  console.log('USDC transfer transaction hash:', txHash);
  
  // Wait for confirmation
  const receipt = await provider.waitForTransaction(txHash);
  console.log('Transfer confirmed in block:', receipt.blockNumber);
  
  // Stop impersonation
  await provider.send('hardhat_stopImpersonatingAccount', [whaleAddress]);
  
  return receipt;
}

// Usage:
await transferUSDCFromWhale(
  provider,
  usdc,
  USDC_WHALE,
  deployer.address,
  transferAmount
);

async function main() {
  console.log("Starting Uniswap V2 pool manipulation...");
  
  // Create provider connected to local Hardhat node
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  
  // First, impersonate the whale account using Hardhat RPC methods
  await provider.send("hardhat_impersonateAccount", [USDC_WHALE]);
  
  // Fund whale with ETH for gas
  await provider.send("hardhat_setBalance", [
    USDC_WHALE,
    "0x1000000000000000000000", // 1000 ETH
  ]);

  // Create deployer wallet from private key
  const deployer = new ethers.Wallet(RECEIVER_PRIVATE_KEY, provider);
  
  // Create whale signer (impersonated account)
  const whaleSigner = await provider.getUncheckedSigner(USDC_WHALE);

  console.log("Deployer:", deployer.address);
  console.log("Whale address:", whaleSigner.address);

  // Get token contracts using ABI
  const weth = new ethers.Contract(WETH, ERC20_ABI, deployer);
  const usdc = new ethers.Contract(USDC, ERC20_ABI, deployer);

  // Get Uniswap Router using ABI
  const router = new ethers.Contract(UNISWAP_V2_ROUTER, UNISWAP_ROUTER_ABI, deployer);
  const factory = new ethers.Contract(UNISWAP_V2_FACTORY, UNISWAP_FACTORY_ABI, deployer);

  // Check initial balances
  console.log("\nInitial balances:");
  console.log("Deployer WETH:", ethers.formatUnits(await weth.balanceOf(deployer.address), 18));
  console.log("Deployer USDC:", ethers.formatUnits(await usdc.balanceOf(deployer.address), 6));
  console.log("Whale USDC:", ethers.formatUnits(await usdc.balanceOf(whaleSigner.address), 6));

  // Transfer USDC from whale to deployer
  const transferAmount = ethers.parseUnits("10000", 6);
  
  const transferTx = await usdc.connect(whaleSigner).transfer(deployer.address, transferAmount);
  await transferTx.wait();
  
  console.log(`\nTransferred ${ethers.formatUnits(transferAmount, 6)} USDC to deployer`);

  // Check balances after transfer
  console.log("Deployer USDC after transfer:", ethers.formatUnits(await usdc.balanceOf(deployer.address), 6));
  console.log("Whale USDC after transfer:", ethers.formatUnits(await usdc.balanceOf(whaleSigner.address), 6));

  // The pool already exists on mainnet and is available on your fork
  const pairAddress = await factory.getPair(WETH, USDC);
  console.log("\nWETH-USDC Pool address:", pairAddress);

  // Let's check the current pool price first
  console.log("\n=== Current pool state ===");
  await checkPoolPrice(router, weth, usdc);

  // Now manipulate the price with a large swap
  console.log("\n=== Manipulating price ===");
  const swapAmount = ethers.parseUnits("50000", 6); // 50,000 USDC swap
  
  // Generate the EIP-1559 transaction with optimized access list
  const txJson = await generateEIP1559SwapTransaction(router, usdc, weth, deployer, swapAmount, provider);
  console.log("\nEIP-1559 Transaction with Access List:");
  console.log(JSON.stringify(txJson, null, 2));
  
  // Execute the swap using optimized EIP-1559 transaction
  await executeEIP1559Swap(router, usdc, weth, deployer, swapAmount, provider);

  console.log("\n=== Price after manipulation ===");
  await checkPoolPrice(router, weth, usdc);

  console.log("\nPool manipulation completed!");
}

// Function to generate access list for Uniswap swap
async function generateAccessListForSwap(router, tokenIn, tokenOut, amountIn, sender, provider) {
  try {
    const path = [tokenIn.address, tokenOut.address];
    const amountsOut = await router.getAmountsOut(amountIn, path);
    const amountOutMin = amountsOut[1] * 95n / 100n;
    const deadline = Math.floor(Date.now() / 1000) + 300;

    const transaction = {
      to: router.target,
      from: sender,
      data: router.interface.encodeFunctionData("swapExactTokensForTokens", [
        amountIn,
        amountOutMin,
        path,
        sender,
        deadline
      ])
    };

    // Try to get access list through simulation
    try {
      const accessList = await provider.send("eth_createAccessList", [transaction]);
      return accessList.accessList || [];
    } catch (simulationError) {
      console.log("Access list simulation failed, using optimized manual access list");
      
      // Calculate storage slots for ERC20 tokens
      const balanceSlot = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [sender, 0]) // balanceOf[sender]
      );
      
      const allowanceSlot = ethers.keccak256(
        ethers.solidityPacked(["address", "uint256"], [sender, 1]) // allowance[sender] slot
      );
      
      // Manual access list for common Uniswap V2 patterns
      return [
        {
          address: router.target,
          storageKeys: [
            "0x0000000000000000000000000000000000000000000000000000000000000000", // factory slot
            "0x0000000000000000000000000000000000000000000000000000000000000001"  // WETH slot
          ]
        },
        {
          address: tokenIn.address,
          storageKeys: [
            balanceSlot, // balanceOf[sender]
            ethers.keccak256(ethers.solidityPacked(["bytes32", "address"], [allowanceSlot, router.target])) // allowance[sender][router]
          ]
        },
        {
          address: tokenOut.address,
          storageKeys: [
            balanceSlot // balanceOf[sender] (will be updated)
          ]
        }
      ];
    }
  } catch (error) {
    console.log("Access list generation failed, using empty list");
    return [];
  }
}

// Function to generate complete EIP-1559 transaction with Access List
async function generateEIP1559SwapTransaction(router, tokenIn, tokenOut, signer, amountIn, provider) {
  const path = [tokenIn.address, tokenOut.address];
  
  const amountsOut = await router.getAmountsOut(amountIn, path);
  const amountOutMin = amountsOut[1] * 95n / 100n;
  
  const deadline = Math.floor(Date.now() / 1000) + 300;
  
  // FIXED: Use routerInterface instead of interface (reserved word)
  const routerInterface = router.interface;
  const data = routerInterface.encodeFunctionData("swapExactTokensForTokens", [
    amountIn,
    amountOutMin,
    path,
    signer.address,
    deadline
  ]);
  
  // Generate optimized access list for MEV
  const accessList = await generateAccessListForSwap(router, tokenIn, tokenOut, amountIn, signer.address, provider);
  
  // Get current fee data for EIP-1559
  const feeData = await provider.getFeeData();
  
  // Estimate gas
  let gasLimit;
  try {
    // Create a temporary signer for estimation
    const tempSigner = new ethers.Wallet(signer.privateKey, provider);
    const tempRouter = new ethers.Contract(router.target, UNISWAP_ROUTER_ABI, tempSigner);
    
    gasLimit = await tempRouter.swapExactTokensForTokens.estimateGas(
      amountIn,
      amountOutMin,
      path,
      signer.address,
      deadline,
      {
        accessList
      }
    );
  } catch (error) {
    // Fallback to manual estimation
    gasLimit = 200000n + (BigInt(path.length) * 40000n) + 10000n;
    console.log("Using MEV-optimized gas limit:", gasLimit.toString());
  }
  
  // EIP-1559 transaction format with Access List
  return {
    to: router.target,
    from: signer.address,
    data: data,
    value: "0x0",
    gasLimit: gasLimit.toString(),
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(signer.address),
    type: 2,
    maxFeePerGas: feeData.maxFeePerGas?.toString() || "0x9502F900",
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || "0x9502F90",
    accessList: accessList
  };
}

// Function to execute swap using EIP-1559 transaction with Access List
async function executeEIP1559Swap(router, tokenIn, tokenOut, signer, amountIn, provider) {
  const path = [tokenIn.address, tokenOut.address];
  
  // Check price before swap
  const amountsOutBefore = await router.getAmountsOut(amountIn, path);
  console.log(`Before: ${ethers.formatUnits(amountIn, 6)} USDC -> ${ethers.formatUnits(amountsOutBefore[1], 18)} WETH`);

  // Approve token spending first
  const approveTx = await tokenIn.connect(signer).approve(router.target, amountIn);
  await approveTx.wait();
  console.log("Approval transaction hash:", approveTx.hash);

  // Generate EIP-1559 transaction data with access list
  const txData = await generateEIP1559SwapTransaction(router, tokenIn, tokenOut, signer, amountIn, provider);
  
  console.log("Transaction includes access list with", txData.accessList.length, "entries");
  
  // Send the EIP-1559 transaction
  console.log("Sending MEV-optimized EIP-1559 swap transaction...");
  const swapTx = await signer.sendTransaction(txData);
  const receipt = await swapTx.wait();
  
  console.log("Swap transaction hash:", receipt.hash);
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Effective gas price:", ethers.formatUnits(receipt.gasPrice, 9), "gwei");

  // Check price after swap
  const amountsOutAfter = await router.getAmountsOut(amountIn, path);
  console.log(`After: ${ethers.formatUnits(amountIn, 6)} USDC -> ${ethers.formatUnits(amountsOutAfter[1], 18)} WETH`);

  const priceImpact = (Number(amountsOutBefore[1] - amountsOutAfter[1]) / Number(amountsOutBefore[1])) * 100;
  console.log(`Price impact: ${priceImpact.toFixed(2)}%`);
}

async function checkPoolPrice(router, tokenA, tokenB) {
  const path1 = [tokenA.address, tokenB.address];
  const path2 = [tokenB.address, tokenA.address];

  const amountIn = ethers.parseUnits("1", 18);
  
  try {
    const amountsOut1 = await router.getAmountsOut(amountIn, path1);
    console.log(`1 WETH = ${ethers.formatUnits(amountsOut1[1], 6)} USDC`);
  } catch (error) {
    console.log("Could not get WETH->USDC price:", error.message);
  }

  const usdcAmountIn = ethers.parseUnits("1000", 6);
  try {
    const amountsOut2 = await router.getAmountsOut(usdcAmountIn, path2);
    console.log(`1000 USDC = ${ethers.formatUnits(amountsOut2[1], 18)} WETH`);
  } catch (error) {
    console.log("Could not get USDC->WETH price:", error.message);
  }
}

main().catch(console.error);
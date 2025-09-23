

const { ethers } = require("hardhat");
const FlashloanContract = require("./FlashloanContract");
const abis = require("../utils/abis.cjs");
const addresses = require("../utils/addresses.cjs");
const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");

async function main() {
  const [executor] = await ethers.getSigners();
  console.log("Executor address:", executor.address);

  // -----------------------------
  // Connect Flashbots provider
  // -----------------------------
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    ethers.provider,
    executor
  );

  // -----------------------------
  // Impersonate whale & fund executor
  // -----------------------------
  const whale = addresses.WHALES.WETH;
  await ethers.provider.send("hardhat_impersonateAccount", [whale]);
  const whaleSigner = await ethers.provider.getSigner(whale);
  await whaleSigner.sendTransaction({
    to: executor.address,
    value: ethers.parseEther("10")
  });

  console.log("Executor funded with 10 ETH from whale");

  // -----------------------------
  // Optional flashloan execution
  // -----------------------------
  const flashloanAddress = "0xAaBcFE801e4C9086F3E72e4920EFb381965c854b";
  const flashloan = new FlashloanContract(flashloanAddress, executor);

  const paramsArray = [
    { targetToken: addresses.TOKENS.DAI, minAmountOut: ethers.parseUnits("1000", 18), deadline: Math.floor(Date.now() / 1000) + 3600 },
    { targetToken: addresses.TOKENS.USDC, minAmountOut: ethers.parseUnits("500", 6), deadline: Math.floor(Date.now() / 1000) + 3600 }
  ];
  const encodedParams = flashloan.encodeParamsArray(paramsArray);

  console.log("Executing flashloan...");
  const txFlashloan = await flashloan.executeFlashloan(
    addresses.TOKENS.WETH,
    addresses.TOKENS.DAI,
    ethers.parseEther("500"),
    encodedParams
  );
  await txFlashloan.wait();
  console.log("Flashloan executed, txHash:", txFlashloan.hash);

  // -----------------------------
  // Scan pools for arbitrage opportunities
  // -----------------------------
  const swapTxs = [];
  const poolsToScan = [
    { router: addresses.ROUTERS.UNIV2, tokenA: addresses.TOKENS.WETH, tokenB: addresses.TOKENS.DAI },
    { router: addresses.ROUTERS.SUSHI, tokenA: addresses.TOKENS.WETH, tokenB: addresses.TOKENS.USDC }
  ];

  for (const pool of poolsToScan) {
    const router = new ethers.Contract(pool.router, abis.UNIV2_ROUTER, executor);
    const amountIn = ethers.parseEther("1");
    try {
      const amountsOut = await router.getAmountsOut(amountIn, [pool.tokenA, pool.tokenB]);
      const profitPotential = amountsOut[1].sub(amountIn);
      if (profitPotential.gt(0)) {
        console.log(`Arbitrage opportunity found on ${pool.router}: profit ${ethers.formatEther(profitPotential)} tokens`);
        const tx = {
          to: pool.router,
          data: router.interface.encodeFunctionData("swapExactTokensForTokens", [
            amountIn,
            0,
            [pool.tokenA, pool.tokenB],
            executor.address,
            Math.floor(Date.now() / 1000) + 3600
          ]),
          value: 0
        };
        swapTxs.push(tx);
      }
    } catch (err) {
      console.log(`Skipping pool ${pool.router}, error: ${err.message}`);
    }
  }

  // -----------------------------
  // Build Flashbots bundle
  // -----------------------------
  const bundle = swapTxs.map(tx => ({
    signer: executor,
    transaction: { ...tx, maxFeePerGas: ethers.parseUnits("100", "gwei"), maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"), type: 2 }
  }));

  // Add bribe tx to coinbase
  const bribeTx = {
    signer: executor,
    transaction: {
      to: (await ethers.provider.getBlock("latest")).miner,
      value: ethers.parseEther("0.01"),
      data: "0x",
      maxFeePerGas: ethers.parseUnits("100", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
      type: 2
    }
  };
  bundle.push(bribeTx);

  // -----------------------------
  // Simulate & send bundle
  // -----------------------------
  const blockNumber = await ethers.provider.getBlockNumber();
  const simulation = await flashbotsProvider.simulate(bundle, blockNumber + 1);
  console.log("Flashbots bundle simulation:", simulation);

  const sendResult = await flashbotsProvider.sendBundle(bundle, blockNumber + 1);
  console.log("Bundle submitted, local simulation result:", sendResult);

  // -----------------------------
  // Log execution state
  // -----------------------------
  console.log("Bundle transactions:");
  bundle.forEach((tx, i) => console.log(`Tx #${i + 1}:`, tx.transaction.to));
}

main().catch(console.error);

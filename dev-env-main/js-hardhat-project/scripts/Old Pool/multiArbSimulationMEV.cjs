

const { ethers } = require("hardhat");
const FlashloanContract = require("./FlashloanContract");
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");

async function main() {
  const [executor] = await ethers.getSigners();
  console.log("Executor address:", executor.address);

  const flashloanAddress = "0xAaBcFE801e4C9086F3E72e4920EFb381965c854b";
  const flashloan = new FlashloanContract(flashloanAddress, executor);

  // Impersonate whale and fund executor
  const whale = addresses.WHALES.WETH;
  await ethers.provider.send("hardhat_impersonateAccount", [whale]);
  const whaleSigner = await ethers.provider.getSigner(whale);
  await whaleSigner.sendTransaction({
    to: executor.address,
    value: ethers.parseEther("10")
  });

  console.log("Executor funded with 10 ETH from whale");

  // Multi-hop arbitrage parameters
  const paramsArray = [
    {
      targetToken: addresses.TOKENS.DAI,
      minAmountOut: ethers.parseUnits("1000", 18),
      deadline: Math.floor(Date.now() / 1000) + 3600
    },
    {
      targetToken: addresses.TOKENS.USDC,
      minAmountOut: ethers.parseUnits("500", 6),
      deadline: Math.floor(Date.now() / 1000) + 3600
    }
  ];
  const encodedParams = flashloan.encodeParamsArray(paramsArray);

  // Execute flashloan contract
  console.log("Executing flashloan contract...");
  const txFlashloan = await flashloan.executeFlashloan(
    addresses.TOKENS.WETH,
    addresses.TOKENS.DAI,
    ethers.parseEther("500"),
    encodedParams
  );
  await txFlashloan.wait();
  console.log("Flashloan executed, txHash:", txFlashloan.hash);

  // -----------------------------
  // Send Flashbots bundle
  // -----------------------------
  const authSigner = executor;
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    ethers.provider,
    authSigner
  );

  // Example: four swap txs from flashloan
  const swapTxs = flashloan.getSwapTxs(executor); // returns array of {to, data, value} transactions

  // Build bundle
  const bundle = swapTxs.map(tx => ({
    signer: executor,
    transaction: {
      ...tx,
      maxFeePerGas: ethers.parseUnits("100", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
      type: 2
    }
  }));

  // Optional bribe tx to coinbase
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

  // Send bundle simulation to Flashbots
  const blockNumber = await ethers.provider.getBlockNumber();
  const simulation = await flashbotsProvider.simulate(bundle, blockNumber + 1);
  console.log("Flashbots bundle simulation:", simulation);

  if (simulation.error) {
    console.error("Simulation failed:", simulation.error.message);
  } else {
    console.log("Simulation success, bundle ready for MEV execution.");
  }

  // Optional: send the bundle (for local simulation)
  const sendResult = await flashbotsProvider.sendBundle(bundle, blockNumber + 1);
  console.log("Bundle submitted, local simulation result:", sendResult);
}

main().catch(console.error);



const { ethers } = require("hardhat");
const FlashloanContract = require("./FlashloanContract");
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");

async function main() {
  const [executor] = await ethers.getSigners();

  // -----------------------------
  // Setup: Flashloan contract
  // -----------------------------
  const flashloanAddress = "0xAaBcFE801e4C9086F3E72e4920EFb381965c854b";
  const flashloan = new FlashloanContract(flashloanAddress, executor);

  // -----------------------------
  // Example: Impersonate a whale (needs Hardhat mainnet fork)
  // -----------------------------
  const whale = addresses.WHALES.WETH; // Example: WETH whale
  await ethers.provider.send("hardhat_impersonateAccount", [whale]);
  const whaleSigner = await ethers.provider.getSigner(whale);

  console.log("Whale impersonated:", whale);

  // Fund executor account with some ETH from whale
  const fundTx = await whaleSigner.sendTransaction({
    to: executor.address,
    value: ethers.parseEther("10")
  });
  await fundTx.wait();
  console.log("Executor funded with 10 ETH from whale");

  // -----------------------------
  // Define multi-hop arbitrage params
  // -----------------------------
  const paramsArray = [
    {
      targetToken: addresses.TOKENS.DAI,
      minAmountOut: ethers.parseUnits("1000", 18),
      deadline: Math.floor(Date.now() / 1000) + 3600 // +1h
    },
    {
      targetToken: addresses.TOKENS.USDC,
      minAmountOut: ethers.parseUnits("500", 6),
      deadline: Math.floor(Date.now() / 1000) + 3600
    },
    {
      targetToken: addresses.TOKENS.USDT,
      minAmountOut: ethers.parseUnits("500", 6),
      deadline: Math.floor(Date.now() / 1000) + 3600
    }
  ];

  // -----------------------------
  // Encode multi-step params
  // -----------------------------
  const encodedParams = flashloan.encodeParamsArray(paramsArray);
  console.log("Encoded multi-tuple params:", encodedParams);

  // -----------------------------
  // Execute flashloan / multi-hop swap
  // -----------------------------
  const token0 = addresses.TOKENS.WETH;
  const token1 = addresses.TOKENS.DAI;
  const amountToBorrow = ethers.parseEther("500"); // Borrow 500 WETH

  console.log("Executing multi-hop flashloan...");
  const receipt = await flashloan.executeFlashloan(token0, token1, amountToBorrow, encodedParams);

  console.log("Flashloan executed, txHash:", receipt.transactionHash);

  // -----------------------------
  // Log state after execution
  // -----------------------------
  await flashloan.logState("multi-hop arbitrage");
}

main().catch(console.error);

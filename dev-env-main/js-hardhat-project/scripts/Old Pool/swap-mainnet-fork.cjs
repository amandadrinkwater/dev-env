const hre = require("hardhat");
const { ethers } = hre;
const abis = require("../utils/abis.cjs");
const addresses = require("../utils/addresses.cjs");

async function main() {
  // Get deployer signer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Impersonate a whale (WETH)
  const whaleAddress = addresses.WHALES.WETH;
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whaleAddress],
  });
  const whaleSigner = await ethers.getSigner(whaleAddress);

  // Fund deployer with ETH from whale
  const fundTx = await whaleSigner.sendTransaction({
    to: deployer.address,
    value: ethers.parseEther("10"),
  });
  await fundTx.wait();
  console.log("Deployer funded with 10 ETH");

  // Connect to Uniswap V2 Router
  const router = new ethers.Contract(
    addresses.ROUTERS.UNIV2,
    abis.UNIV2_ROUTER,
    deployer
  );

  // Example swap: WETH -> DAI
  const amountIn = ethers.parseEther("1"); // 1 WETH
  const path = [addresses.TOKENS.WETH, addresses.TOKENS.DAI];

  const amountsOut = await router.getAmountsOut(amountIn, path);
  console.log(`1 WETH -> ${ethers.formatEther(amountsOut[1])} DAI`);

  // Approve WETH to router if we want to execute the swap
  const weth = new ethers.Contract(addresses.TOKENS.WETH, abis.ERC20, deployer);
  await weth.approve(router.address, amountIn);

  // Execute swap
  const swapTx = await router.swapExactTokensForTokens(
    amountIn,
    0, // accept any amount out
    path,
    deployer.address,
    Math.floor(Date.now() / 1000) + 60 * 10
  );
  await swapTx.wait();
  console.log("Swap executed successfully");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

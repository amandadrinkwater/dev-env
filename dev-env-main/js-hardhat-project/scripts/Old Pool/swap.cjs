

const hre = require("hardhat");
const { ethers } = hre; // ✅ Get ethers from Hardhat runtime
const abis = require("../utils/abis.cjs");
const addresses = require("../utils/addresses.cjs");


async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Deploy a test ERC20 token
  


  // Example: deploy token with fixed gas price
const TestToken = await ethers.getContractFactory("TestToken", deployer);
const tokenA = await TestToken.deploy(
  "TokenA", "TKA", ethers.parseEther("1000000"),
  { gasPrice: ethers.parseUnits("20", "gwei") } // ✅ FIX
);
await tokenA.waitForDeployment();
const tokenA_address = await tokenA.getAddress();
console.log("TestToken A deployed at:", tokenA_address);

const tokenB = await TestToken.deploy(
  "TokenB", "TKB", ethers.parseEther("1000000"),
  { gasPrice: ethers.parseUnits("20", "gwei") } // ✅ FIX
);
await tokenB.waitForDeployment();

const tokenB_address = await tokenB.getAddress();
console.log("TestToken B deployed at:", tokenB_address);

// ------------------------------
  // 2️⃣ Connect to Uniswap V2 Factory & Router
  // ------------------------------
  const factory = new ethers.Contract(
    addresses.FACTORIES.UNIV2,
    abis.UNIV2_FACTORY,
    deployer
  );


  const router = await new ethers.Contract(
    addresses.ROUTERS.UNIV2,   // ✅ address
    abis.UNIV2_ROUTER,         // ✅ ABI
    deployer
  );

  console.log("Router address:", await router.getAddress());

// ------------------------------
  // 3️⃣ Create Pair (TokenA/TokenB)
  // ------------------------------
  let pairAddress = await factory.getPair(tokenA_address, tokenB_address);
  if (pairAddress === ethers.ZeroAddress) {
    console.log("Creating new pair...");
    await factory.createPair(tokenA_address, tokenB_address);
    pairAddress = await factory.getPair(tokenA_address, tokenB_address);
  }
  console.log("Pair address:", pairAddress);

  // ------------------------------
  // 4️⃣ Approve Router to Spend Tokens
  // ------------------------------
  await tokenA.approve(router.address, ethers.parseEther("1000000"));
  await tokenB.approve(router.address, ethers.parseEther("1000000"));

  // ------------------------------
  // 5️⃣ Add Liquidity
  // ------------------------------
  const amountA = ethers.parseEther("1000"); // 1000 TokenA
  const amountB = ethers.parseEther("2000"); // 2000 TokenB

  await router.addLiquidity(
    tokenA_address,
    tokenB_address,
    amountA,
    amountB,
    0,
    0,
    deployer.address,
    Math.floor(Date.now() / 1000) + 60 * 10 // 10 min deadline
  );

  console.log("Liquidity added:", ethers.formatEther(amountA), "TKA ↔", ethers.formatEther(amountB), "TKB");

  // ------------------------------
  // 6️⃣ Simulate Swap
  // ------------------------------
  const swapAmountIn = ethers.parseEther("10"); // Swap 10 TokenA

  const path = [tokenA_address, tokenB_address];
  const amountsOut = await router.getAmountsOut(swapAmountIn, path);

  console.log(`Swap TokenA estimate: ${ethers.formatEther(swapAmountIn)} TKA → ${ethers.formatEther(amountsOut[1])} TKB`);

  ////////////////////////// Examples of Operations on WEth and DAI

  const weth = new ethers.Contract(addresses.TOKENS.WETH, abis.ERC20, deployer);
  console.log("WETH address:", await weth.getAddress());
  console.log("WETH balance:", (await weth.balanceOf(deployer.address)).toString());

  /*const amountIn = ethers.parseEther("1"); // 1 ETH

  const amountsOut = await router.getAmountsOut(amountIn, [
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    tokenA_amount
  ]); */

  const pathWETHDAI = [addresses.TOKENS.WETH, addresses.TOKENS.DAI]; // real pair with liquidity
const amountIn = ethers.parseEther("1");

const amountsOutDAI = await router.getAmountsOut(amountIn, pathWETHDAI);
console.log(`Estimated output: ${ethers.formatEther(amountsOutDAI[1])} DAI`);

  //console.log(`Estimated token output for 1 ETH: ${ethers.formatEther(amountsOut[1])}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

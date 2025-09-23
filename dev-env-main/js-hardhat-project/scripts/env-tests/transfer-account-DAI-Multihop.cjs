


const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");


const { ethers } = require('hardhat');

const DAI = addresses.TOKENS.DAI;
const ERC20_ABI = abis.ERC20;

async function main() {

    console.log("🐋 Starting transfer simulation with Moby Dick (Hardhat whale)...");
  
    const provider = ethers.provider;

    const network = await provider.getNetwork();
    console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
  

    // generate Dai contract object
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
    
    // fund DAI from whale

    const whaleSponsorAddress = addresses.WHALES.DAI;

    // balance of whale

    console.log('\nWhale Sponsor Address:', whaleSponsorAddress); 

    // Impersonate whale

    await provider.send(
      "hardhat_impersonateAccount",
      [whaleSponsorAddress]
    );

    const whaleSigner = await ethers.getSigner(whaleSponsorAddress );

    console.log('Whale Address: ' + whaleSigner.address);

    const daiWithWhale = dai.connect(whaleSigner);
    // Check initial balances
  console.log("\n💰 Initial balances:");

  const whaleBalance = await provider.getBalance(whaleSigner.address);
    console.log('Whale ETH Balance: ', whaleBalance);
  
  const whaleDaiBalance = await daiWithWhale.balanceOf(whaleSigner.address);
  console.log('Whale Dai balance:', ethers.formatUnits(whaleDaiBalance, 18)); 

    // set two accounts with one weth some eth on it...

    const abbot = addresses.HARDHAT_ACCOUNTS.Abbot;

    const abbotSigner = await ethers.getSigner(abbot.address);

    console.log('\nAbbot Address: ' + abbotSigner.address);

    const daiWithAbbot = dai.connect(abbotSigner);



    const costello = addresses.HARDHAT_ACCOUNTS.Costello;

    await provider.send("hardhat_setBalance", [
      costello.address,
      ethers.toBeHex(ethers.parseEther("10")), // 10 ETH
    ]);

    const costelloSigner = await ethers.getSigner(costello.address);

    console.log('\nCostello Address: ' + costelloSigner.address);

    const daiWithCostello = dai.connect(costelloSigner);
    // Check initial balances
  console.log("\n💰 Initial balances:");

  const abbotBalance = await provider.getBalance(abbotSigner.address);
    console.log('Abbot ETH Balance: ', abbotBalance);
  
  const abbotDaiBalance = await daiWithAbbot.balanceOf(abbotSigner.address);
  console.log('Abbot Dai balance:', ethers.formatUnits(abbotDaiBalance, 18)); 

  const costelloBalance = await provider.getBalance(costelloSigner.address);
    console.log('\nCostello ETH Balance: ', costelloBalance);
  
  const costelloDaiBalance = await daiWithCostello.balanceOf(costelloSigner.address);
  console.log('Costello Dai balance:', ethers.formatUnits(costelloDaiBalance, 18)); 

  try {

    // Loading Abbot with Dai from Whale
  const transferAmount = ethers.parseUnits("1000", 18); // 500 USDC
  
  console.log(`\n💸 Transferring ${ethers.formatUnits(transferAmount, 18)} DAI from whale to Abbot...`);
  
  const transferTx = await daiWithWhale.transfer(abbotSigner.address, transferAmount);
  await transferTx.wait();
  
  console.log("✅ Transfer To Abbot completed");

  // Check balances after transfer
  console.log("\n💰 Balances after transfer To Costello:");
  console.log("Whale DAI:", ethers.formatUnits(await dai.balanceOf(whaleSigner.address), 18));
  console.log("Abbot DAI:", ethers.formatUnits(await dai.balanceOf(abbotSigner.address), 18));
  console.log("Costello DAI:", ethers.formatUnits(await dai.balanceOf(costelloSigner.address), 18));

// Transfering from Abbot To Costello

  const transferAmountToCostello = ethers.parseUnits("800", 18); // 500 USDC
  
  console.log(`\n💸 Transferring ${ethers.formatUnits(transferAmount, 18)} Dai from Abbot to Costello...`);
  
  const transferToCostelloTx = await daiWithAbbot.transfer(costelloSigner.address, transferAmountToCostello);
  await transferToCostelloTx.wait();
  
  console.log("✅ Transfer To Costello completed");

  // Check balances after transfer
  console.log("\n💰 Balances after transfer To Costello:");
  console.log("Whale DAI:", ethers.formatUnits(await dai.balanceOf(whaleSigner.address), 18));
  console.log("Abbot DAI:", ethers.formatUnits(await dai.balanceOf(abbotSigner.address), 18));
  console.log("Costello DAI:", ethers.formatUnits(await dai.balanceOf(costelloSigner.address), 18));

  const whaleBalance2 = await provider.getBalance(whaleSigner.address);
  console.log('\nWhale ETH Final Balance: ', whaleBalance2);
  
  const abbotBalance2 = await provider.getBalance(abbotSigner.address);
  console.log('Abbot ETH Final Balance: ', abbotBalance2);
  
  const costelloBalance2 = await provider.getBalance(costelloSigner.address);
  console.log('Costello ETH Final Balance: ', costelloBalance2);
  

 // Amount Costello sends back to Abbot
  const backAmount = ethers.parseUnits("100", 18); // 100 DAI

  // Get current fee data & craft EIP-1559 caps
  const feeData = await provider.getFeeData();
  // reasonable fallbacks for local forks if null
  const maxPriority = feeData.maxPriorityFeePerGas ?? ethers.parseUnits("2", "gwei");
  const maxFee =
    feeData.maxFeePerGas ??
    (feeData.gasPrice ? feeData.gasPrice * 2n : ethers.parseUnits("30", "gwei"));

  // (Optional) estimate gas for the transfer
  const est = await daiWithCostello.transfer.estimateGas(abbotSigner.address, backAmount, {
    maxFeePerGas: maxFee,
    maxPriorityFeePerGas: maxPriority,
    type: 2,
  });

  console.log(`\n🚀 Sending Costello -> Abbot (EIP-1559) ${ethers.formatUnits(backAmount, 18)} DAI ...`);

  const eip1559Tx = await daiWithCostello.transfer(abbotSigner.address, backAmount, {
    maxFeePerGas: maxFee,
    maxPriorityFeePerGas: maxPriority,
    gasLimit: est, // optional but nice to be explicit
    type: 2,       // force EIP-1559
  });


  const eip1559Rcpt = await eip1559Tx.wait();
  console.log("✅ EIP-1559 transfer completed");
  console.log("Tx hash:", eip1559Tx.hash);
  console.log("Gas used:", eip1559Rcpt.gasUsed.toString());
  console.log("Effective gas price (wei):", eip1559Rcpt.gasPrice.toString());

  const gasCostWei = eip1559Rcpt.gasUsed * eip1559Rcpt.gasPrice;
  console.log("Gas cost (wei):", gasCostWei.toString());
  console.log("Gas cost (ETH):", ethers.formatEther(gasCostWei));



   // Final balances
  console.log("\n💰 Final balances after Costello -> Abbot:");
  console.log("Whale DAI:", ethers.formatUnits(await dai.balanceOf(whaleSigner.address), 18));
  console.log("Abbot DAI:", ethers.formatUnits(await dai.balanceOf(abbotSigner.address), 18));
  console.log("Costello DAI:", ethers.formatUnits(await dai.balanceOf(costelloSigner.address), 18));


  const whaleBalance3 = await provider.getBalance(whaleSigner.address);
  console.log('\nWhale ETH Final Balance: ', whaleBalance3);
  
  const abbotBalance3 = await provider.getBalance(abbotSigner.address);
  console.log('Abbot ETH Final Balance: ', abbotBalance3);
  
  const costelloBalance3 = await provider.getBalance(costelloSigner.address);
  console.log('Costello ETH Final Balance: ', costelloBalance3);
  

  } catch (error) {
    console.error('Loading Abbot With Dai failed:', error);
  }

    // Transfer Dai from Abbot to Costello

    try {

  } catch (error) {
    console.error('Transfering from Abbot to Costello failed:', error);
  }

}

main().catch(console.error);



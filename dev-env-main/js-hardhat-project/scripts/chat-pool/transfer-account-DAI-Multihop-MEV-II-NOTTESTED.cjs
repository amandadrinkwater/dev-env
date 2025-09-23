
const addresses = require("../utils/addresses.cjs");
const abis = require("../utils/abis.cjs");
const RPCs = require("../utils/RPCs.cjs");

// const { ethers } = require("ethers");

const { ethers } = require("hardhat");

const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");

// --- CONFIG: change these ---
const HARDHAT_RPC = RPCs.localHardHat;
const DAI_ADDRESS = addresses.TOKENS.DAI; // mainnet DAI
const WHALE = addresses.WHALES.DAI[0];     // the DAI whale you want to impersonate
const ABBOT = addresses.HARDHAT_ACCOUNTS[0];     // pick an address you control in fork (or random)
const COSTELLO = addresses.HARDHAT_ACCOUNTS[1];
const AUTH_PRIVATE_KEY = addresses.HARDHAT_ACCOUNTS[2].privKey; // small ephemeral key used to auth to flashbots
// ---------------------------------

const ERC20_ABI = abis.ERC20;

async function main(){
  // connect to local fork
  const provider = new ethers.providers.JsonRpcProvider(HARDHAT_RPC);

  // prepare an auth signer for Flashbots (any local private key)
  const authWallet = new ethers.Wallet(AUTH_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey, provider);

  // create flashbots provider pointing at the Flashbots relay
  // NOTE: on a true local-offline setup you can still call flashbotsProvider.simulate against relay,
  // but you might also skip creation if you only want pure local tx execution.
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authWallet, "https://relay.flashbots.net");

  // impersonate accounts on Hardhat
  await provider.send("hardhat_impersonateAccount", [WHALE]);
  await provider.send("hardhat_impersonateAccount", [ABBOT]);
  await provider.send("hardhat_impersonateAccount", [COSTELLO]);

  // give them ETH for gas (on hardhat fork it's fake)
  const bigEth = "0x3635C9ADC5DEA00000"; // ~1000 ETH in hex
  await provider.send("hardhat_setBalance", [WHALE, bigEth]);
  await provider.send("hardhat_setBalance", [ABBOT, bigEth]);
  await provider.send("hardhat_setBalance", [COSTELLO, bigEth]);

  // get signers
  const whaleSigner = provider.getSigner(WHALE);
  const abbotSigner = provider.getSigner(ABBOT);
  const costelloSigner = provider.getSigner(COSTELLO);

  // instantiate DAI contract objects connected to signers for convenience
  const daiWhale = new ethers.Contract(DAI_ADDRESS, ERC20_ABI, whaleSigner);

  // check decimals and build transfer amounts
  const decimals = 18; // DAI is 18
  const amount = ethers.utils.parseUnits("1.0", decimals); // transfer 1 DAI (example)

  // Build unsigned txs (populateTransaction gives gasLimit/gasPrice options)
  const tx1 = await daiWhale.populateTransaction.transfer(ABBOT, amount);       // Whale -> Abbot
  // For the subsequent transfers, connect the contract to the appropriate signer to get tx objects:
  const daiAbbot = new ethers.Contract(DAI_ADDRESS, ERC20_ABI, abbotSigner);
  const tx2 = await daiAbbot.populateTransaction.transfer(COSTELLO, amount);    // Abbot -> Costello
  const daiCostello = new ethers.Contract(DAI_ADDRESS, ERC20_ABI, costelloSigner);
  const tx3 = await daiCostello.populateTransaction.transfer(ABBOT, amount);    // Costello -> Abbot

  // set common tx fields (chainId, gas) using the provider (nonce for each signer will be taken care of)
  const chainId = (await provider.getNetwork()).chainId;
  tx1.chainId = chainId;
  tx2.chainId = chainId;
  tx3.chainId = chainId;

  // NOTE: Flashbots provider helper will sign transactions for you if you pass signer objects
  // Build the bundle as the array of {signer, transaction}
  const bundle = [
    { signer: whaleSigner, transaction: tx1 },
    { signer: abbotSigner, transaction: tx2 },
    { signer: costelloSigner, transaction: tx3 }
  ];

  // get current block and simulate against target block
  const block = await provider.getBlock("latest");
  const targetBlock = block.number + 1;

  // Sign & simulate the bundle via flashbotsProvider.simulate
  const signedBundle = await flashbotsProvider.signBundle(bundle);
  const simulation = await flashbotsProvider.simulate(signedBundle, block.number);

  console.log("Sim result:", JSON.stringify(simulation, null, 2));

  // Optional: actually send the bundle to Flashbots relay for inclusion (uses eth_sendBundle)
  // const sendResponse = await flashbotsProvider.sendBundle(signedBundle, targetBlock);
  // console.log("sendResponse:", sendResponse);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

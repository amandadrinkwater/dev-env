
const hre = require("hardhat");
const { ethers } = hre;

async function impersonate(address, addressTo, fundEth = "100") {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  const signer = await hre.ethers.provider.getSigner(address);

  const tx = {
    to: addressTo,
    value: ethers.parseEther("0.01"),
  };

  const recieptTx = await signer.sendTransaction(tx);

  await recieptTx.wait();

   console.log(`Transaction successful with hash: ${recieptTx.hash}`);
  console.log(
    "Balance of Signer account after transaction",
    ethers.utils.formatEther(await signer.getBalance())
  );

  console.log(
    "Balance of Receipient account after transaction",
    ethers.utils.formatEther(await addressTo.getBalance())
  );

  return signer;
}

module.exports = { impersonate };

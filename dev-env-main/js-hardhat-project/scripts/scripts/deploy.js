const { ethers } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");
  
  // Get the contract factory
  const SimpleContract = await ethers.getContractFactory("SimpleContract");
  
  // Deploy the contract
  console.log("Deploying SimpleContract...");
  const simpleContract = await SimpleContract.deploy("Hello, Ethereum!");
  
  await simpleContract.waitForDeployment();
  
  const contractAddress = await simpleContract.getAddress();
  console.log("SimpleContract deployed to:", contractAddress);
  
  // Verify the deployment
  const greeting = await simpleContract.greet();
  console.log("Initial greeting:", greeting);
  
  const owner = await simpleContract.owner();
  console.log("Contract owner:", owner);

  // Save deployment info for frontend
  const deploymentInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    initialGreeting: greeting,
    owner: owner
  };
  
  const deploymentPath = path.join(__dirname, "..", "frontend", "contract-deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentPath);
  
  // Also copy ABI for frontend use
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "SimpleContract.sol", "SimpleContract.json");
  const frontendAbiPath = path.join(__dirname, "..", "frontend", "SimpleContract.json");
  
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abiData = {
      abi: artifact.abi,
      bytecode: artifact.bytecode
    };
    fs.writeFileSync(frontendAbiPath, JSON.stringify(abiData, null, 2));
    console.log("Contract ABI copied to frontend:", frontendAbiPath);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
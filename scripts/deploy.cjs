const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with address:", deployer.address);

  let contractName;
  if (hre.network.name === 'somnia-testnet') {
    contractName = "SomniaFarming";
  } else if (hre.network.name === 'nexus-testnet') {
    contractName = "NexusFarming";
  } else if (hre.network.name === 'pharos') {
    contractName = "PharosFarming";
  } else {
    contractName = "RiseFarming";
  }

  const ContractFactory = await hre.ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy();
  await contract.deployed();
  const contractAddress = contract.address;
  console.log(`${contractName} deployed to:`, contractAddress);

  // Export ABI
  const artifact = await hre.artifacts.readArtifact(contractName);
  fs.mkdirSync("src/abi", { recursive: true });
  fs.writeFileSync(`src/abi/${contractName}.json`, JSON.stringify(artifact.abi, null, 2));

  // Save address to a file for the current network
  const network = hre.network.name;
  fs.writeFileSync(`src/abi/${contractName}.address.${network}.txt`, contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
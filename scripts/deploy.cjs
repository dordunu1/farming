const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with address:", deployer.address);

  const ContractFactory = await hre.ethers.getContractFactory(hre.network.name === 'somnia-testnet' ? "SomniaFarming" : "RiseFarming");
  const contract = await ContractFactory.deploy();
  await contract.deployed();
  const contractAddress = contract.address;
  console.log(`${hre.network.name === 'somnia-testnet' ? 'SomniaFarming' : 'RiseFarming'} deployed to:`, contractAddress);

  // Export ABI
  const artifact = await hre.artifacts.readArtifact(hre.network.name === 'somnia-testnet' ? "SomniaFarming" : "RiseFarming");
  fs.mkdirSync("src/abi", { recursive: true });
  fs.writeFileSync(`src/abi/${hre.network.name === 'somnia-testnet' ? 'SomniaFarming' : 'RiseFarming'}.json`, JSON.stringify(artifact.abi, null, 2));

  // Save address to a file for the current network
  const network = hre.network.name;
  fs.writeFileSync(`src/abi/${hre.network.name === 'somnia-testnet' ? 'SomniaFarming' : 'RiseFarming'}.address.${network}.txt`, contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with address:", deployer.address);

  const RiseFarming = await hre.ethers.getContractFactory("RiseFarming");
  const contract = await RiseFarming.deploy();
  await contract.deployed();
  const contractAddress = contract.address;
  console.log("RiseFarming deployed to:", contractAddress);

  // Export ABI
  const artifact = await hre.artifacts.readArtifact("RiseFarming");
  fs.mkdirSync("src/abi", { recursive: true });
  fs.writeFileSync("src/abi/RiseFarming.json", JSON.stringify(artifact.abi, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
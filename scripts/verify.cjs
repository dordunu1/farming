const hre = require("hardhat");

async function main() {
  let contractName, contractPath, contractAddress;
  if (hre.network.name === 'somnia-testnet') {
    contractName = "SomniaFarming";
    contractPath = "contracts/SomniaFarming.sol:SomniaFarming";
    contractAddress = "<SOMNIA_CONTRACT_ADDRESS>"; // TODO: Fill after deploy
  } else if (hre.network.name === 'nexus-testnet') {
    contractName = "NexusFarming";
    contractPath = "contracts/NexusFarming.sol:NexusFarming";
    contractAddress = "0x2Ff8bD293D489Aed53A731702b963d7C244Dd88B";
  } else if (hre.network.name === 'pharos') {
    contractName = "PharosFarming";
    contractPath = "contracts/PharosFarming.sol:PharosFarming";
    contractAddress = "<PHAROS_CONTRACT_ADDRESS>"; // TODO: Fill after deploy
  } else {
    contractName = "RiseFarming";
    contractPath = "contracts/RiseFarming.sol:RiseFarming";
    contractAddress = "<RISE_CONTRACT_ADDRESS>"; // TODO: Fill after deploy
  }
  // The constructor argument is the deployer's address (used for Ownable)
  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [],
    contract: contractPath
  });
  console.log(`Verification submitted for: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
const hre = require("hardhat");

async function main() {
  let contractName, contractPath, contractAddress;
  if (hre.network.name === 'somnia-testnet') {
    contractName = "SomniaFarming";
    contractPath = "contracts/SomniaFarming.sol:SomniaFarming";
    contractAddress = "0xa56919e3b51cE5e8cce02e76f145d9732db89c04"; // Latest SomniaFarming deployed address
  } else if (hre.network.name === 'nexus-testnet') {
    contractName = "NexusFarming";
    contractPath = "contracts/NexusFarming.sol:NexusFarming";
    contractAddress = "0x2Ff8bD293D489Aed53A731702b963d7C244Dd88B";
  } else if (hre.network.name === 'pharos') {
    contractName = "PharosFarming";
    contractPath = "contracts/PharosFarming.sol:PharosFarming";
    contractAddress = "0x15433E7Ebdd06d56eD6FEC60132cB8DBceC42245"; // PharosFarming deployed address
  } else if (hre.network.name === 'fluent-testnet') {
    contractName = "FluentFarming";
    contractPath = "contracts/FluentFarming.sol:FluentFarming";
    contractAddress = "0xe717CC5B84341E549376E601E9DE429CA95EC7D7"; // FluentFarming deployed address
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
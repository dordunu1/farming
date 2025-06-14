const hre = require("hardhat");

async function main() {
  // Hardcoded deployed contract address for SomniaFarming
  const contractAddress = "0xdb9533e53B1D0da448AA917fFE83907d66C6Ddf5";
  // The constructor argument is the deployer's address (used for Ownable)
  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [],
    contract: "contracts/SomniaFarming.sol:SomniaFarming"
  });
  console.log("Verification submitted for:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
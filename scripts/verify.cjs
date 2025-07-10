const hre = require("hardhat");

async function main() {
  // Hardcoded deployed contract address for SomniaFarming
  const contractAddress = "0x260dDaeAF6e47183A9B4778B8C5A793904467D56";
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
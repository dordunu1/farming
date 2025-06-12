const hre = require("hardhat");

async function main() {
  // Hardcoded deployed contract address for SomniaFarming
  const contractAddress = "0xA6B00fA5c96919E2bFdC6E1C37D8E251798b3C13";
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
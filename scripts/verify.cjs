const hre = require("hardhat");

async function main() {
  // Hardcoded deployed contract address
  const contractAddress = "0xFdC8c15d0DAaC11B726b3a4628457C7eC99a6f41";
  // The constructor argument is the deployer's address (used for Ownable)
  const [deployer] = await hre.ethers.getSigners();
  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [],
  });
  console.log("Verification submitted for:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
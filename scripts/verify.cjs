const hre = require("hardhat");

async function main() {
  // Hardcoded deployed contract address
  const contractAddress = "0x14A35f81Fdf639652Bedaa67EA1b0D15C2c54d2d";
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
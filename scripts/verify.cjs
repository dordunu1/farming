const hre = require("hardhat");

async function main() {
  // Hardcoded deployed contract address
  const contractAddress = "0x80f976b77CF2EBF248292bD7C874F963B95E932c";
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
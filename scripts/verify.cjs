const hre = require("hardhat");

async function main() {
  // Hardcoded deployed contract address
  const contractAddress = "0xAaa9b92cce37333A998955e32F898815051cf967";
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
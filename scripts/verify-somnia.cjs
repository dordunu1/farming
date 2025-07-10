const hre = require("hardhat");

async function main() {
  const contractAddress = "0x260dDaeAF6e47183A9B4778B8C5A793904467D56";
  
  console.log("Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      contract: "contracts/SomniaFarming.sol:SomniaFarming",
      constructorArguments: [],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Error verifying contract:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
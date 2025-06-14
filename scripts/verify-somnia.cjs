const hre = require("hardhat");

async function main() {
  const contractAddress = "0xfDA2160b7B8D43d08085195252504eF2CAaec1C0";
  
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
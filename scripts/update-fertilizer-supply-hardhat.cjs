const { ethers } = require("hardhat");

async function main() {
  console.log("Updating Fertilizer Spreader supply on Rise testnet...");

  // Get the contract
  const RiseFarming = await ethers.getContractFactory("RiseFarming");
  
  // Contract address for Rise testnet
  const contractAddress = "0x3D5Db5A7819BB3aff93D084CD51b42B09cd6Fa79";
  const contract = RiseFarming.attach(contractAddress);

  // Get the signer (owner)
  const [owner] = await ethers.getSigners();
  console.log("Using account:", owner.address);

  const FERTILIZER_SPREADER_ID = 12;
  const NEW_SUPPLY = 50000;

  try {
    // Fetch the current item struct
    const item = await contract.items(FERTILIZER_SPREADER_ID);

    console.log(`Current Fertilizer Spreader supply: ${item.supply.toString()}`);
    console.log(`Current Fertilizer Spreader maxSupply: ${item.maxSupply.toString()}`);

    // Use the setItemMaxSupply function
    const tx = await contract.setItemMaxSupply(FERTILIZER_SPREADER_ID, NEW_SUPPLY);
    await tx.wait();
    console.log(`✅ Fertilizer Spreader (ID ${FERTILIZER_SPREADER_ID}) supply and maxSupply updated to ${NEW_SUPPLY}!`);
    
  } catch (error) {
    console.error("❌ Error updating Fertilizer Spreader supply:", error.message);
    
    // Check if it's an ownership issue
    try {
      const ownerAddress = await contract.owner();
      console.log("Contract owner:", ownerAddress);
      console.log("Current signer:", owner.address);
      console.log("Is owner?", ownerAddress.toLowerCase() === owner.address.toLowerCase());
    } catch (ownerError) {
      console.error("Could not check ownership:", ownerError.message);
    }
  }

  console.log("🎉 Script complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
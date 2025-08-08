const { ethers } = require("hardhat");

async function main() {
  console.log("Updating SomniaFarming item prices to 0.1 ETH...");

  // Get the contract
  const SomniaFarming = await ethers.getContractFactory("SomniaFarming");
  
  // You'll need to replace this with your actual deployed contract address
  const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";
  const contract = SomniaFarming.attach(contractAddress);

  // Get the signer (owner)
  const [owner] = await ethers.getSigners();
  console.log("Using account:", owner.address);

  // Define all item IDs that need price updates
  const itemIds = [
    9,  // BASIC_SEED_SINGLE_ID
    10, // PREMIUM_SEED_SINGLE_ID  
    11, // HYBRID_SEED_SINGLE_ID
    5,  // WATERING_CAN_ID
    6,  // AUTO_WATERING_SYSTEM_ID
    12, // FERTILIZER_SPREADER_ID
    17, // GOLDEN_HARVESTER_SINGLE_ID
    19, // ENERGY_BOOSTER_ID
    4,  // STARTER_BUNDLE_ID
    7,  // HARVESTER_ID
  ];

  // New price: 0.1 ETH = 0.1e18 wei
  const newPrice = ethers.parseEther("0.1");

  console.log(`Updating ${itemIds.length} items to price: ${ethers.formatEther(newPrice)} ETH`);

  for (const itemId of itemIds) {
    try {
      // Get current item data
      const currentItem = await contract.items(itemId);
      
      if (currentItem.id === 0n) {
        console.log(`Item ${itemId} does not exist, skipping...`);
        continue;
      }

      // Create updated item with new price
      const updatedItem = {
        id: itemId,
        name: currentItem.name,
        itemType: currentItem.itemType,
        priceETH: newPrice,
        paymentToken: currentItem.paymentToken,
        baseReward: currentItem.baseReward,
        baseGrowthTime: currentItem.baseGrowthTime,
        growthBonusBP: currentItem.growthBonusBP,
        yieldBonusBP: currentItem.yieldBonusBP,
        active: currentItem.active,
        maxSupply: currentItem.maxSupply,
        supply: currentItem.supply
      };

      console.log(`Updating item ${itemId} (${currentItem.name}) from ${ethers.formatEther(currentItem.priceETH)} ETH to ${ethers.formatEther(newPrice)} ETH`);
      
      // Update the item
      const tx = await contract.updateItem(updatedItem);
      await tx.wait();
      
      console.log(`✅ Item ${itemId} updated successfully!`);
      
    } catch (error) {
      console.error(`❌ Failed to update item ${itemId}:`, error.message);
    }
  }

  // Update bundle prices as well
  const bundleIds = [13, 14, 15, 16, 18]; // Bundle IDs
  
  console.log(`\nUpdating ${bundleIds.length} bundles to price: ${ethers.formatEther(newPrice)} ETH`);

  for (const bundleId of bundleIds) {
    try {
      // Get current bundle data
      const currentBundle = await contract.bundles(bundleId);
      
      if (currentBundle.id === 0n) {
        console.log(`Bundle ${bundleId} does not exist, skipping...`);
        continue;
      }

      // Create updated bundle with new price
      const updatedBundle = {
        id: bundleId,
        name: currentBundle.name,
        itemIds: currentBundle.itemIds,
        itemAmounts: currentBundle.itemAmounts,
        priceETH: newPrice,
        paymentToken: currentBundle.paymentToken,
        active: currentBundle.active,
        maxSupply: currentBundle.maxSupply,
        supply: currentBundle.supply
      };

      console.log(`Updating bundle ${bundleId} (${currentBundle.name}) from ${ethers.formatEther(currentBundle.priceETH)} ETH to ${ethers.formatEther(newPrice)} ETH`);
      
      // Update the bundle
      const tx = await contract.updateBundle(updatedBundle);
      await tx.wait();
      
      console.log(`✅ Bundle ${bundleId} updated successfully!`);
      
    } catch (error) {
      console.error(`❌ Failed to update bundle ${bundleId}:`, error.message);
    }
  }

  console.log("\n🎉 Price update complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
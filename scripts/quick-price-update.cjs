const { ethers } = require("hardhat");

async function main() {
  console.log("Quick update: Setting all SomniaFarming item prices to 0.1 ETH...");

  // Get the contract
  const SomniaFarming = await ethers.getContractFactory("SomniaFarming");
  
  // Contract address for Somnia testnet
  const contractAddress = "0x260dDaeAF6e47183A9B4778B8C5A793904467D56";
  const contract = SomniaFarming.attach(contractAddress);

  // Get the signer (owner)
  const [owner] = await ethers.getSigners();
  console.log("Using account:", owner.address);

  // New price: 0.1 ETH = 0.1e18 wei
  const newPrice = ethers.utils.parseEther("0.1");

  // Define all items with their current properties (from constructor)
  const itemsToUpdate = [
    {
      id: 9, // BASIC_SEED_SINGLE_ID
      name: "Basic Rice Seed (Single)",
      itemType: 0,
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      baseReward: 15,
      baseGrowthTime: 3600,
      growthBonusBP: 0,
      yieldBonusBP: 0,
      active: true,
      maxSupply: 500000,
      supply: 500000
    },
    {
      id: 10, // PREMIUM_SEED_SINGLE_ID
      name: "Premium Rice Seed (Single)",
      itemType: 0,
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      baseReward: 50,
      baseGrowthTime: 2400,
      growthBonusBP: 0,
      yieldBonusBP: 0,
      active: true,
      maxSupply: 500000,
      supply: 500000
    },
    {
      id: 11, // HYBRID_SEED_SINGLE_ID
      name: "Hybrid Rice Seed (Single)",
      itemType: 0,
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      baseReward: 70,
      baseGrowthTime: 1200,
      growthBonusBP: 0,
      yieldBonusBP: 0,
      active: true,
      maxSupply: 500000,
      supply: 500000
    },
    {
      id: 5, // WATERING_CAN_ID
      name: "Watering Can",
      itemType: 1,
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      baseReward: 0,
      baseGrowthTime: 0,
      growthBonusBP: 0,
      yieldBonusBP: 0,
      active: true,
      maxSupply: 500000,
      supply: 500000
    },
    {
      id: 6, // AUTO_WATERING_SYSTEM_ID
      name: "Auto-Watering System",
      itemType: 1,
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      baseReward: 0,
      baseGrowthTime: 0,
      growthBonusBP: 0,
      yieldBonusBP: 0,
      active: true,
      maxSupply: 25000,
      supply: 25000
    },
    // Fertilizer Spreader (ID 12) is RT-priced, so we skip it
    {
      id: 17, // GOLDEN_HARVESTER_SINGLE_ID
      name: "Golden Harvester (Single)",
      itemType: 1,
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      baseReward: 0,
      baseGrowthTime: 0,
      growthBonusBP: 0,
      yieldBonusBP: 0,
      active: true,
      maxSupply: 500000,
      supply: 500000
    },
    // Energy Booster (ID 19) is RT-priced, so we skip it
    {
      id: 4, // STARTER_BUNDLE_ID
      name: "Starter Bundle",
      itemType: 0,
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      baseReward: 0,
      baseGrowthTime: 0,
      growthBonusBP: 0,
      yieldBonusBP: 0,
      active: true,
      maxSupply: 1000,
      supply: 1000
    }
  ];

  console.log(`Updating ${itemsToUpdate.length} items to price: ${ethers.utils.formatEther(newPrice)} ETH`);

  for (const item of itemsToUpdate) {
    try {
      console.log(`Updating item ${item.id} (${item.name}) to ${ethers.utils.formatEther(item.priceETH)} ETH`);
      
      // Update the item
      const tx = await contract.updateItem(item);
      await tx.wait();
      
      console.log(`✅ Item ${item.id} updated successfully!`);
      
    } catch (error) {
      console.error(`❌ Failed to update item ${item.id}:`, error.message);
    }
  }

  // Update bundles
  const bundlesToUpdate = [
    {
      id: 13,
      name: "Basic Rice Seed (Bundle)",
      itemIds: [9],
      itemAmounts: [5],
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      active: true,
      maxSupply: 1000,
      supply: 1000
    },
    {
      id: 14,
      name: "Premium Rice Seed (Bundle)",
      itemIds: [10],
      itemAmounts: [2],
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      active: true,
      maxSupply: 1000,
      supply: 1000
    },
    {
      id: 15,
      name: "Hybrid Rice Seed (Bundle)",
      itemIds: [11],
      itemAmounts: [2],
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      active: true,
      maxSupply: 500,
      supply: 500
    },
    {
      id: 16,
      name: "Golden Harvester (Bundle)",
      itemIds: [17],
      itemAmounts: [2],
      priceETH: newPrice,
      paymentToken: "0x0000000000000000000000000000000000000000",
      active: true,
      maxSupply: 250000,
      supply: 250000
    }
  ];

  console.log(`\nUpdating ${bundlesToUpdate.length} bundles to price: ${ethers.utils.formatEther(newPrice)} ETH`);

  for (const bundle of bundlesToUpdate) {
    try {
      console.log(`Updating bundle ${bundle.id} (${bundle.name}) to ${ethers.utils.formatEther(bundle.priceETH)} ETH`);
      
      // Update the bundle
      const tx = await contract.updateBundle(bundle);
      await tx.wait();
      
      console.log(`✅ Bundle ${bundle.id} updated successfully!`);
      
    } catch (error) {
      console.error(`❌ Failed to update bundle ${bundle.id}:`, error.message);
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
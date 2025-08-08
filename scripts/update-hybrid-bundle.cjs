require('dotenv').config({ path: '.env.rise' });
const { ethers } = require('ethers');
const abi = require('../functions/RiseFarmingABI.json').abi;

const CONTRACT_ADDRESS = process.env.VITE_FARMING_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RISE_RPC_URL || process.env.VITE_RISE_RPC_URL;

const BUNDLE_IDS = [13, 14, 15, 16]; // Basic, Premium, Hybrid, Golden Harvester Bundle
const NEW_SUPPLY = 50000; // Updated to 50000 for all bundles
const GOLDEN_HARVESTER_SINGLE_ID = 17;
const GOLDEN_HARVESTER_BUNDLE_ID = 16; // Correct ID from RiseFarming.sol

async function updateBundle(contract, bundleId, nonce) {
  // Fetch the current bundle struct
  const bundle = await contract.bundles(bundleId);

  // Fetch itemIds and itemAmounts arrays
  const itemIds = [];
  const itemAmounts = [];
  let i = 0;
  while (true) {
    try {
      itemIds.push(await contract.bundles[bundleId].itemIds(i));
      itemAmounts.push(await contract.bundles[bundleId].itemAmounts(i));
      i++;
    } catch (e) {
      break;
    }
  }

  // Construct the new bundle struct with updated supply and maxSupply
  const updatedBundle = {
    id: bundleId,
    name: bundle.name,
    itemIds,
    itemAmounts,
    priceETH: bundle.priceETH,
    paymentToken: bundle.paymentToken,
    active: bundle.active,
    maxSupply: NEW_SUPPLY, // new value
    supply: NEW_SUPPLY     // new value
  };

  // Call updateBundle
  const tx = await contract.updateBundle(updatedBundle, { nonce });
  await tx.wait();
  console.log(`Bundle ${bundleId} (${bundle.name}) supply and maxSupply updated to ${NEW_SUPPLY}!`);
}

async function updateItem(contract, itemId, nonce) {
  // Fetch the current item struct
  const item = await contract.items(itemId);

  // Determine supply based on item type
  let newSupply;
  if (itemId >= 9 && itemId <= 11) {
    // Single seeds (Basic, Premium, Hybrid) get 60,000 supply
    newSupply = 60000;
  } else {
    // Other items get 50,000 supply
    newSupply = NEW_SUPPLY;
  }

  // Construct the new item struct with updated supply and maxSupply
  const updatedItem = {
    id: itemId,
    name: item.name,
    itemType: item.itemType,
    priceETH: item.priceETH,
    paymentToken: item.paymentToken,
    baseReward: item.baseReward,
    baseGrowthTime: item.baseGrowthTime,
    growthBonusBP: item.growthBonusBP,
    yieldBonusBP: item.yieldBonusBP,
    active: item.active,
    maxSupply: newSupply, // new value
    supply: newSupply     // new value
  };

  // Call updateItem
  const tx = await contract.updateItem(updatedItem, { nonce });
  await tx.wait();
  console.log(`Item ${itemId} (${item.name}) supply and maxSupply updated to ${newSupply}!`);
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  let nonce = await wallet.getTransactionCount("pending");

  // Update bundles
  for (const bundleId of BUNDLE_IDS) {
    await updateBundle(contract, bundleId, nonce);
    nonce++;
  }
  
  // Update single seeds to 60,000 supply
  const SINGLE_SEED_IDS = [9, 10, 11]; // Basic, Premium, Hybrid single seeds
  for (const seedId of SINGLE_SEED_IDS) {
    await updateItem(contract, seedId, nonce);
    nonce++;
  }
  
  // Update Golden Harvester items
  await updateItem(contract, GOLDEN_HARVESTER_SINGLE_ID, nonce);
  nonce++;
  await updateItem(contract, GOLDEN_HARVESTER_BUNDLE_ID, nonce);
}

main().catch(console.error); 
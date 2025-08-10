require('dotenv').config({ path: '.env.rise' });
const { ethers } = require('ethers');
const abi = require('../src/abi/RiseFarming.json');

const CONTRACT_ADDRESS = process.env.VITE_FARMING_ADDRESS; // Rise contract address from env
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RISE_RPC_URL || 'https://testnet.riselabs.xyz';

// RiseFarming balanced supplies × 10 multiplier
// This maintains the exact same economic balance as the original RiseFarming.sol
// Basic: 10,000 bundles × 5 singles = 50,000 consumed, 100,000 - 50,000 = 50,000 remaining
// Premium: 10,000 bundles × 2 singles = 20,000 consumed, 40,000 - 20,000 = 20,000 remaining  
// Hybrid: 5,000 bundles × 2 singles = 10,000 consumed, 20,000 - 10,000 = 10,000 remaining

const BASIC_BUNDLE_SUPPLY = 1000 * 10;     // 10,000 bundles
const PREMIUM_BUNDLE_SUPPLY = 1000 * 10;   // 10,000 bundles  
const HYBRID_BUNDLE_SUPPLY = 500 * 10;     // 5,000 bundles
const GOLDEN_BUNDLE_SUPPLY = 1875 * 10;    // 18,750 bundles (from RiseFarming)

const BASIC_SINGLE_SUPPLY = 10000 * 10;    // 100,000 singles
const PREMIUM_SINGLE_SUPPLY = 4000 * 10;   // 40,000 singles
const HYBRID_SINGLE_SUPPLY = 2000 * 10;    // 20,000 singles
const GOLDEN_SINGLE_SUPPLY = 3750 * 10;    // 37,500 singles

const BUNDLE_IDS = [13, 14, 15, 16]; // Basic, Premium, Hybrid, Golden Harvester Bundle
const GOLDEN_HARVESTER_SINGLE_ID = 17;
const GOLDEN_HARVESTER_BUNDLE_ID = 16;

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

  // Get the correct supply based on bundle ID (maintaining RiseFarming balance)
  let newSupply;
  if (bundleId === 13) newSupply = BASIC_BUNDLE_SUPPLY;        // 10,000
  else if (bundleId === 14) newSupply = PREMIUM_BUNDLE_SUPPLY; // 10,000
  else if (bundleId === 15) newSupply = HYBRID_BUNDLE_SUPPLY;  // 5,000
  else if (bundleId === 16) newSupply = GOLDEN_BUNDLE_SUPPLY;  // 18,750
  else newSupply = 5000; // fallback

  // Construct the new bundle struct with updated supply and maxSupply
  const updatedBundle = {
    id: bundleId,
    name: bundle.name,
    itemIds,
    itemAmounts,
    priceETH: bundle.priceETH,
    paymentToken: bundle.paymentToken,
    active: bundle.active,
    maxSupply: newSupply, // new value
    supply: newSupply     // new value
  };

  // Call updateBundle
  const tx = await contract.updateBundle(updatedBundle, { nonce });
  await tx.wait();
  console.log(`Bundle ${bundleId} (${bundle.name}) supply and maxSupply updated to ${newSupply}!`);
}

async function updateItem(contract, itemId, nonce) {
  // Fetch the current item struct
  const item = await contract.items(itemId);

  // Determine supply based on item ID (maintaining RiseFarming balance × 10)
  let newSupply;
  if (itemId === 9) newSupply = BASIC_SINGLE_SUPPLY;    // 100,000 (Basic)
  else if (itemId === 10) newSupply = PREMIUM_SINGLE_SUPPLY; // 40,000 (Premium)  
  else if (itemId === 11) newSupply = HYBRID_SINGLE_SUPPLY;  // 20,000 (Hybrid)
  else if (itemId === 17) newSupply = GOLDEN_SINGLE_SUPPLY;  // 37,500 (Golden Harvester)
  else newSupply = 50000; // fallback for other items

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
  
  // Update single seeds with RiseFarming balanced supplies × 10
  const SINGLE_SEED_IDS = [9, 10, 11]; // Basic, Premium, Hybrid single seeds
  for (const seedId of SINGLE_SEED_IDS) {
    await updateItem(contract, seedId, nonce);
    nonce++;
  }
  
  // Update Golden Harvester items
  await updateItem(contract, GOLDEN_HARVESTER_SINGLE_ID, nonce);
  nonce++;
}

main().catch(console.error); 
require('dotenv').config({ path: '.env.rise' });
const { ethers } = require('ethers');
const abi = require('../functions/RiseFarmingABI.json').abi;

const CONTRACT_ADDRESS = process.env.VITE_FARMING_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RISE_RPC_URL || process.env.VITE_RISE_RPC_URL;

const BUNDLE_IDS = [13, 14, 15]; // Basic, Premium, Hybrid
const NEW_SUPPLY = 20000;
const GOLDEN_HARVESTER_SINGLE_ID = 17;
const GOLDEN_HARVESTER_BUNDLE_ID = 18;

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
    maxSupply: NEW_SUPPLY, // new value
    supply: NEW_SUPPLY     // new value
  };

  // Call updateItem
  const tx = await contract.updateItem(updatedItem, { nonce });
  await tx.wait();
  console.log(`Item ${itemId} (${item.name}) supply and maxSupply updated to ${NEW_SUPPLY}!`);
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  let nonce = await wallet.getTransactionCount("pending");

  for (const bundleId of BUNDLE_IDS) {
    await updateBundle(contract, bundleId, nonce);
    nonce++;
  }
  await updateItem(contract, GOLDEN_HARVESTER_SINGLE_ID, nonce);
  nonce++;
  await updateItem(contract, GOLDEN_HARVESTER_BUNDLE_ID, nonce);
}

main().catch(console.error); 
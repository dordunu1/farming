require('dotenv').config({ path: '.env.rise' });
const { ethers } = require('ethers');
const abi = require('../functions/RiseFarmingABI.json').abi;

const CONTRACT_ADDRESS = process.env.VITE_FARMING_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RISE_RPC_URL || process.env.VITE_RISE_RPC_URL;

const BUNDLE_IDS = [13, 14, 15]; // Basic, Premium, Hybrid
const NEW_SUPPLY = 2000;

async function updateBundle(contract, bundleId) {
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
  const tx = await contract.updateBundle(updatedBundle);
  await tx.wait();
  console.log(`Bundle ${bundleId} (${bundle.name}) supply and maxSupply updated to ${NEW_SUPPLY}!`);
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  for (const bundleId of BUNDLE_IDS) {
    await updateBundle(contract, bundleId);
  }
}

main().catch(console.error); 
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { ethers } = require('ethers');
const { getAddress } = require('ethers');
admin.initializeApp();

const CONTRACT_ADDRESS = '0x5B3d0F121915e673436bf3180752987543aCDF8d'; // Replace with your actual deployed contract address
const ABI = require('./RiseFarmingABI.json').abi; // Get the ABI array directly
const PRIVATE_KEY = '81c29ddc0405afeaa7922079ec754f5d4bc4f5d209f45c6793d3b125c1f8b686';
const RPC_URL = 'https://testnet.riselabs.xyz';

function convertBigInts(obj) {
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, convertBigInts(v)])
    );
  }
  return obj;
}

exports.cronUpdatePlots = onSchedule({ schedule: 'every 1 minutes' }, async (event) => {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
  const db = admin.firestore();

  function isHexAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  const usersSnap = await db.collection('users').get();
  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    let address = user.walletAddress;
    try {
      address = getAddress(address); // checksums and validates
    } catch (e) {
      console.error('Skipping invalid address:', address);
      continue;
    }
    try {
      // 1. Update plots to ready
      await contract.updatePlotsForUser(address);
      // 2. Wait 5 seconds
      await new Promise(res => setTimeout(res, 5000));
      // 3. Auto-water plots
      await contract.autoWaterPlotsForUser(address);
      // 4. Read on-chain plots
      const plotIds = Array.from({ length: 16 }, (_, i) => i);
      const plots = await contract.getUserPlots(address, plotIds);
      const sanitizedPlots = plots.map((plot, i) => {
        if (Array.isArray(plot)) {
          const [seedId, plantedAt, readyAt, growthBonusBP, yieldBonusBP, growing] = plot;
          return {
            id: i + 1,
            status: growing ? (Date.now() / 1000 >= Number(readyAt) ? 'ready' : 'growing') : 'empty',
            cropType: seedId ? 'Unknown' : '',
            progress: 0,
            timeRemaining: readyAt && plantedAt ? Math.max(0, Math.floor((Number(readyAt) - Date.now() / 1000) / 60)) : undefined,
            plantedAt: Number(plantedAt) || undefined,
            lastWatered: undefined,
            waterLevel: 100,
            quality: 'poor',
            expectedYield: 0,
            txHash: '',
          };
        }
        // If already an object, convert any BigInt fields
        return Object.fromEntries(
          Object.entries(plot).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
        );
      });
      const safePlots = convertBigInts(sanitizedPlots);
      // Log the structure for debugging (after conversion)
      console.log('plots for', address, JSON.stringify(safePlots, null, 2));
      // 5. Update Firestore
      await userDoc.ref.update({ plots: safePlots });
    } catch (err) {
      console.error('Error updating user', address, err);
    }
  }
  return null;
});

exports.authWithWallet = require('firebase-functions').https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const { address, signature } = req.body;
    console.log('Received address:', address);
    if (!address || !signature) {
      console.log('Missing address or signature');
      return res.status(400).json({ error: 'Missing address or signature' });
    }
    const message = 'Sign in to RiceRise';
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      console.log('Signature mismatch');
      return res.status(401).json({ error: 'Signature does not match address' });
    }
    // Log project ID and admin initialization
    console.log('Firebase project ID:', admin.app().options.projectId);
    // Create a Firebase custom token for this wallet address
    let firebaseToken;
    try {
      firebaseToken = await admin.auth().createCustomToken(address);
      console.log('Generated custom token:', firebaseToken);
    } catch (tokenErr) {
      console.error('Error generating custom token:', tokenErr);
      return res.status(500).json({ error: 'Failed to generate custom token' });
    }
    return res.json({ token: firebaseToken });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}); 
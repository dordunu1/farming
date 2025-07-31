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
      // 1. Read on-chain plots
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

exports.verifyPlayer = require('firebase-functions').https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    // Extract address from URL path: /verify-player/{address}
    const address = req.path.split('/').pop();
    
    if (!address) {
      return res.status(400).json({ 
        error: 'Missing wallet address',
        success: false 
      });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format',
        success: false 
      });
    }

    // Always use checksummed address for Firestore queries
    let checksummedAddress;
    try {
      checksummedAddress = getAddress(address);
    } catch (e) {
      return res.status(400).json({ 
        error: 'Invalid Ethereum address',
        success: false 
      });
    }

    // Fetch user document by checksummed address (document ID)
    const db = admin.firestore();
    const userDoc = await db.collection('chains').doc('SOMNIA').collection('users').doc(checksummedAddress).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found',
        success: false 
      });
    }
    const userData = userDoc.data();
    // Use inGameWalletAddress if present, otherwise fallback to address
    const onChainAddress = userData.inGameWalletAddress || checksummedAddress;

    // Connect to Somnia testnet
    const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/somnia_testnet/6e3fd81558cf77b928b06b38e9409b4677b637118114e83364486294d5ff4811');
    const contract = new ethers.Contract('0x260dDaeAF6e47183A9B4778B8C5A793904467D56', ABI, provider);

    // Check on-chain RT balance
    const riceTokens = await contract.riceTokens(onChainAddress);
    const balance = Number(riceTokens);

    // Check if player has earned at least 200 RT
    const hasEarnedEnoughRT = balance >= 200;

    return res.json({
      success: true,
      walletAddress: checksummedAddress,
      inGameWalletAddress: onChainAddress,
      riceTokensBalance: balance,
      hasEarnedEnoughRT: hasEarnedEnoughRT,
      verified: hasEarnedEnoughRT,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

exports.verifyPlayerByEmail = require('firebase-functions').https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    // Extract email from URL path: /verify-player-email/{email}
    const email = req.path.split('/').pop();
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Missing email address',
        success: false 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        success: false 
      });
    }

    // Look up wallet address by email in /emailToWallet/{email}
    const db = admin.firestore();
    const emailDoc = await db.collection('emailToWallet').doc(email).get();
    if (!emailDoc.exists) {
      return res.status(404).json({ 
        error: 'Email not found in our system',
        success: false 
      });
    }
    let walletAddress = emailDoc.data().walletAddress;
    if (!walletAddress) {
      return res.status(404).json({ 
        error: 'No wallet address found for this email',
        success: false 
      });
    }
    // Always use checksummed address for Firestore queries
    try {
      walletAddress = getAddress(walletAddress);
    } catch (e) {
      return res.status(400).json({ 
        error: 'Invalid Ethereum address for this email',
        success: false 
      });
    }
    // Fetch user document by checksummed wallet address
    const userDoc = await db.collection('chains').doc('SOMNIA').collection('users').doc(walletAddress).get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'No user found for this wallet address',
        success: false 
      });
    }
    const userData = userDoc.data();
    // Always use inGameWalletAddress for on-chain check
    const inGameWallet = userData.inGameWalletAddress;
    if (!inGameWallet) {
      return res.status(404).json({ 
        error: 'No in-game wallet address found for this email',
        success: false 
      });
    }
    // Connect to Somnia testnet
    const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/somnia_testnet/6e3fd81558cf77b928b06b38e9409b4677b637118114e83364486294d5ff4811');
    const contract = new ethers.Contract('0x260dDaeAF6e47183A9B4778B8C5A793904467D56', ABI, provider);
    // Check on-chain RT balance
    const riceTokens = await contract.riceTokens(inGameWallet);
    const balance = Number(riceTokens);
    // Check if player has earned at least 200 RT
    const hasEarnedEnoughRT = balance >= 200;
    return res.json({
      success: true,
      email: email,
      walletAddress: walletAddress,
      inGameWalletAddress: inGameWallet,
      riceTokensBalance: balance,
      hasEarnedEnoughRT: hasEarnedEnoughRT,
      verified: hasEarnedEnoughRT,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
}); 
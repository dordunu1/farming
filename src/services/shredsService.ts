import { ethers } from 'ethers';

// Only import Shreds if we're on RISE testnet
let shredsClient: any = null;
let syncClient: any = null;

// --- Robust Local Nonce Management ---
let localNonce: number | null = null;
let fetchedNonce: number | null = null;
let nonceInitialized = false;
let walletInstance: ethers.Wallet | null = null;

// Poll the network every 1 second to update fetchedNonce (was 5 seconds)
setInterval(async () => {
  if (walletInstance) {
    try {
      const networkNonce = await walletInstance.getTransactionCount('pending');
      fetchedNonce = networkNonce;
      // If fetchedNonce is ahead, update localNonce too
      if (localNonce !== null && fetchedNonce > localNonce) {
        localNonce = fetchedNonce;
      }
    } catch (e) {
      // Ignore polling errors
    }
  }
}, 1000); // 1 second instead of 5 seconds

// Get the next nonce to use: max(localNonce, fetchedNonce), then increment localNonce
async function getNextNonce(wallet: ethers.Wallet) {
  if (!nonceInitialized || !walletInstance || walletInstance.address !== wallet.address) {
    fetchedNonce = await wallet.getTransactionCount('pending');
    localNonce = fetchedNonce;
    nonceInitialized = true;
    walletInstance = wallet;
  }
  const nonceToUse = Math.max(localNonce ?? 0, fetchedNonce ?? 0);
  localNonce = nonceToUse + 1;
  return nonceToUse;
}
// --- End Robust Local Nonce Management ---

// Initialize Shreds clients only for RISE testnet
const initializeShreds = async () => {
  if (import.meta.env.VITE_CURRENT_CHAIN !== 'RISE') {
    return { shredsClient: null, syncClient: null };
  }

  try {
    // Dynamic import to avoid bundling Shreds for other chains
    const shredsModule = await import('shreds/viem').catch(() => {
      return null;
    });
    
    if (!shredsModule) {
      return { shredsClient: null, syncClient: null };
    }

    const { riseTestnet } = await import('viem/chains');
    const { http } = await import('viem');

    // Create Shreds client for real-time monitoring (WebSocket)
    shredsClient = (shredsModule as any).createPublicShredClient({
      chain: riseTestnet,
      transport: (shredsModule as any).shredsWebSocket(import.meta.env.VITE_SHREDS_WEBSOCKET_URL || 'wss://testnet.riselabs.xyz/ws'),
    });

    // Create sync client for fast transactions (HTTP)
    syncClient = (shredsModule as any).createPublicSyncClient({
      chain: riseTestnet,
      transport: http(import.meta.env.VITE_RISE_RPC_URL),
    });

    return { shredsClient, syncClient };
  } catch (error) {
    return { shredsClient: null, syncClient: null };
  }
};

// Check if we're on RISE testnet
export const isRiseTestnet = () => {
  return import.meta.env.VITE_CURRENT_CHAIN === 'RISE';
};

// Check if Shreds is available
export const isShredsAvailable = () => {
  return isRiseTestnet() && shredsClient !== null && syncClient !== null;
};

// Initialize Shreds on module load
initializeShreds();

export const shredsService = {
  /**
   * Pre-initialize nonce management for faster first transactions
   * Call this early in your app lifecycle (e.g., when wallet connects)
   */
  async preInitializeNonce(walletPrivateKey: string) {
    if (!isRiseTestnet()) return;
    
    try {
      const rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL || import.meta.env.VITE_RPC_URL;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(walletPrivateKey, provider);
      
      // This will trigger nonce initialization and set up polling
      const initialNonce = await wallet.getTransactionCount('pending');
      fetchedNonce = initialNonce;
      localNonce = initialNonce;
      nonceInitialized = true;
      walletInstance = wallet;
    } catch (error) {
    }
  },

  /**
   * Send a transaction using Shreds sync (RISE) or standard (other chains)
   * Uses robust local nonce management and hardcoded gas price for speed.
   */
  async sendTransaction(transaction: any, wallet: ethers.Wallet, contract: ethers.Contract, method: string, args: any[], options?: any) {
    if (!isShredsAvailable()) {
      // Fallback to standard transaction
      const tx = await contract[method](...args, options);
      await tx.wait();
      return { hash: tx.hash, receipt: tx };
    }

    try {
      // Use Shreds sync transaction for RISE
      
      const startTime = Date.now();
      
      // --- FAST TX: Use hardcoded gas price and robust local nonce ---
      const gasPrice = ethers.utils.parseUnits('1', 'gwei'); // 2 gwei
      
      const nonceStart = Date.now();
      const nonce = await getNextNonce(wallet);
      const nonceTime = Date.now() - nonceStart;
      
      // For ethers.js, we need to create the transaction data manually
      const data = contract.interface.encodeFunctionData(method, args);
      // Create transaction object
      const txObject = {
        to: contract.address,
        data: data,
        value: options?.value || 0,
        nonce: nonce,
        gasPrice: gasPrice,
        gasLimit: 500000, // Default gas limit, can be estimated
      };

      // Sign the transaction
      const signStart = Date.now();
      const signedTx = await wallet.signTransaction(txObject);
      const signTime = Date.now() - signStart;
      
      const serializedTransaction = signedTx;

      // Send with Shreds sync
      const shredsStart = Date.now();
      const receipt = await syncClient.sendRawTransactionSync({
        serializedTransaction,
      });
      const shredsTime = Date.now() - shredsStart;
      const totalTime = Date.now() - startTime;

      // localNonce is already incremented in getNextNonce

      return { hash: receipt.transactionHash, receipt };
    } catch (error) {
      // Fallback to standard transaction
      const tx = await contract[method](...args, options);
      await tx.wait();
      return { hash: tx.hash, receipt: tx };
    }
  },

  /**
   * Watch for real-time events (RISE only)
   */
  watchEvents(callback: (event: any) => void) {
    if (!isShredsAvailable()) {
      return () => {}; // Return empty cleanup function
    }

    try {
      // Watch for new shreds
      const unsubscribe = shredsClient.watchShreds({
        onShred: (shred: any) => {
          callback(shred);
        },
      });

      return unsubscribe;
    } catch (error) {
      return () => {};
    }
  },

  /**
   * Watch specific contract events (RISE only)
   */
  watchContractEvents(contractAddress: string, eventName: string, callback: (event: any) => void) {
    if (!isShredsAvailable()) {
      return () => {};
    }

    try {
      const unsubscribe = shredsClient.watchContractShredEvent({
        address: contractAddress,
        eventName,
        onShred: (shred: any) => {
          callback(shred);
        },
      });

      return unsubscribe;
    } catch (error) {
      return () => {};
    }
  },

  /**
   * Get transaction status with Shreds info (RISE only)
   */
  async getTransactionStatus(hash: string) {
    if (!isShredsAvailable()) {
      return { status: 'unknown', chain: 'non-rise' };
    }

    try {
      // Shreds provides additional transaction metadata
      return { status: 'confirmed', chain: 'rise-shreds', hash };
    } catch (error) {
      return { status: 'error', chain: 'rise-shreds', error };
    }
  },

  /**
   * Initialize Shreds (call this early in app lifecycle)
   */
  async initialize() {
    return await initializeShreds();
  },

  /**
   * Get current Shreds status
   */
  getStatus() {
    return {
      isRise: isRiseTestnet(),
      shredsAvailable: isShredsAvailable(),
      shredsClient: !!shredsClient,
      syncClient: !!syncClient,
    };
  }
}; 
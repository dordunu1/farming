import { ethers } from 'ethers';
import { EncryptionService } from './encryptionService';

// App's unique identifier - NEVER changes
const APP_SEED = 'rise-farming-v1';

// Add window type declaration
declare global {
  interface Window {
    somnia?: any;
    rise?: any;
  }
}

interface WalletInfo {
  address: string;
  privateKey: string;
  mnemonic: string;
}

interface StoredWallet {
  username: string;
  wallet: WalletInfo;
}

interface StoredSignature {
  username: string;
  signature: string;
  timestamp: number;
}

interface WalletDB extends IDBDatabase {
  transaction(
    storeNames: string | string[],
    mode?: IDBTransactionMode
  ): WalletTransaction;
}

interface WalletTransaction extends IDBTransaction {
  objectStore(name: string): WalletStore | SignatureStore;
}

interface WalletStore extends IDBObjectStore {
  get(key: string): IDBRequest<{ wallet: WalletInfo; timestamp: number } | undefined>;
  put(value: { username: string; wallet: WalletInfo; timestamp: number }): IDBRequest<IDBValidKey>;
}

interface SignatureStore extends IDBObjectStore {
  get(key: string): IDBRequest<{ signature: string; timestamp: number } | undefined>;
  put(value: StoredSignature): IDBRequest<IDBValidKey>;
}

/**
 * Main wallet service for managing game wallets
 */
export const walletService = {
  /**
   * Gets available wallets
   */
  async getAvailableWallets() {
    return {
      somnia: !!window.somnia,
      rise: !!window.rise
    };
  },

  /**
   * Stores the authentication signature securely for wallet regeneration
   */
  async storeSignature(username: string, signature: string): Promise<void> {
    try {
      // Store in localStorage with encryption
      const signatureData: StoredSignature = {
        username,
        signature,
        timestamp: Date.now()
      };
      
      const encryptedSignature = await EncryptionService.encrypt(JSON.stringify(signatureData));
      localStorage.setItem(`signature_${username}`, encryptedSignature);
      
      // Also store in IndexedDB for redundancy
      const db = await this.openDB() as WalletDB;
      const tx = db.transaction('signatures', 'readwrite');
      const store = tx.objectStore('signatures') as SignatureStore;
      await store.put(signatureData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retrieves the stored signature for wallet regeneration
   */
  async getStoredSignature(username: string): Promise<string | null> {
    try {
      // Try localStorage first
      const encryptedSignature = localStorage.getItem(`signature_${username}`);
      if (encryptedSignature) {
        const decryptedSignature = await EncryptionService.decrypt(encryptedSignature);
        const signatureData = JSON.parse(decryptedSignature) as StoredSignature;
        return signatureData.signature;
      }
      
      // Try IndexedDB as fallback
      const db = await this.openDB() as WalletDB;
      const tx = db.transaction('signatures', 'readonly');
      const store = tx.objectStore('signatures') as SignatureStore;
      
      return new Promise<string | null>((resolve) => {
        const request = store.get(username);
        request.onsuccess = () => {
          if (request.result?.signature) {
            resolve(request.result.signature);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (error) {
      return null;
    }
  },

  /**
   * Generates or retrieves persistent wallet based on external wallet signature
   */
  async getPersistentWallet(externalSignature: string) {
    try {
      // Use the signature directly as the seed for deterministic wallet generation
      const signatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(externalSignature));
      
      const wallet = ethers.Wallet.fromMnemonic(
        ethers.utils.entropyToMnemonic(ethers.utils.arrayify(signatureHash))
      );

      const walletInfo = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase
      };

      return walletInfo;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Stores wallet info in localStorage with encryption
   */
  async storeWalletInfo(username: string, walletInfo: WalletInfo): Promise<void> {
    try {
      const storedWallet: StoredWallet = {
        username,
        wallet: walletInfo
      };
      
      const encryptedData = await EncryptionService.encrypt(JSON.stringify(storedWallet));
      localStorage.setItem(`wallet_${username}`, encryptedData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Retrieves wallet info from localStorage with decryption
   * If not found, tries to regenerate from stored signature
   */
  async getWalletInfo(username: string): Promise<WalletInfo | null> {
    try {
      // Try to get stored wallet first
      const encryptedData = localStorage.getItem(`wallet_${username}`);
      if (encryptedData) {
        const decryptedData = await EncryptionService.decrypt(encryptedData);
        const parsed = JSON.parse(decryptedData) as StoredWallet;
        return parsed.wallet;
      }
      
      // If no stored wallet, try to regenerate from signature
      const signature = await this.getStoredSignature(username);
      
      if (signature) {
        const regeneratedWallet = await this.getPersistentWallet(signature);
        
        // Store the regenerated wallet for future use
        await this.storeWalletInfo(username, regeneratedWallet);
        
        return regeneratedWallet;
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Signs game transaction with persistent wallet
   */
  async signTransaction(transaction: any, username: string) {
    try {
      const walletInfo = await this.getWalletInfo(username);
      if (!walletInfo) {
        throw new Error('No wallet found for user');
      }

      const wallet = new ethers.Wallet(walletInfo.privateKey);
      return wallet.signTransaction(transaction);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Gets wallet for a username - always returns the same wallet
   */
  async getWalletForUser(username: string) {
    try {
      // Try to get stored wallet first
      const storedWallet = await this.getStoredWallet(username);
      if (storedWallet) {
        return storedWallet;
      }

      // If no stored wallet, try to regenerate from signature
      const signature = await this.getStoredSignature(username);
      if (signature) {
        const wallet = await this.getPersistentWallet(signature);
        await this.storeWallet(username, wallet);
        return wallet;
      }

      throw new Error('No signature found to generate wallet');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Stores wallet in IndexedDB with encryption
   */
  async storeWallet(username: string, walletInfo: any) {
    try {
      const db = await this.openDB() as WalletDB;
      const tx = db.transaction('wallets', 'readwrite');
      const store = tx.objectStore('wallets') as WalletStore;
      
      await store.put({
        username,
        wallet: walletInfo,
        timestamp: Date.now()
      });
    } catch (error) {
    }
  },

  /**
   * Gets stored wallet from IndexedDB with decryption
   */
  async getStoredWallet(username: string) {
    try {
      const db = await this.openDB() as WalletDB;
      const tx = db.transaction('wallets', 'readonly');
      const store = tx.objectStore('wallets') as WalletStore;
      
      return new Promise<WalletInfo | null>(async (resolve) => {
        const request = store.get(username);
        request.onsuccess = async () => {
          if (request.result?.wallet) {
            const wallet = request.result.wallet;
            wallet.privateKey = await EncryptionService.decrypt(wallet.privateKey);
            wallet.mnemonic = await EncryptionService.decrypt(wallet.mnemonic);
            resolve(wallet);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (error) {
      return null;
    }
  },

  /**
   * Initializes IndexedDB with both wallets and signatures stores
   */
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('GameWallets', 2); // Increment version for new store
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create wallets store
        if (!db.objectStoreNames.contains('wallets')) {
          db.createObjectStore('wallets', { keyPath: 'username' });
        }
        
        // Create signatures store
        if (!db.objectStoreNames.contains('signatures')) {
          db.createObjectStore('signatures', { keyPath: 'username' });
        }
      };
    });
  },

  /**
   * Clears wallet data on logout
   */
  async clearWalletData(username: string) {
    try {
      // Clear localStorage
      localStorage.removeItem(`wallet_${username}`);
      localStorage.removeItem(`signature_${username}`);
      
      // Clear IndexedDB
      const db = await this.openDB() as WalletDB;
      
      // Clear wallets
      const walletTx = db.transaction('wallets', 'readwrite');
      const walletStore = walletTx.objectStore('wallets') as WalletStore;
      await walletStore.delete(username);
      
      // Clear signatures
      const signatureTx = db.transaction('signatures', 'readwrite');
      const signatureStore = signatureTx.objectStore('signatures') as SignatureStore;
      await signatureStore.delete(username);
    } catch (error) {
    }
  }
}; 
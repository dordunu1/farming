import { useState, useEffect } from 'react';
import { walletService } from '../services/walletService';

interface WalletInfo {
  address: string;
  privateKey: string;
  mnemonic: string;
}

/**
 * React hook for wallet integration
 * Provides wallet state and operations to components
 * If username is provided, automatically loads the wallet from storage
 */
export function useWallet(username?: string) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-load wallet from storage if username is provided
  useEffect(() => {
    if (username) {
      setIsLoading(true);
      walletService.getWalletInfo(username)
        .then((storedWallet) => {
          if (storedWallet) {
            setWallet(storedWallet);
          } else {
            setWallet(null);
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to get stored wallet');
          setWallet(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, [username]);

  // Initialize game wallet using the auth signature
  const initGameWallet = async (authSignature: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate persistent wallet using the auth signature
      const persistentWallet = await walletService.getPersistentWallet(authSignature);
      
      setWallet(persistentWallet);
      return persistentWallet;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
      setWallet(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get stored wallet info
  const getStoredWallet = async (username: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storedWallet = await walletService.getWalletInfo(username);
      if (storedWallet) {
        setWallet(storedWallet);
      } else {
        setWallet(null);
      }
      
      return storedWallet;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get stored wallet');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Store wallet info
  const storeWallet = async (username: string, walletInfo: WalletInfo) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await walletService.storeWalletInfo(username, walletInfo);
      setWallet(walletInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear wallet data
  const clearWallet = async (username: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await walletService.clearWalletData(username);
      setWallet(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh wallet (useful after cache clearing)
  const refreshWallet = async (username: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const refreshedWallet = await walletService.getWalletForUser(username);
      if (refreshedWallet) {
        setWallet(refreshedWallet);
      } else {
        setWallet(null);
      }
      
      return refreshedWallet;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh wallet');
      setWallet(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    wallet,
    error,
    isLoading,
    initGameWallet,
    getStoredWallet,
    storeWallet,
    clearWallet,
    refreshWallet
  };
} 
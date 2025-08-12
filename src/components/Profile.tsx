import React from 'react';
import { User, Star, Coins, Trophy, CheckCircle, Wallet, X, Loader2, LogOut, Fuel, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
// @ts-ignore
import { useContractRead } from 'wagmi';
import { getUserData, setUserEmail } from '../lib/firebaseUser';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useWallet } from '../hooks/useWallet';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ReactDOM from 'react-dom';
import { shredsService, isRiseTestnet } from '../services/shredsService';

interface ProfileProps {
  isWalletConnected: boolean;
  walletAddress?: string;
}

// @ts-ignore TODO: Replace with actual ABI import after deployment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RiseFarmingABI from '../abi/RiseFarming.json'; // You will add this file after deployment

export default function Profile({ 
  isWalletConnected, 
  walletAddress
}: ProfileProps) {
  const { address } = useAccount();
  // In-game wallet integration (move this up)
  const { wallet: gameWallet, isLoading: walletLoading, error: walletError, refreshWallet } = useWallet(address || undefined);
  const [userStats, setUserStats] = React.useState<any>(null);
  const [farmValue, setFarmValue] = React.useState(0);
  const [questValue, setQuestValue] = React.useState(0);
  const [onChainRT, setOnChainRT] = React.useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  // Set currency symbol as a constant based on environment
  let currencySymbol = 'ETH';
  if (import.meta.env.VITE_CURRENT_CHAIN === 'SOMNIA') {
    currencySymbol = import.meta.env.VITE_CURRENCY_SYMBOL || 'STT';
  } else if (import.meta.env.VITE_CURRENT_CHAIN === 'NEXUS') {
    currencySymbol = import.meta.env.VITE_NEXUS_CURRENCY_SYMBOL || 'NEX';
  } else if (import.meta.env.VITE_CURRENT_CHAIN === 'PHAROS') {
    currencySymbol = import.meta.env.VITE_PHAROS_CURRENCY_SYMBOL || 'PHRS';
  } else if (import.meta.env.VITE_CURRENT_CHAIN === 'FLUENT') {
    currencySymbol = import.meta.env.VITE_FLUENT_CURRENCY_SYMBOL || 'ETH';
  } else {
    currencySymbol = import.meta.env.VITE_RISE_CURRENCY_SYMBOL || 'ETH';
  }
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [rtSubmission, setRtSubmission] = useState(201);

  // Fetch on-chain RT balance
  const { data: onChainRiceTokens, refetch: refetchRiceTokens } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI,
    functionName: 'riceTokens',
    args: gameWallet?.address ? [gameWallet.address] : undefined,
  });

  // Claim RISE ERC20
  const claimRiseTokens = useWriteContract();
  React.useEffect(() => {
    if (onChainRiceTokens) {
      setOnChainRT(Number(onChainRiceTokens).toLocaleString());
    }
  }, [onChainRiceTokens]);

  React.useEffect(() => {
    if (isWalletConnected && address) {
      getUserData(address).then(data => setUserStats(data));
    } else {
      setUserStats(null);
    }
  }, [isWalletConnected, address]);

  // Calculate farm value and quest/streak value from recentActivity
  React.useEffect(() => {
    if (!userStats || !userStats.recentActivity) return;
    let farm = 0;
    let quest = 0;
    userStats.recentActivity.forEach((a: any) => {
      if (a.type === 'harvest' && typeof a.amount === 'number') farm += a.amount;
      if ((a.type === 'quest' || a.type === 'streak') && typeof a.amount === 'number') quest += a.amount;
    });
    setFarmValue(farm);
    setQuestValue(quest);
  }, [userStats]);

  // Fetch on-chain numHarvested (totalHarvests)
  const { data: onChainNumHarvested } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI,
    functionName: 'totalHarvests',
    args: gameWallet?.address ? [gameWallet.address] : undefined,
  });

  // Use on-chain value for display
  const harvestedCount = Number(onChainNumHarvested || 0);

  // Fallback for planted seeds
  let plantedCount = userStats?.numPlanted;
  if ((!plantedCount || plantedCount === 0) && userStats?.plots) {
    plantedCount = userStats.plots.filter((p: any) => p.status !== 'empty').length;
  }
  // Fallback for watered
  let wateredCount = userStats?.numWatered;
  if ((!wateredCount || wateredCount === 0) && userStats?.plots) {
    wateredCount = userStats.plots.filter((p: any) => p.waterLevel > 0).length;
  }

  // Calculate integer RT for claim logic
  const rtInt = Number(onChainRiceTokens || 0);

  // Determine chain and set RPC URL
  useEffect(() => {
    let rpcUrl = '';
    if (import.meta.env.VITE_CURRENT_CHAIN === 'SOMNIA') {
      rpcUrl = import.meta.env.VITE_RPC_URL || import.meta.env.SOMNIA_RPC_URL;
    } else if (import.meta.env.VITE_CURRENT_CHAIN === 'NEXUS') {
      rpcUrl = import.meta.env.VITE_NEXUS_RPC_URL || import.meta.env.NEXUS_RPC_URL;
    } else if (import.meta.env.VITE_CURRENT_CHAIN === 'PHAROS') {
      rpcUrl = import.meta.env.VITE_PHAROS_RPC_URL || import.meta.env.PHAROS_RPC_URL;
    } else if (import.meta.env.VITE_CURRENT_CHAIN === 'FLUENT') {
      rpcUrl = import.meta.env.VITE_FLUENT_RPC_URL || import.meta.env.FLUENT_RPC_URL;
    } else {
      rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL;
    }

    async function fetchBalance() {
      if (gameWallet?.address && rpcUrl) {
        try {
          const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          const bal = await provider.getBalance(gameWallet.address);
          setBalance(ethers.utils.formatEther(bal));
        } catch (e) {
          setBalance(null);
        }
      }
    }
    fetchBalance();
  }, [gameWallet?.address]);

  // Handle wallet refresh when needed (e.g., after cache clearing)
  const handleRefreshWallet = async () => {
    if (address) {
      console.log('🔄 Refreshing wallet for user:', address);
      await refreshWallet(address);
    }
  };

  // Handle RT submission for verification
  const handleRTSubmission = async () => {
    if (!gameWallet?.address || !address) {
      setSubmitError('Wallet not available');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Store the RT balance in the user's riceTokens field
      const userRef = doc(db, 'chains', 'SOMNIA', 'users', address);
      await setDoc(userRef, {
        riceTokens: rtSubmission,
        rtSubmissionTimestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      setSubmitSuccess(true);
      // Optionally refresh user stats
      if (address) {
        getUserData(address).then(data => setUserStats(data));
      }
    } catch (err: any) {
      console.error('RT submission error:', err);
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Modal component
  function WalletModal() {
    const [copied, setCopied] = useState(false);
    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowWalletModal(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowWalletModal(false)}>
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-6 h-6 text-emerald-600" />
            <span className="font-semibold text-emerald-800 text-lg">In-Game Wallet</span>
          </div>
          {walletLoading ? (
            <div className="text-gray-500 text-sm">Loading wallet...</div>
          ) : walletError ? (
            <div className="text-red-600 text-sm">{walletError}</div>
          ) : gameWallet ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{gameWallet.address}</span>
                <button
                  className="text-xs text-emerald-700 underline"
                  onClick={() => {
                    navigator.clipboard.writeText(gameWallet.address);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="text-xs text-gray-600 mb-2">{currencySymbol} Balance: {balance !== null ? `${Number(balance).toFixed(4)} ${currencySymbol}` : '...'}</div>
              {/* Faucet link for testnets */}
              {import.meta.env.VITE_CURRENT_CHAIN === 'RISE' && (
                <div className="mb-2 flex items-center gap-2">
                  <a
                    href="https://faucet.testnet.riselabs.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 text-xs bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 text-emerald-700 font-semibold transition"
                    style={{ textDecoration: 'none' }}
                  >
                    <Fuel className="w-4 h-4 mr-1 text-emerald-600" />
                    Get Test ETH from Faucet
                  </a>
                </div>
              )}
              {import.meta.env.VITE_CURRENT_CHAIN === 'NEXUS' && (
                <div className="mb-2 flex items-center gap-2">
                  <a
                    href="https://faucets.alchemy.com/faucets/nexus-testnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 text-xs bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 text-emerald-700 font-semibold transition"
                    style={{ textDecoration: 'none' }}
                  >
                    <Fuel className="w-4 h-4 mr-1 text-emerald-600" />
                    Get Test NEX from Faucet
                  </a>
                </div>
              )}
              {import.meta.env.VITE_CURRENT_CHAIN === 'PHAROS' && (
                <div className="mb-2 flex items-center gap-2">
                  <a
                    href="https://testnet.pharosnetwork.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 text-xs bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 text-emerald-700 font-semibold transition"
                    style={{ textDecoration: 'none' }}
                  >
                    <Fuel className="w-4 h-4 mr-1 text-emerald-600" />
                    Get Test ETH from Faucet
                  </a>
                </div>
              )}
              {import.meta.env.VITE_CURRENT_CHAIN === 'FLUENT' && (
                <div className="mb-2 flex items-center gap-2">
                  <a
                    href="https://testnet.gblend.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 text-xs bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 text-emerald-700 font-semibold transition"
                    style={{ textDecoration: 'none' }}
                  >
                    <Fuel className="w-4 h-4 mr-1 text-emerald-600" />
                    Get Test ETH from Faucet
                  </a>
                </div>
              )}
              <button
                className="text-xs text-yellow-700 underline mb-2"
                onClick={() => setShowSensitive(v => !v)}
              >
                {showSensitive ? 'Hide' : 'Reveal'} Private Key & Mnemonic
              </button>
              {showSensitive && (
                <div className="bg-yellow-100 border border-yellow-300 rounded p-2 text-xs text-yellow-900 mb-2">
                  <div><strong>Private Key:</strong> <span className="font-mono break-all">{gameWallet.privateKey}</span></div>
                  <div className="mt-1"><strong>Mnemonic:</strong> <span className="font-mono break-all">{gameWallet.mnemonic}</span></div>
                  <div className="mt-2 text-yellow-800 font-bold">Warning: Never share your private key or mnemonic with anyone!</div>
                </div>
              )}
              <div className="text-xs text-emerald-700 mt-2">
                This is your <strong>in-game wallet</strong>. It is used for all in-game transactions. Keep your backup safe!
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-gray-500 text-sm mb-3">No in-game wallet found.</div>
              <button
                onClick={handleRefreshWallet}
                disabled={walletLoading}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                {walletLoading ? 'Refreshing...' : 'Refresh Wallet'}
              </button>
              <div className="text-xs text-gray-500 mt-2">
                This will regenerate your wallet from your stored signature.
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

  // RT Submission Modal
  function RTSubmissionModal() {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSubmitModal(false)}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowSubmitModal(false)}>
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-6 h-6 text-yellow-600" />
            <span className="font-semibold text-gray-800 text-lg">Submit RT Balance for Verification</span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Since you have used up all your energy and can't progress, submit your RT balance to verify on the quest. This will be stored and used as a fallback verification method.
            </p>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your RT Balance
              </label>
              <input
                type="number"
                value={rtSubmission}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                placeholder="201 RT"
                min="1"
              />
            </div>

            <div className="text-xs text-gray-500 mb-4">
              <p>• This will be stored in your profile for verification</p>
              <p>• Your on-chain balance: {onChainRT ?? '...'} RT</p>
              <p>• Current requirement: 200 RT minimum</p>
              <p>• Submission value: 201 RT (above requirement)</p>
              <p>• After submission, you can verify on the quest</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
              onClick={() => setShowSubmitModal(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
              onClick={handleRTSubmission}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>
          </div>

          {submitSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">RT balance submitted successfully!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Your RT balance ({rtSubmission} RT) has been stored in your profile. You can now try verifying using the verification system.
              </p>
            </div>
          )}

          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-700 text-sm">
                <div className="font-medium">Submission Error:</div>
                <div>{submitError}</div>
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

  // Helper to clear only app-specific keys from localStorage and IndexedDB
  const clearAppCache = async () => {
    // Remove app-specific keys from localStorage
    const keysToRemove = [
      'wallet_signature',
      'inGameWallet',
      'firebase:authUser',
      'firebase:authUser:currentUser',
      'hasShownWalletFundingToast',
      // Add any other keys your app uses for session/wallet
    ];
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));

    // Optionally clear app-specific IndexedDB databases
    if ('indexedDB' in window) {
      const dbs = await window.indexedDB.databases?.();
      if (dbs) {
        for (const db of dbs) {
          if (db.name && (db.name.startsWith('firebase') || db.name.startsWith('wallet'))) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      }
    }
  };

  // Prefill email if already set
  useEffect(() => {
    if (userStats && userStats.email) {
      setEmail(userStats.email);
      setEmailSaved(true);
    }
  }, [userStats]);

  // Helper to map email to wallet address
  async function setEmailToWalletMapping(email: string, walletAddress: string) {
    await setDoc(doc(db, 'emailToWallet', email), { walletAddress });
  }

  if (!isWalletConnected || !address) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Player Profile</h2>
        <p className="text-gray-500 mb-4">Connect your wallet to view your profile and stats.</p>
        <div className="rounded-lg p-4 bg-red-50 border border-red-200 flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="font-semibold text-gray-800">Wallet Disconnected</span>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Player Profile</h2>
        <p className="text-gray-500 mb-4">Loading your stats...</p>
      </div>
    );
  }

  // Use 300 as the XP cap for progress bar and next level
  const xpForNextLevel = 300;
  const currentLevelXP = userStats.totalXP;
  const progressPercentage = (currentLevelXP / 300) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto text-center relative" style={{ marginTop: '12px' }}>
      {/* Logout button in top left */}
      <button
        className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-red-700 transition flex items-center gap-1"
        onClick={async () => {
          await clearAppCache();
          window.AppKit?.disconnect?.();
          window.location.reload();
        }}
      >
        <LogOut className="w-4 h-4 mr-1" /> Logout
      </button>
      <div className="text-center mb-3 mt-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 overflow-hidden border-4 border-emerald-200 shadow bg-white/60 backdrop-blur">
          <img
            src={userStats.pfp || `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`}
            alt="Avatar"
            className="w-16 h-16 object-cover"
          />
        </div>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Player Profile</h2>
        <p className="text-xs text-gray-600 mt-1 font-mono">
          {gameWallet?.address
            ? `${gameWallet.address.slice(0, 6)}...${gameWallet.address.slice(-4)}`
            : 'Loading...'}
        </p>
        <div className="flex justify-center mt-1">
          {walletLoading ? (
            <div className="flex items-center gap-1 bg-gray-100 text-gray-600 font-semibold rounded-full px-2 py-1 text-xs">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Loading Wallet...
            </div>
          ) : gameWallet ? (
            <button
              className="flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold rounded-full px-2 py-1 text-xs shadow border border-emerald-200"
              style={{ fontSize: '11px' }}
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet className="w-4 h-4" />
              View In-Game Wallet
            </button>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <button
                className="flex items-center gap-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold rounded-full px-2 py-1 text-xs shadow border border-yellow-200"
                style={{ fontSize: '11px' }}
                onClick={handleRefreshWallet}
                disabled={walletLoading}
              >
                <Wallet className="w-4 h-4" />
                {walletLoading ? 'Refreshing...' : 'Refresh In-Game Wallet'}
              </button>
              <div className="text-xs text-gray-500 text-center">
                Wallet not found. Click to regenerate from your signature.
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <div className="bg-purple-50/70 backdrop-blur rounded-xl p-3 flex flex-col gap-1 border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">Level {userStats.playerLevel}</span>
            </div>
            <span className="text-xs text-gray-600">{userStats.totalXP} XP</span>
          </div>
          <div className="w-full bg-gray-200/60 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {currentLevelXP}/300 XP to next level
          </p>
        </div>
        <div className="bg-yellow-50/70 backdrop-blur rounded-xl p-3 flex flex-col gap-1 border border-yellow-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-gray-800">Rice Tokens</span>
              </div>
              <span className="text-xs text-gray-600">On-chain RT balance</span>
              <span className="text-xs text-gray-600">Farm Value: {farmValue}</span>
              <span className="text-xs text-gray-600">Quests/Streaks: {questValue}</span>
            </div>
            <span className="text-xl font-bold text-yellow-600 drop-shadow-sm">{onChainRT ?? '...'}</span>
          </div>
          
          {rtInt >= 500 ? (
            <>
              <button
                className="mt-3 w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-2 rounded-lg font-semibold hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow flex items-center justify-center gap-2"
                onClick={async () => {
                  if (!gameWallet) {
                    setClaimError('In-game wallet not loaded');
                    return;
                  }
                  setClaiming(true);
                  setClaimSuccess(false);
                  setClaimError('');
                  setClaimTxHash(null);
                  try {
                    console.log('🌾 Starting claim process...');
                    console.log('In-game wallet address:', gameWallet.address);
                    console.log('On-chain RT balance:', Number(onChainRiceTokens || 0));
                    
                    const rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL || import.meta.env.VITE_RPC_URL;
                    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
                    const wallet = new ethers.Wallet(gameWallet.privateKey, provider);
                    const contract = new ethers.Contract(import.meta.env.VITE_FARMING_ADDRESS, RiseFarmingABI, wallet);
                    let txHash = null;
                    
                    if (isRiseTestnet()) {
                      console.log('🚀 Using Shreds for RISE claim...');
                      const overrides = { gasPrice: ethers.utils.parseUnits('1', 'gwei') };
                      const result = await shredsService.sendTransaction(
                        null,
                        wallet,
                        contract,
                        'claimRiseTokens',
                        [],
                        overrides
                      );
                      txHash = result?.hash;
                      console.log('✅ Shreds claim successful, tx hash:', txHash);
                    } else {
                      console.log('🔗 Using standard ethers for claim...');
                      const tx = await contract.claimRiseTokens();
                      txHash = tx.hash;
                      await tx.wait();
                      console.log('✅ Standard claim successful, tx hash:', txHash);
                    }
                    
                    setClaimTxHash(txHash);
                    setClaimSuccess(true);
                    
                    // Refresh RT balance after successful claim
                    console.log('🔄 Refreshing RT balance...');
                    await refetchRiceTokens();
                    
                  } catch (err: any) {
                    console.error('❌ Claim failed:', err);
                    console.error('Error details:', {
                      message: err?.message,
                      reason: err?.reason,
                      code: err?.code,
                      data: err?.data,
                      transaction: err?.transaction
                    });
                    
                    // Show detailed error message
                    let errorMsg = 'Claim failed';
                    if (err?.reason) {
                      errorMsg = err.reason;
                    } else if (err?.message) {
                      errorMsg = err.message;
                    } else if (err?.data) {
                      // Try to decode revert reason
                      try {
                        const iface = new ethers.utils.Interface(RiseFarmingABI);
                        const decoded = iface.parseError(err.data);
                        errorMsg = decoded.name + ': ' + decoded.args.join(', ');
                      } catch (decodeErr) {
                        errorMsg = 'Transaction reverted';
                      }
                    }
                    
                    setClaimError(errorMsg);
                  } finally {
                    setClaiming(false);
                  }
                }}
                disabled={claiming}
              >
                {claiming ? <Loader2 className="animate-spin w-5 h-5" /> : 'Claim RISE (ERC20)'}
              </button>
              {claimSuccess && (
                <div className="mt-2 text-green-700 text-sm flex flex-col items-center">
                  <CheckCircle className="w-5 h-5 mb-1" />
                  Claim successful!
                  {claimTxHash && (
                    <a
                      href={
                        isRiseTestnet()
                          ? `https://explorer.testnet.riselabs.xyz/tx/${claimTxHash}`
                          : `https://shannon-explorer.somnia.network/tx/${claimTxHash}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline mt-1"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
              )}
              {claimError && (
                <div className="mt-2 text-red-600 text-xs bg-red-50 p-2 rounded">
                  <div className="font-semibold">Claim Error:</div>
                  <div>{claimError}</div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-2 w-full text-center text-xs text-gray-500 bg-yellow-100/80 rounded-lg py-1">
              You need at least 500 RT to claim RISE tokens.<br />Current balance: {Number(onChainRiceTokens || 0)} RT
            </div>
          )}

          {/* Add RT Submission Button for Verification - Only show if user has less than 2 RT */}
          {Number(onChainRiceTokens || 0) < 2 && (
            <button
              className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow flex items-center justify-center gap-2"
              onClick={() => setShowSubmitModal(true)}
            >
              <Send className="w-4 h-4" />
              Submit RT for Verification
            </button>
          )}
        </div>
        <div className="bg-blue-50/70 backdrop-blur rounded-xl p-3 flex flex-col gap-1 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800">Your Progress</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            <div>
              <span className="block text-base font-bold text-emerald-600">{plantedCount}</span>
              <span className="text-xs text-gray-600">Planted</span>
            </div>
            <div>
              <span className="block text-base font-bold text-blue-600">{wateredCount}</span>
              <span className="text-xs text-gray-600">Watered</span>
            </div>
            <div>
              <span className="block text-base font-bold text-yellow-600">{harvestedCount}</span>
              <span className="text-xs text-gray-600">Harvested</span>
            </div>
          </div>
        </div>
        {/* Quest Verification Email section removed as requested */}
      </div>

      {showWalletModal && <WalletModal />}
      {showSubmitModal && <RTSubmissionModal />}
    </div>
  );
}
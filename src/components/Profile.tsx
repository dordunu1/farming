import React from 'react';
import { User, Star, Coins, Trophy, CheckCircle, Wallet, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
// @ts-ignore
import { useContractRead } from 'wagmi';
import { getUserData } from '../lib/firebaseUser';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useWallet } from '../hooks/useWallet';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ReactDOM from 'react-dom';

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
  const currencySymbol =
    import.meta.env.VITE_CURRENT_CHAIN === 'SOMNIA'
      ? import.meta.env.VITE_CURRENCY_SYMBOL || 'STT'
      : import.meta.env.VITE_RISE_CURRENCY_SYMBOL || 'ETH';
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Fetch on-chain RT balance
  const { data: onChainRiceTokens } = useContractRead({
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

  // Modal component
  function WalletModal() {
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
                  onClick={() => navigator.clipboard.writeText(gameWallet.address)}
                >
                  Copy
                </button>
              </div>
              <div className="text-xs text-gray-600 mb-2">{currencySymbol} Balance: {balance !== null ? `${balance} ${currencySymbol}` : '...'}</div>
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
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 max-w-md mx-auto border border-gray-100 relative" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)' }}>
      {/* Compact wallet status badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/80 border border-emerald-200 rounded-full px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm" style={{height: 28}}>
        <Wallet className="w-4 h-4 text-emerald-500" />
        Wallet Connected
      </div>
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-emerald-200 shadow-lg bg-white/60 backdrop-blur">
          <img
            src={userStats.pfp || `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`}
            alt="Avatar"
            className="w-20 h-20 object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Player Profile</h2>
        <p className="text-sm text-gray-600 mt-1 font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>
      <div className="space-y-4">
        {/* Level Section */}
        <div className="bg-purple-50/70 backdrop-blur rounded-xl p-4 flex flex-col gap-2 border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">Level {userStats.playerLevel}</span>
            </div>
            <span className="text-sm text-gray-600">{userStats.totalXP} XP</span>
          </div>
          <div className="w-full bg-gray-200/60 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {currentLevelXP}/300 XP to next level
          </p>
        </div>
        {/* Rice Tokens Section */}
        <div className="bg-yellow-50/70 backdrop-blur rounded-xl p-4 flex flex-col gap-2 border border-yellow-100 shadow-sm">
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
            <span className="text-2xl font-bold text-yellow-600 drop-shadow-sm">{onChainRT ?? '...'}</span>
          </div>
          {/* Claim RISE button logic */}
          {rtInt >= 500 ? (
            <button
              className="mt-3 w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-2 rounded-lg font-semibold hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow"
              onClick={() => claimRiseTokens.writeContract({
                address: import.meta.env.VITE_FARMING_ADDRESS,
                abi: RiseFarmingABI,
                functionName: 'claimRiseTokens',
              })}
            >
              Claim RISE (ERC20)
            </button>
          ) : (
            <div className="mt-3 w-full text-center text-xs text-gray-500 bg-yellow-100/80 rounded-lg py-2">
              You need at least 500 RT to claim RISE tokens.
            </div>
          )}
        </div>
        {/* Action Counters */}
        <div className="bg-blue-50/70 backdrop-blur rounded-xl p-4 flex flex-col gap-2 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800">Your Progress</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="block text-lg font-bold text-emerald-600">{plantedCount}</span>
              <span className="text-xs text-gray-600">Planted</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-blue-600">{wateredCount}</span>
              <span className="text-xs text-gray-600">Watered</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-yellow-600">{harvestedCount}</span>
              <span className="text-xs text-gray-600">Harvested</span>
            </div>
          </div>
        </div>
      </div>

      {/* In-Game Wallet Button */}
      <div className="mt-8 flex justify-center">
        {walletLoading ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 font-semibold rounded-xl">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Loading Wallet...
          </div>
        ) : gameWallet ? (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold rounded-xl shadow"
            onClick={() => setShowWalletModal(true)}
          >
            <Wallet className="w-5 h-5" />
            View In-Game Wallet
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold rounded-xl shadow"
              onClick={handleRefreshWallet}
              disabled={walletLoading}
            >
              <Wallet className="w-5 h-5" />
              {walletLoading ? 'Refreshing...' : 'Refresh In-Game Wallet'}
            </button>
            <div className="text-xs text-gray-500 text-center">
              Wallet not found. Click to regenerate from your signature.
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showWalletModal && <WalletModal />}
    </div>
  );
}
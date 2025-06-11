import React from 'react';
import { User, Star, Coins, Trophy, CheckCircle, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
// @ts-ignore
import { useContractRead } from 'wagmi';
import { getUserData } from '../lib/firebaseUser';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface ProfileProps {
  isWalletConnected: boolean;
  walletAddress?: string;
}

// @ts-ignore TODO: Replace with actual ABI import after deployment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import RiseFarmingABI from '../abi/RiseFarming.json'; // You will add this file after deployment
const RISE_FARMING_ADDRESS = '0x6DFb9F5e7352c31a88Bd663eCf4082F2e73a3c83'; // Replace after deploy

export default function Profile({ 
  isWalletConnected, 
  walletAddress
}: ProfileProps) {
  const { address } = useAccount();
  const [userStats, setUserStats] = React.useState<any>(null);
  const [farmValue, setFarmValue] = React.useState(0);
  const [questValue, setQuestValue] = React.useState(0);
  const [onChainRT, setOnChainRT] = React.useState<string | null>(null);

  // Fetch on-chain RT balance
  const { data: onChainRiceTokens } = useContractRead({
    address: import.meta.env.VITE_RISE_FARMING_ADDRESS,
    abi: RiseFarmingABI,
    functionName: 'riceTokens',
    args: address ? [address] : undefined,
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
    address: import.meta.env.VITE_RISE_FARMING_ADDRESS,
    abi: RiseFarmingABI,
    functionName: 'totalHarvests',
    args: address ? [address] : undefined,
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
                address: import.meta.env.VITE_RISE_FARMING_ADDRESS,
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
        {/* Achievements Preview */}
        <div className="bg-green-50/70 backdrop-blur rounded-xl p-4 flex flex-col gap-2 border border-green-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-800">Achievements</span>
          </div>
          <p className="text-sm text-gray-600">
            View your farming milestones and unlock rewards
          </p>
        </div>
      </div>
    </div>
  );
}
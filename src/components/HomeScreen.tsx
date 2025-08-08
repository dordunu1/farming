import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, Droplets, Scissors, Plus, Gift, Calendar, TrendingUp, Star, Award, Target, Home, Sparkle, Info } from 'lucide-react';
import FarmGrid from './FarmGrid';
import DailyRewardModal from './DailyRewardModal';
import AchievementModal from './AchievementModal';
import { useAccount, useContractRead, useContractWrite, useWaitForTransactionReceipt, useContractReads } from 'wagmi';
import { getUserData, onUserDataSnapshot, onRecentActivitySnapshot, Activity, Plot, resetDailyQuestsIfNeeded, logAndSyncUserActivity, getActivityIcon } from '../lib/firebaseUser';
import { useWallet as useInGameWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import { shredsService, isRiseTestnet } from '../services/shredsService';

import RiseFarmingABI from '../abi/RiseFarming.json';
import type { Abi } from 'viem';
import { getAuth, signOut } from 'firebase/auth';
import { marketItems } from './Marketplace';

interface HomeScreenProps {
  isWalletConnected: boolean;
  riceTokens: number;
  setRiceTokens: (tokens: number) => void;
  setPlayerLevel: (level: number) => void;
  setTotalXP: (xp: number) => void;
}

// Add DailyQuest type
interface DailyQuest {
  id: number;
  title: string;
  icon: React.ReactNode;
  progress: number;
  target: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
}

// Add Achievement type
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

function HomeScreen({ 
  isWalletConnected, 
  riceTokens, 
  setRiceTokens,
  setPlayerLevel,
  setTotalXP
}: HomeScreenProps) {
  const { address } = useAccount();
  const { wallet: inGameWallet, isLoading: walletLoading, error: walletError } = useInGameWallet(address);
  const inGameAddress = inGameWallet?.address;

  // Initialize nonce management early for faster first transactions
  useEffect(() => {
    if (inGameWallet && isRiseTestnet()) {
      // Pre-initialize nonce management using the dedicated function
      shredsService.preInitializeNonce(inGameWallet.privateKey);
    }
  }, [inGameWallet]);

  // Fetch on-chain RT balance (move to top)
  const { data: onChainRiceTokens } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI,
    functionName: 'riceTokens',
    args: inGameAddress ? [inGameAddress] : undefined,
  });

  // Add on-chain XP fetch (move to top)
  const { data: onChainXP } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'totalXP',
    args: inGameAddress ? [inGameAddress as `0x${string}`] : undefined,
  });

  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [achievements] = useState<Achievement[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [activityPage, setActivityPage] = useState(0);
  const [claimingQuestId, setClaimingQuestId] = useState<number | null>(null);
  const ACTIVITY_PAGE_SIZE = 5;

  // --- Daily Quests State ---
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  // Track quest progress fields
  const [numPlanted, setNumPlanted] = useState(0);
  const [numWatered, setNumWatered] = useState(0);

  const maxEnergy = 250;
  const energyPercentage = (energy / maxEnergy) * 100;

  // Read streak from contract
  const { data: streakData } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'userStreaks',
    args: inGameAddress ? [inGameAddress as `0x${string}`] : undefined,
  });
  useEffect(() => {
    setDailyStreak(Number(streakData || 0));
  }, [streakData]);

  // Add on-chain energy fetch
  const { data: onChainEnergy } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'userEnergy',
    args: inGameAddress ? [inGameAddress as `0x${string}`] : undefined,
  });
  useEffect(() => {
    setEnergy(Number(onChainEnergy || 0));
  }, [onChainEnergy]);

  // Listen for real-time plot updates
  useEffect(() => {
    // Removed Firestore plot syncing to prevent overwriting on-chain state
  }, [address]);

  // Real-time recent activity
  useEffect(() => {
    if (!address) return;
    const unsub = onRecentActivitySnapshot(address, (activity) => {
      setRecentActivity(activity);
    });
    return () => unsub && unsub();
  }, [address]);

  // Fetch on-chain totalHarvests for quest progress
  const { data: onChainTotalHarvests } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'totalHarvests',
    args: inGameAddress ? [inGameAddress as `0x${string}`] : undefined,
  });
  const totalHarvests = Number(onChainTotalHarvests || 0);

  // Fetch user quest progress from Firestore
  useEffect(() => {
    if (!address) {
      setDailyQuests([]);
      setNumPlanted(0);
      setNumWatered(0);
      return;
    }
    const unsubscribe = onUserDataSnapshot(address, user => {
      if (user) {
        setNumPlanted(user.numPlanted || 0);
        setNumWatered(user.numWatered || 0);
        // Compute quests
        const quests: DailyQuest[] = [
          {
            id: 1,
            title: 'Plant 3 seeds',
            icon: <span className="inline mr-1" role="img" aria-label="rice-seed">🌾</span>,
            progress: Math.min(user.numPlanted || 0, 3),
            target: 3,
            reward: 1,
            completed: (user.numPlanted || 0) >= 3,
            claimed: dailyQuests.find(q => q.id === 1)?.claimed || false,
          },
          {
            id: 2,
            title: 'Water 5 plots',
            icon: <Droplets className="w-5 h-5 text-blue-400 inline mr-1" />,
            progress: Math.min(user.numWatered || 0, 5),
            target: 5,
            reward: 2,
            completed: (user.numWatered || 0) >= 5,
            claimed: dailyQuests.find(q => q.id === 2)?.claimed || false,
          },
          {
            id: 3,
            title: 'Harvest 2 plots',
            icon: <Scissors className="w-5 h-5 text-yellow-600 inline mr-1" />,
            progress: Math.min(totalHarvests, 2),
            target: 2,
            reward: 3,
            completed: totalHarvests >= 2,
            claimed: dailyQuests.find(q => q.id === 3)?.claimed || false,
          },
        ];
        setDailyQuests(quests);
      } else {
        setDailyQuests([]);
      }
    });
    return () => unsubscribe();
  }, [address, totalHarvests]);

  // Add state for water cans
  const [waterCans, setWaterCans] = useState(0);
  const WATERING_CAN_ID = 5;
  const { data: waterCansData } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'userItemBalances',
    args: inGameAddress ? [inGameAddress, WATERING_CAN_ID] : undefined,
  });
  useEffect(() => {
    setWaterCans(Number(waterCansData || 0));
  }, [waterCansData]);

  // Add contract write for quest rewards
  const { writeContract: writeQuestClaim, data: questClaimData, isPending: isQuestClaimPending } = useContractWrite();
  const { isSuccess: isQuestClaimSuccess } = useWaitForTransactionReceipt({ hash: questClaimData });

  // Fetch on-chain claimed state for each quest
  const questIds = [1, 2, 3];
  // --- Quest Claimed State Refetch ---
  const claimedStatesRef = useRef<any>(null);
  const { data: claimedStates, refetch: refetchClaimedStates } = useContractReads({
    contracts: inGameAddress
      ? questIds.map((id) => ({
          address: import.meta.env.VITE_FARMING_ADDRESS,
          abi: RiseFarmingABI as Abi,
          functionName: 'claimedQuests',
          args: [inGameAddress, id],
        }))
      : [],
  });
  claimedStatesRef.current = claimedStates;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Update quest rewards to use RT instead of energy, and use on-chain claimed state
  const quests: DailyQuest[] = [
    {
      id: 1,
      title: 'Plant 3 seeds',
      icon: <span className="inline mr-1" role="img" aria-label="rice-seed">🌾</span>,
      progress: Math.min(numPlanted || 0, 3),
      target: 3,
      reward: 1,
      completed: (numPlanted || 0) >= 3,
      claimed: Boolean(claimedStates?.[0]?.result),
    },
    {
      id: 2,
      title: 'Water 5 plots',
      icon: <Droplets className="w-5 h-5 text-blue-400 inline mr-1" />,
      progress: Math.min(numWatered || 0, 5),
      target: 5,
      reward: 2,
      completed: (numWatered || 0) >= 5,
      claimed: Boolean(claimedStates?.[1]?.result),
    },
    {
      id: 3,
      title: 'Harvest 2 plots',
      icon: <Scissors className="w-5 h-5 text-yellow-600 inline mr-1" />,
      progress: Math.min(totalHarvests, 2),
      target: 2,
      reward: 3,
      completed: totalHarvests >= 2,
      claimed: Boolean(claimedStates?.[2]?.result),
    },
  ];

  // Add effect to refetch claimedStates after a successful claim
  useEffect(() => {
    if (
      isQuestClaimSuccess &&
      address &&
      onChainRiceTokens !== undefined &&
      onChainXP !== undefined
    ) {
      if (typeof refetchClaimedStates === 'function') {
        refetchClaimedStates();
      }
      setClaimingQuestId(null);
      // Log and sync activity after quest claim
      logAndSyncUserActivity(address, {
        icon: getActivityIcon('quest'),
        action: 'Claimed quest reward',
        time: new Date().toISOString(),
        reward: `+${dailyQuests.find(q => q.claimed)?.reward || ''} RT`,
        color: 'yellow',
        txHash: questClaimData,
      }, {
        riceTokens: Number(onChainRiceTokens),
        totalXP: Number(onChainXP),
        totalHarvests: Number(onChainTotalHarvests),
        energy: Number(onChainEnergy),
        dailyStreak: Number(streakData),
      });
    }
  }, [isQuestClaimSuccess, refetchClaimedStates, address, onChainRiceTokens, onChainXP, onChainTotalHarvests, onChainEnergy, streakData, dailyQuests, questClaimData]);

  // Update the quest claim button click handler
  const handleQuestClaim = async (questId: number) => {
    if (!inGameWallet || !inGameAddress) return;
    setClaimingQuestId(questId);
    try {
      let rpcUrl = '';
      if (import.meta.env.VITE_CURRENT_CHAIN === 'SOMNIA') {
        rpcUrl = import.meta.env.VITE_RPC_URL || import.meta.env.SOMNIA_RPC_URL;
      } else if (import.meta.env.VITE_CURRENT_CHAIN === 'NEXUS') {
        rpcUrl = import.meta.env.VITE_NEXUS_RPC_URL || import.meta.env.NEXUS_RPC_URL;
      } else if (import.meta.env.VITE_CURRENT_CHAIN === 'PHAROS') {
        rpcUrl = import.meta.env.VITE_RPC_URL || import.meta.env.VITE_PHAROS_RPC_URL;
      } else if (import.meta.env.VITE_CURRENT_CHAIN === 'FLUENT') {
        rpcUrl = import.meta.env.VITE_FLUENT_RPC_URL || import.meta.env.FLUENT_RPC_URL;
      } else {
        rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL;
      }
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(inGameWallet.privateKey, provider);
      const contract = new ethers.Contract(import.meta.env.VITE_FARMING_ADDRESS, RiseFarmingABI as any, wallet);
      
      let result;
      if (isRiseTestnet()) {
        // Use Shreds service for RISE testnet
        result = await shredsService.sendTransaction(
          null, // transaction object not needed for this method
          wallet,
          contract,
          'claimQuestReward',
          [BigInt(questId)],
          { gasLimit: 300000 }
        );
      } else {
        // Use direct ethers.js call for Somnia with high gas limit
        const tx = await contract.claimQuestReward(BigInt(questId), { gasLimit: 5_000_000 });
        result = await tx.wait();
      }
      
      if (result?.hash || result?.transactionHash) {
        console.log('⚡ Quest claim transaction completed');
        setClaimingQuestId(null);
        setClaimedQuestId(questId);
        setShowQuestClaimToast(true);
        // Update local quest state to claimed
        setDailyQuests((prev) => prev.map(q => q.id === questId ? { ...q, claimed: true } : q));
      } else {
        throw new Error('Transaction failed: No result received');
      }
    } catch (err: any) {
      setClaimingQuestId(null);
      alert('Claim quest failed: ' + (err && err.message ? err.message : String(err)));
    }
  };

  useEffect(() => {
    if (address) {
      resetDailyQuestsIfNeeded(address);
    }
  }, [address]);

  // Sync Firebase Auth with wallet address
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser && address && auth.currentUser.uid !== address) {
      // Wallet changed, sign out of Firebase Auth
      signOut(auth);
    }
  }, [address]);

  // --- Farm Value Calculation ---
  const [farmValue, setFarmValue] = useState(0);
  useEffect(() => {
    // Type guard for Activity
    function isHarvestActivity(a: any): a is { type: string; amount: number } {
      return a && typeof a === 'object' && a.type === 'harvest' && typeof a.amount === 'number';
    }
    const plantedPlots = plots.filter(p => ('seedId' in p ? (p as any).seedId !== 0 : p.cropType && p.cropType !== ''));
    const totalYield = plantedPlots.reduce((sum, p) => sum + (p.expectedYield || 0), 0);
    setFarmValue(totalYield);
  }, [plots]);

  // --- Fetch playerLevel and totalXP from Firestore and update top bar ---
  useEffect(() => {
    if (address) {
      getUserData(address).then(user => {
        if (user) {
          setPlayerLevel(user.playerLevel || 1);
          setTotalXP(user.totalXP || 0);
        }
      });
    }
  }, [address, setPlayerLevel, setTotalXP]);

  // Add state for claimable, lastClaimed, and timer
  const [canClaimEnergy, setCanClaimEnergy] = useState(false);
  const [claimCountdown, setClaimCountdown] = useState(0);
  const [isClaimPending, setIsClaimPending] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [isClaimSuccess, setIsClaimSuccess] = useState(false);
  const [showEnergyClaimToast, setShowEnergyClaimToast] = useState(false);
  const { data: hasClaimedInitialEnergy } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'hasClaimedInitialEnergy',
    args: inGameAddress ? [inGameAddress] : undefined,
  });
  const { data: lastClaimedEnergy } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'lastEnergyClaim',
    args: inGameAddress ? [inGameAddress] : undefined,
  });
  // Timer logic
  useEffect(() => {
    if (hasClaimedInitialEnergy) {
      setCanClaimEnergy(false);
      setClaimCountdown(0);
      return;
    }
    if (lastClaimedEnergy === undefined) {
      setCanClaimEnergy(true);
      setClaimCountdown(0);
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    const last = Number(lastClaimedEnergy);
    const diff = now - last;
    if (diff >= 300) {
      setCanClaimEnergy(true);
      setClaimCountdown(0);
    } else {
      setCanClaimEnergy(false);
      setClaimCountdown(300 - diff);
    }
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = now - last;
      if (diff >= 300) {
        setCanClaimEnergy(true);
        setClaimCountdown(0);
        clearInterval(interval);
      } else {
        setCanClaimEnergy(false);
        setClaimCountdown(300 - diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastClaimedEnergy, hasClaimedInitialEnergy]);
  // Claim handler
  const handleClaimEnergy = async () => {
    if (!inGameWallet || !inGameAddress) return;
    setIsClaimPending(true);
    setIsClaimSuccess(false);
    setShowEnergyClaimToast(false);
    try {
      let rpcUrl = '';
      if (import.meta.env.VITE_CURRENT_CHAIN === 'SOMNIA') {
        rpcUrl = import.meta.env.VITE_RPC_URL || import.meta.env.SOMNIA_RPC_URL;
      } else if (import.meta.env.VITE_CURRENT_CHAIN === 'NEXUS') {
        rpcUrl = import.meta.env.VITE_NEXUS_RPC_URL || import.meta.env.NEXUS_RPC_URL;
      } else if (import.meta.env.VITE_CURRENT_CHAIN === 'PHAROS') {
        rpcUrl = import.meta.env.VITE_RPC_URL || import.meta.env.VITE_PHAROS_RPC_URL;
      } else if (import.meta.env.VITE_CURRENT_CHAIN === 'FLUENT') {
        rpcUrl = import.meta.env.VITE_FLUENT_RPC_URL || import.meta.env.FLUENT_RPC_URL;
      } else {
        rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL;
      }
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(inGameWallet.privateKey, provider);
      const contract = new ethers.Contract(import.meta.env.VITE_FARMING_ADDRESS, RiseFarmingABI as any, wallet);
      
      // Use Shreds service for transaction
      const result = await shredsService.sendTransaction(
        null, // transaction object not needed for this method
        wallet,
        contract,
        'claimInitialEnergy',
        [],
        { gasLimit: 5_000_000  }
      );
      
      if (result?.hash) {
        setClaimTxHash(result.hash);
        console.log('⚡ Energy claim transaction completed');
        setIsClaimPending(false);
        setIsClaimSuccess(true);
        setShowEnergyClaimToast(true);
        // --- Heal inGameWalletAddress in Firestore if missing ---
        if (address && inGameAddress) {
          const { syncUserOnChainToFirestore, getUserData } = await import('../lib/firebaseUser');
          getUserData(address).then(user => {
            if (user && (!user.inGameWalletAddress || user.inGameWalletAddress === '')) {
              syncUserOnChainToFirestore(address, { inGameWalletAddress: inGameAddress });
            }
          });
        }
      } else {
        throw new Error('Transaction failed: No result received');
      }
    } catch (err: any) {
      setIsClaimPending(false);
      setShowEnergyClaimToast(false);
      alert('Claim energy failed: ' + (err && err.message ? err.message : String(err)));
    }
  };

  useEffect(() => {
    if (
      isClaimSuccess &&
      address &&
      onChainRiceTokens !== undefined &&
      onChainXP !== undefined
    ) {
      // Log and sync activity after energy claim
      logAndSyncUserActivity(address, {
        icon: getActivityIcon('daily'),
        action: 'Claimed energy',
        time: new Date().toISOString(),
        reward: '+10 Energy',
        color: 'yellow',
        txHash: claimTxHash || undefined,
      }, {
        riceTokens: Number(onChainRiceTokens),
        totalXP: Number(onChainXP),
        totalHarvests: Number(onChainTotalHarvests),
        energy: Number(onChainEnergy),
        dailyStreak: Number(streakData),
      });
    }
  }, [isClaimSuccess, address, onChainRiceTokens, onChainXP, onChainTotalHarvests, onChainEnergy, streakData, claimTxHash]);

  // Hide energy claim toast after 3 seconds
  useEffect(() => {
    if (showEnergyClaimToast) {
      const timer = setTimeout(() => {
        setShowEnergyClaimToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showEnergyClaimToast]);

  // Add state for quest claim toast
  const [showQuestClaimToast, setShowQuestClaimToast] = useState(false);
  const [claimedQuestId, setClaimedQuestId] = useState<number | null>(null);

  // Hide quest claim toast after 3 seconds
  useEffect(() => {
    if (showQuestClaimToast) {
      const timer = setTimeout(() => {
        setShowQuestClaimToast(false);
        setClaimedQuestId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showQuestClaimToast]);

  // Utility to truncate transaction hashes
  function truncateHash(hash?: string) {
    return hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : '';
  }

  return (
    <motion.div 
      className="space-y-8 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Energy Claim Toast */}
      {showEnergyClaimToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-100 border border-emerald-300 text-emerald-900 px-6 py-3 rounded-xl shadow-lg z-50 font-semibold flex items-center gap-2 animate-fade-in">
          ⚡ Energy claimed successfully! +10 Energy added to your balance.
          {claimTxHash && (
            <span className="text-xs font-mono ml-2 opacity-75">
              ({truncateHash(claimTxHash)})
            </span>
          )}
        </div>
      )}

      {/* Quest Claim Toast */}
      {showQuestClaimToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-yellow-100 border border-yellow-300 text-yellow-900 px-6 py-3 rounded-xl shadow-lg z-50 font-semibold flex items-center gap-2 animate-fade-in">
          🏆 Quest claimed! +{dailyQuests.find(q => q.id === claimedQuestId)?.reward} RT
        </div>
      )}

      {/* Enhanced Stats Dashboard */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Rice Tokens</p>
              {address ? (
                <div className="flex items-center">
                  <p className="text-3xl font-bold">
                    {onChainRiceTokens ? Number(onChainRiceTokens).toLocaleString() : '--'}
                  </p>
                  <div className="ml-2 group relative">
                    <Info className="w-5 h-5 text-emerald-200 cursor-pointer" />
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white text-gray-700 text-xs rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      This is your on-chain RT balance, including all rewards from quests, streaks, and harvests. Once you reach 20 RT, you can claim your tokens to your wallet.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold">--</p>
                  <p className="text-emerald-200 text-xs mt-1">Connect wallet to start</p>
                </>
              )}
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <div className="w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Energy</p>
              {address ? (
                <>
                  <p className="text-3xl font-bold">{energy}/{maxEnergy}</p>
                  {address && !hasClaimedInitialEnergy && (
                    <button
                      onClick={handleClaimEnergy}
                      disabled={isClaimPending}
                      className={`mt-2 px-4 py-2 rounded-xl font-bold bg-yellow-400 text-white shadow-lg transition-all ${isClaimPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isClaimPending ? 'Claiming...' : 'Claim 10 Energy'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold">--/--</p>
                  <p className="text-blue-200 text-xs mt-1">Connect wallet to start</p>
                </>
              )}
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-yellow-300" />
            </div>
          </div>
          {address && (
            <div className="mt-4 bg-white/20 rounded-full h-2">
              <motion.div 
                className="bg-white h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${energyPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Daily Streak</p>
              {address ? (
                <>
                  <p className="text-3xl font-bold">{dailyStreak} days</p>
                  <p className="text-orange-200 text-xs mt-1">Keep it up!</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold">--</p>
                  <p className="text-orange-200 text-xs mt-1">Connect wallet to start</p>
                </>
              )}
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Farm Level</p>
              {address ? (
                <>
                  <p className="text-3xl font-bold">{totalHarvests}</p>
                  <p className="text-purple-200 text-xs mt-1">{totalHarvests} harvests</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold">--</p>
                  <p className="text-purple-200 text-xs mt-1">Connect wallet to start</p>
                </>
              )}
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Daily Quests */}
      <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Quests</h3>
              <p className="text-gray-600 text-sm">Complete quests to earn bonus rewards</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDailyReward(true)}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-xl font-medium shadow-lg"
          >
            <Gift className="w-4 h-4 inline mr-2" />
            Daily Reward
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dailyQuests.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400 py-8">No quests available.</div>
          ) : (
            dailyQuests.map((quest) => (
              <motion.div
                key={quest.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  quest.completed 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {quest.icon}
                    <h4 className="font-semibold text-gray-800">{quest.title}</h4>
                  </div>
                  {quest.completed && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{quest.progress}/{quest.target}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${quest.completed ? 'bg-green-500' : 'bg-emerald-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(quest.progress / quest.target) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reward:</span>
                  <span className="font-bold text-yellow-500 flex items-center">
                    <Sparkle className="w-5 h-5 mr-1" />+{quest.reward} RT
                  </span>
                </div>
                {quest.completed && !Boolean(claimedStates?.[quest.id - 1]?.result) && (
                  <button
                    className="mt-3 w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleQuestClaim(quest.id)}
                    disabled={isQuestClaimPending || Boolean(claimedStates?.[quest.id - 1]?.result) || claimingQuestId === quest.id}
                  >
                    {claimingQuestId === quest.id && isQuestClaimPending ? 'Claiming...' : 'Claim'}
                  </button>
                )}
                {quest.completed && Boolean(claimedStates?.[quest.id - 1]?.result) && (
                  <div className="mt-3 text-green-600 font-semibold text-center">Claimed!</div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Enhanced Action Buttons */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6">
        {[
          { icon: Plus, label: 'Plant Seeds', color: 'from-emerald-500 to-green-600', cost: '1 Energy' },
          { icon: Droplets, label: 'Water Crops', color: 'from-blue-500 to-cyan-600', cost: '1 Energy' },
          { icon: Scissors, label: 'Harvest Rice', color: 'from-yellow-500 to-orange-600', cost: '1 Energy' }
        ].map((action) => (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            disabled={!isWalletConnected}
            className={`bg-gradient-to-br ${action.color} text-white p-6 rounded-2xl font-medium shadow-xl hover:shadow-2xl transition-all duration-200 flex flex-col items-center space-y-3 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <action.icon className="w-8 h-8" />
            <span className="text-lg font-semibold">{action.label}</span>
            <span className="text-sm opacity-90">{action.cost}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Enhanced Farm Grid */}
      <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-emerald-100 shadow-lg">
        {/* Farm header row with Farm Value */}
        <div className="flex flex-col w-full mb-4">
          <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-3 rounded-md mb-2 text-sm">
            <strong>Note:</strong> When a seed matures and shows <b>Harvesting</b>, there is a 1-minute cooldown before you can harvest. Please wait 1 minute after maturity before harvesting your crop.
          </div>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">My Rice Fields</h2>
              <p className="text-gray-600">{plots.length} plots • Level {totalHarvests} Farm</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Farm Value Calculation */}
            {(() => {
              // Sum all expectedYield values for all plots
              const totalYield = plots.reduce((sum, p) => sum + (p.expectedYield || 0), 0);
              // Find the best seed for max possible yield (optional, for %)
              const bestSeed = marketItems.filter(item => item.category === 'seeds' && typeof item.riseReward === 'number').reduce((max, item) => (item.riseReward! > (max?.riseReward || 0) ? item : max), null as null | typeof marketItems[0]);
              const maxYieldPerPlot = bestSeed?.riseReward || 0;
              const maxPossibleYield = plots.length * maxYieldPerPlot;
              const farmValuePercent = maxPossibleYield > 0 ? Math.round((totalYield / maxPossibleYield) * 100) : 0;
              return (
                <div className="flex flex-col items-end min-w-[120px]">
                  <span className="text-sm text-gray-500">Farm Value</span>
                  <span className="text-2xl font-bold text-emerald-700">{totalYield} RT</span>
                  <span className="text-xs text-gray-500">({farmValuePercent}%)</span>
                  <span className="text-xs text-gray-400 mt-1 text-right">This is the total expected yield (RT) from your current planted crops.</span>
                </div>
              );
            })()}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg"
            >
              <Award className="w-4 h-4 inline mr-2" />
              Achievements
            </motion.button>
          </div>
        </div>
        <FarmGrid 
          isWalletConnected={isWalletConnected}
          energy={energy}
          setEnergy={setEnergy}
          riceTokens={riceTokens}
          setRiceTokens={setRiceTokens}
          plots={plots.map(p => ({ ...p, rarity: (p as any).rarity || 'common' })) as any}
          setPlots={setPlots as any}
          waterCans={waterCans}
        />
      </motion.div>

      {/* Enhanced Recent Activity */}
      <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <TrendingUp className="w-6 h-6 mr-3 text-emerald-600" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.slice(activityPage * ACTIVITY_PAGE_SIZE, (activityPage + 1) * ACTIVITY_PAGE_SIZE).map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl shadow mb-1 border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl" title={activity.action}>{activity.icon}</span>
                <div>
                  <div className="font-semibold text-gray-800">{activity.action}</div>
                  <div className="text-xs text-gray-500">{new Date(activity.time).toLocaleString()}</div>
                  {activity.txHash && (
                    <div className="text-xs text-gray-400 mt-1">
                      Tx: <span className="ml-1 font-mono cursor-pointer" title={activity.txHash}>{truncateHash(activity.txHash)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="font-bold text-emerald-600 text-lg">{
                typeof activity.reward === 'string' && activity.reward.startsWith('-')
                  ? activity.reward.slice(1).trim()
                  : activity.reward
              }</div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50"
            onClick={() => setActivityPage((p) => Math.max(0, p - 1))}
            disabled={activityPage === 0}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50"
            onClick={() => setActivityPage((p) => p + 1)}
            disabled={(activityPage + 1) * ACTIVITY_PAGE_SIZE >= recentActivity.length}
          >
            Next
          </button>
        </div>
      </motion.div>

      {/* Modals */}
      <DailyRewardModal
        isOpen={showDailyReward}
        onClose={() => setShowDailyReward(false)}
      />

      <AchievementModal
        isOpen={showAchievement}
        onClose={() => setShowAchievement(false)}
        achievements={achievements}
      />
    </motion.div>
  );
}

export default HomeScreen;
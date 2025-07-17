import React from 'react';
import { X, Gift, Calendar, Coins } from 'lucide-react';
import { useAccount, useContractReads } from 'wagmi';
import RiseFarmingABI from '../abi/RiseFarming.json';
import { addRecentActivity } from '../lib/firebaseUser';
import { useWallet as useInGameWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import { shredsService, isRiseTestnet } from '../services/shredsService';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FARMING_ADDRESS = import.meta.env.VITE_FARMING_ADDRESS;

function DailyRewardModal({ isOpen, onClose }: DailyRewardModalProps) {
  const { address } = useAccount();
  const { wallet: inGameWallet } = useInGameWallet(address);
  const inGameAddress = inGameWallet?.address;
  const [status, setStatus] = React.useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [showClaimToast, setShowClaimToast] = React.useState(false);
  
  // Initialize nonce management early for faster first transactions
  React.useEffect(() => {
    if (inGameWallet && isRiseTestnet()) {
      // Pre-initialize nonce management using the dedicated function
      shredsService.preInitializeNonce(inGameWallet.privateKey);
    }
  }, [inGameWallet]);
  
  const rewards = [
    { day: 1, reward: 1 },
    { day: 2, reward: 2 },
    { day: 3, reward: 3 },
    { day: 4, reward: 4 },
    { day: 5, reward: 5 },
    { day: 6, reward: 6 },
    { day: 7, reward: 7 },
  ];

  // Always call the hook at the top level, use enabled to control fetching
  const result = useContractReads({
    contracts: inGameAddress
      ? [
          {
            address: FARMING_ADDRESS,
            abi: RiseFarmingABI as any,
            functionName: 'userStreaks',
            args: [inGameAddress as `0x${string}`],
          },
          {
            address: FARMING_ADDRESS,
            abi: RiseFarmingABI as any,
            functionName: 'lastClaimedDay',
            args: [inGameAddress as `0x${string}`],
          },
        ]
      : [],
  });
  const userData = result.data;
  const isLoadingUserData = result.isLoading;
  const streak = Number(userData?.[0]?.result || 0);
  const lastClaimed = Number(userData?.[1]?.result || 0);
  // Calculate claim availability
  const now = Math.floor(Date.now() / 1000);
  const nextClaimTime = lastClaimed + 86400;
  const canClaim = now > nextClaimTime;
  const secondsLeft = nextClaimTime - now;
  // Calculate current day (1-7)
  let currentDay = streak === 0 ? 1 : ((streak % 7) || 7);
  if (canClaim) {
    // Show the next day streak if eligible to claim
    currentDay = ((streak + 1) % 7) || 7;
  }
  const reward = rewards[currentDay - 1].reward;
  // Format countdown
  const formatCountdown = (s: number) => {
    if (s <= 0) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };
  const [txHash, setTxHash] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  // Fetch dailyRewardPaused flag
  const { data: dailyRewardPaused } = useContractReads({
    contracts: inGameAddress
      ? [
          {
            address: FARMING_ADDRESS,
            abi: RiseFarmingABI as any,
            functionName: 'dailyRewardPaused',
          },
        ]
      : [],
  });
  const isPaused = dailyRewardPaused?.[0]?.result === true;

  React.useEffect(() => {
    if (isPending) setStatus('pending');
    if (isError) setStatus('error');
    if (isSuccess && address && txHash) {
      setStatus('success');
      addRecentActivity(address, {
        icon: '🔥',
        action: `Claimed Daily Reward (Day ${currentDay})`,
        time: new Date().toLocaleString(),
        reward: `+${rewards[currentDay - 1].reward} RT`,
        color: 'bg-green-500',
        txHash: txHash,
      });
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 2000);
    }
  }, [isPending, isError, isSuccess, address, txHash, onClose]);

  const handleClaim = async () => {
    if (!inGameWallet) return;
    setIsPending(true);
    setIsError(false);
    setIsSuccess(false);
    try {
      let rpcUrl = '';
      if (import.meta.env.VITE_CURRENT_CHAIN === 'SOMNIA') {
        rpcUrl = import.meta.env.VITE_RPC_URL || import.meta.env.SOMNIA_RPC_URL;
      } else if (import.meta.env.VITE_CURRENT_CHAIN === 'NEXUS') {
        rpcUrl = import.meta.env.VITE_NEXUS_RPC_URL || import.meta.env.NEXUS_RPC_URL;
      } else {
        rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL || import.meta.env.VITE_RPC_URL;
      }
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(inGameWallet.privateKey, provider);
      const contract = new ethers.Contract(FARMING_ADDRESS, RiseFarmingABI as any, wallet);
      
      // Use Shreds service for transaction
      const result = await shredsService.sendTransaction(
        null, // transaction object not needed for this method
        wallet,
        contract,
        'claimDailyReward',
        [],
        {}
      );
      
      if (result?.hash) {
        setTxHash(result.hash);
        setIsPending(false);
        setIsSuccess(true);
        setShowClaimToast(true);
        setTimeout(() => setShowClaimToast(false), 3000);
      } else {
        throw new Error('Transaction failed: No result received');
      }
    } catch (err: any) {
      setIsPending(false);
      setIsError(true);
      setStatus('error');
      console.error('Claim daily reward error:', err.message);
    }
  };

  if (!isOpen || !inGameAddress) return null;
  if (isLoadingUserData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <div className="text-lg font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Gift className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-800">Daily Rewards</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Day {currentDay} Streak!</span>
          </div>
          <p className="text-gray-600">Keep your streak going to earn bigger rewards</p>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-6">
          {rewards.map((rewardObj, idx) => (
            <div
              key={rewardObj.day}
              className={`aspect-square rounded-lg border-2 p-2 text-center transition-all ${
                rewardObj.day === currentDay
                  ? 'border-green-400 bg-green-50 scale-110'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-xs font-medium text-gray-600 mb-1">Day {rewardObj.day}</div>
              <div className="text-xs">
                {rewardObj.day === currentDay ? (
                  <span className="text-xl flex justify-center">🔥</span>
                ) : (
                  <div className="w-4 h-4 border border-gray-300 rounded-full mx-auto"></div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl p-4 mb-6 border border-green-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-xl font-bold text-gray-800">{reward} RT</span>
            </div>
            <p className="text-sm text-gray-600">Complete your {currentDay}-day streak!</p>
          </div>
        </div>
        <button
          onClick={handleClaim}
          disabled={!canClaim || isPending || status === 'success' || isPaused}
          className={`w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 ${(!canClaim || isPending || isPaused) ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isPaused
            ? 'Daily Rewards Paused'
            : status === 'pending'
              ? 'Claiming...'
              : status === 'success'
                ? 'Claimed!'
                : !canClaim
                  ? `Next claim in ${formatCountdown(secondsLeft)}`
                  : 'Claim Reward'}
        </button>
        {isPaused && (
          <div className="text-yellow-600 text-center mt-2 font-semibold">Daily rewards are currently paused by the team.</div>
        )}
        {status === 'error' && <div className="text-red-500 text-center mt-2">Error claiming reward. Please try again.</div>}
        {showClaimToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-100 border border-green-300 text-green-900 px-6 py-3 rounded-xl shadow-lg z-50 font-semibold flex items-center gap-2 animate-fade-in">
            🎁 Daily reward claimed! +{reward} RT
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyRewardModal;
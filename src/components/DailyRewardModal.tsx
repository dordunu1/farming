import React from 'react';
import { X, Gift, Calendar, Coins } from 'lucide-react';
import { useContractWrite, useWaitForTransactionReceipt, useAccount, useContractReads } from 'wagmi';
import RiseFarmingABI from '../abi/RiseFarming.json';
import { addRecentActivity } from '../lib/firebaseUser';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RISE_FARMING_ADDRESS = import.meta.env.VITE_RISE_FARMING_ADDRESS;

function DailyRewardModal({ isOpen, onClose }: DailyRewardModalProps) {
  const { address } = useAccount();
  const [status, setStatus] = React.useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const rewards = [
    { day: 1, reward: 0.5 },
    { day: 2, reward: 1 },
    { day: 3, reward: 1.5 },
    { day: 4, reward: 2 },
    { day: 5, reward: 2.5 },
    { day: 6, reward: 3 },
    { day: 7, reward: 3.5 },
  ];

  // Always call the hook at the top level, use enabled to control fetching
  const result = useContractReads({
    contracts: address
      ? [
          {
            address: RISE_FARMING_ADDRESS,
            abi: RiseFarmingABI as any,
            functionName: 'userStreaks',
            args: [address as `0x${string}`],
          },
          {
            address: RISE_FARMING_ADDRESS,
            abi: RiseFarmingABI as any,
            functionName: 'lastClaimedDay',
            args: [address as `0x${string}`],
          },
        ]
      : [],
  });
  const userData = result.data;
  const isLoadingUserData = result.isLoading;
  const streak = Number(userData?.[0]?.result || 0);
  const lastClaimed = Number(userData?.[1]?.result || 0);
  // Calculate current day (1-7)
  const currentDay = streak === 0 ? 1 : ((streak % 7) || 7);
  const reward = rewards[currentDay - 1].reward;
  // Calculate claim availability
  const now = Math.floor(Date.now() / 1000);
  const nextClaimTime = lastClaimed + 86400;
  const canClaim = now > nextClaimTime;
  const secondsLeft = nextClaimTime - now;
  // Format countdown
  const formatCountdown = (s: number) => {
    if (s <= 0) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };
  const { writeContract, data, isPending, isError } = useContractWrite();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: data });

  React.useEffect(() => {
    if (isPending) setStatus('pending');
    if (isError) setStatus('error');
    if (isSuccess && address && data) {
      setStatus('success');
      addRecentActivity(address, {
        icon: '🔥',
        action: `Claimed Daily Reward (Day ${currentDay})`,
        time: new Date().toLocaleString(),
        reward: `+${rewards[currentDay - 1].reward} RT`,
        color: 'bg-green-500',
        txHash: data,
      });
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 2000);
    }
  }, [isPending, isError, isSuccess, address, data, onClose]);

  const handleClaim = () => {
    if (!address) return;
    writeContract({
      address: RISE_FARMING_ADDRESS,
      abi: RiseFarmingABI as any,
      functionName: 'claimDailyReward',
      args: [],
      account: address as `0x${string}`,
    });
  };

  if (!isOpen || !address) return null;
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
          disabled={!canClaim || isPending || status === 'success'}
          className={`w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 ${(!canClaim || isPending) ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {status === 'pending' ? 'Claiming...' : status === 'success' ? 'Claimed!' : !canClaim ? `Next claim in ${formatCountdown(secondsLeft)}` : 'Claim Reward'}
        </button>
        {status === 'error' && <div className="text-red-500 text-center mt-2">Error claiming reward. Please try again.</div>}
      </div>
    </div>
  );
}

export default DailyRewardModal;
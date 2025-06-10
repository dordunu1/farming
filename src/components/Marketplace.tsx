import React, { useState, useEffect } from 'react';
import { Search, Zap, Droplets, Scissors, TrendingUp, Box, Info } from 'lucide-react';
import { useContractReads, useContractWrite, useWaitForTransactionReceipt, useAccount, useContractRead } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import RiseFarmingABI from '../abi/RiseFarming.json';
import { addRecentActivity, syncUserOnChainToFirestore, logAndSyncUserActivity, getActivityIcon } from '../lib/firebaseUser';
const RISE_FARMING_ADDRESS = import.meta.env.VITE_RISE_FARMING_ADDRESS as `0x${string}`;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;
const DURABLE_TOOL_IDS = [17, 18, 6]; // Golden Harvester (Single), Bundle, Auto-Watering System

interface MarketplaceProps {
  isWalletConnected: boolean;
}

interface MarketItem {
  id: number;
  name: string;
  description: string;
  usdPrice: number;
  currency: 'ETH' | 'RT';
  category: 'seeds' | 'tools' | 'upgrades' | 'bundle';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: React.ReactNode;
  level: number;
  benefits: string[];
  riseReward?: number;
  details: string;
  supply: number;
}

// Utility functions for capping and calculating adjusted values
const capBonus = (bonus: number) => Math.max(1.5, Math.min(7, bonus));
const getAdjustedGrowthTime = (base: number, bonus: number) => base * (1 - capBonus(bonus) / 100);
const getAdjustedYield = (base: number, bonus: number) => base * (1 + capBonus(bonus) / 100);

// Helper to format seconds as days/hours
const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days > 0 ? days + 'd ' : ''}${hours}h`;
};

const marketItems: MarketItem[] = [
  {
    id: 9, // Basic Rice Seed (Single)
    name: 'Basic Rice Seed (Single)',
    description: 'A single basic rice seed for everyday farming',
    usdPrice: 1,
    currency: 'ETH',
    category: 'seeds',
    rarity: 'common',
    icon: <span className="text-xl">🌾</span>,
    level: 1,
    benefits: ['Reliable growth', 'Low cost'],
    riseReward: 15,
    details: `Growth time: 8h\nYield: 15 RT\nNo bundle bonus.`,
    supply: 0
  },
  {
    id: 13, // Basic Rice Seed (Bundle)
    name: 'Basic Rice Seed (Bundle)',
    description: 'Bundle of basic rice seeds with a 40% bonus yield and growth',
    usdPrice: 4.5,
    currency: 'ETH',
    category: 'bundle',
    rarity: 'common',
    icon: <span className="text-xl">🌾</span>,
    level: 1,
    benefits: ['+40% yield and growth'],
    riseReward: 21,
    details: `Growth time: 4.8h (reduced by 40%)\nYield: 21 RT (increased by 40%)`,
    supply: 0
  },
  {
    id: 10, // Premium Rice Seed (Single)
    name: 'Premium Rice Seed (Single)',
    description: 'A single premium rice seed with higher yield',
    usdPrice: 3,
    currency: 'ETH',
    category: 'seeds',
    rarity: 'rare',
    icon: <span className="text-xl">🌾</span>,
    level: 2,
    benefits: ['Faster growth', 'Higher yield'],
    riseReward: 50,
    details: `Growth time: 6h\nYield: 50 RT\nNo bundle bonus.`,
    supply: 0
  },
  {
    id: 14, // Premium Rice Seed (Bundle)
    name: 'Premium Rice Seed (Bundle)',
    description: 'Bundle of premium rice seeds with a 20% bonus yield and growth',
    usdPrice: 5.5,
    currency: 'ETH',
    category: 'bundle',
    rarity: 'rare',
    icon: <span className="text-xl">🌾</span>,
    level: 2,
    benefits: ['+20% yield and growth'],
    riseReward: 60,
    details: `Growth time: 4.8h (reduced by 20%)\nYield: 60 RT (increased by 20%)`,
    supply: 0
  },
  {
    id: 11, // Hybrid Rice Seed (Single)
    name: 'Hybrid Rice Seed (Single)',
    description: 'A single hybrid rice seed with unique properties',
    usdPrice: 5,
    currency: 'ETH',
    category: 'seeds',
    rarity: 'legendary',
    icon: <span className="text-xl">🌾</span>,
    level: 3,
    benefits: ['Unique properties', 'Legendary yield'],
    riseReward: 70,
    details: `Growth time: 4h\nYield: 70 RT\nNo bundle bonus.`,
    supply: 0
  },
  {
    id: 15, // Hybrid Rice Seed (Bundle)
    name: 'Hybrid Rice Seed (Bundle)',
    description: 'Bundle of hybrid rice seeds with a 21.43% bonus yield and growth',
    usdPrice: 9,
    currency: 'ETH',
    category: 'bundle',
    rarity: 'legendary',
    icon: <span className="text-xl">🌾</span>,
    level: 3,
    benefits: ['+21.43% yield and growth'],
    riseReward: 84,
    details: `Growth time: 3.14h (reduced by 21.43%)\nYield: 84 RT (increased by 21.43%)`,
    supply: 0
  },
  {
    id: 17, // Golden Harvester (Single)
    name: 'Golden Harvester (Single)',
    description: 'Harvests a single plot with +20% bonus tokens',
    usdPrice: 2,
    currency: 'ETH',
    category: 'tools',
    rarity: 'legendary',
    icon: <Scissors className="w-6 h-6 text-yellow-600" />,
    level: 4,
    benefits: ['Single-plot harvest', '+20% bonus tokens', 'Instant harvesting'],
    details: 'Golden Harvester (Single): Instantly harvests one plot and grants 20% bonus RT tokens per harvest. Required for single-plot harvests.',
    supply: 0
  },
  {
    id: 16, // Golden Harvester (Bundle)
    name: 'Golden Harvester (Bundle)',
    description: 'Bundle of Golden Harvesters',
    usdPrice: 4, // Discounted price
    currency: 'ETH',
    category: 'bundle',
    rarity: 'legendary',
    icon: <Scissors className="w-6 h-6 text-yellow-600" />,
    level: 4,
    benefits: ['2x Golden Harvesters'],
    details: 'Golden Harvester Bundle: Two Golden Harvesters for large-scale farming.',
    supply: 0
  },
  {
    id: 12, // Fertilizer Spreader
    name: 'Fertilizer Spreader',
    description: 'Required to revive a harvested plot after cooldown. Not used for boosting growth or yield.',
    usdPrice: 50,
    currency: 'RT',
    category: 'tools',
    rarity: 'rare',
    icon: <Zap className="w-6 h-6 text-green-500" />,
    level: 3,
    benefits: ['Revives harvested plots after cooldown'],
    details: 'Fertilizer Spreader: Use this to unlock a harvested plot for planting after the cooldown period. It does not boost growth speed or yield.',
    supply: 0
  },
  {
    id: 6, // Auto-Watering System
    name: 'Auto-Watering System',
    description: 'Automatically waters your crops every 6 hours',
    usdPrice: 50,
    currency: 'RT',
    category: 'tools',
    rarity: 'epic',
    icon: <Droplets className="w-6 h-6 text-blue-500" />,
    level: 2,
    benefits: ['Auto-watering', 'Saves energy', '6h intervals'],
    details: 'Auto-Watering System: Automatically waters all your crops every 6 hours, saving you energy and ensuring optimal crop quality. Essential for busy farmers.',
    supply: 0
  },
  {
    id: 5, // Watering Can
    name: 'Watering Can',
    description: 'Waters your crops to improve growth and quality',
    usdPrice: 1, // or whatever you want to display
    currency: 'ETH', // or 'RT' if you want to use Rice Tokens
    category: 'tools',
    rarity: 'common',
    icon: <Droplets className="w-6 h-6 text-blue-400" />,
    level: 1,
    benefits: ['+40% water level', 'Improved crop quality'],
    details: 'Use this tool to water your crops and keep them healthy. Each use increases water level by 40%.',
    supply: 50000
  },
  {
    id: 19, // Energy Booster
    name: 'Energy Booster',
    description: 'Replenish your energy to continue farming',
    usdPrice: 25,
    currency: 'RT',
    category: 'upgrades',
    rarity: 'epic',
    icon: <Zap className="w-6 h-6 text-yellow-500" />,
    level: 1,
    benefits: ['+5 energy', 'Continue farming'],
    details: 'Energy Booster: Replenish your energy by 5 points. Required for farming actions like planting, watering, and harvesting.',
    supply: 0
  },
];

function BuyModal({ open, item, onClose, onConfirm, pending, success, bundleBreakdown, quantity, setQuantity }: { open: boolean, item: MarketItem | null, onClose: () => void, onConfirm: () => void, pending: boolean, success: boolean, bundleBreakdown?: string[], quantity: number, setQuantity: (q: number) => void }) {
  const { address } = useAccount();
  const { data: userEnergy } = useContractRead({
    address: RISE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'userEnergy',
    args: address ? [address] : undefined,
  });

  if (!open || !item) return null;

  const isEnergyBooster = item.id === 19;
  const showEnergyWarning = userEnergy !== undefined && Number(userEnergy) <= 2;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button onClick={onClose} className={`absolute top-4 right-4 text-gray-400 hover:text-gray-600 ${pending ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>✕</button>
        <div className="flex flex-col items-center">
          <Box className="w-12 h-12 text-emerald-500 mb-2" />
          <h2 className="text-xl font-bold mb-2">{success ? 'Congratulations!' : 'Confirm Purchase'}</h2>
          {success ? (
            <div className="text-center text-emerald-700 font-semibold text-lg mb-4">
              {isEnergyBooster ? 'Energy replenished! 🎉' : 'Your purchase was successful! 🎉'}
              <br />{isEnergyBooster ? 'You can now continue farming.' : 'Check your inventory for your new item.'}
            </div>
          ) : (
            <div className="mb-4 text-center">
              <div className="text-lg font-semibold">{item.name}</div>
              <div className="text-gray-500 text-sm mb-2">{item.description}</div>
              {isEnergyBooster && showEnergyWarning && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2 text-sm text-red-600">
                  ⚠️ Low energy! This booster will help you continue farming.
                </div>
              )}
              {item.category === 'bundle' && bundleBreakdown && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 mt-2">
                  <div className="font-medium text-emerald-700 mb-1">Bundle Includes:</div>
                  <ul className="text-xs text-gray-700 list-disc list-inside">
                    {bundleBreakdown.map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-center mt-4">
                <label htmlFor="quantity" className="mr-2 font-medium">Quantity:</label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={item.supply || 100}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Math.min(Number(e.target.value), item.supply || 100)))}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
                  disabled={pending}
                />
              </div>
            </div>
          )}
          {!success && (
            <button 
              onClick={onConfirm} 
              disabled={pending || !address} 
              className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl mt-4 transition-opacity ${(pending || !address) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {pending ? 'Buying...' : isEnergyBooster ? 'Replenish Energy' : 'Buy Now'}
            </button>
          )}
        </div>
        {success && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-lg font-semibold">
            Purchase successful!
          </div>
        )}
      </div>
    </div>
  );
}

function Marketplace({ isWalletConnected }: MarketplaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'seeds' | 'tools' | 'upgrades' | 'bundle'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ethPrice, setEthPrice] = useState<number>(3500);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const { address } = useAccount();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const { openConnectModal } = useConnectModal();
  const [showDetailsIdx, setShowDetailsIdx] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  const itemIds = marketItems.map(item => item.id);
  const bundleIds = marketItems.filter(item => item.category === 'bundle').map(item => item.id);
  const { data: itemsRaw } = useContractReads({
    contracts: itemIds.map(id => ({
      address: RISE_FARMING_ADDRESS,
      abi: RiseFarmingABI as any,
      functionName: 'items',
      args: [id],
    })),
  });
  const supplies = itemsRaw?.map((item: any) =>
    item && typeof item === 'object' && 'result' in item && Array.isArray(item.result)
      ? item.result[11]
      : '...'
  );

  // Fetch bundle data for all bundle IDs
  const { data: bundlesRaw } = useContractReads({
    contracts: bundleIds.map(id => ({
      address: RISE_FARMING_ADDRESS,
      abi: RiseFarmingABI as any,
      functionName: 'bundles',
      args: [id],
    })),
  });
  const bundleDataMap = new Map();
  bundleIds.forEach((id, idx) => {
    const bundle = bundlesRaw?.[idx]?.result;
    if (bundle) {
      bundleDataMap.set(id, bundle);
    }
  });

  // Fetch tool uses for the connected user
  const { data: toolUsesSingle } = useContractRead({
    address: RISE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'userToolUses',
    args: address ? [address, 17] : undefined,
  });
  const { data: toolUsesBundle } = useContractRead({
    address: RISE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'userToolUses',
    args: address ? [address, 18] : undefined,
  });
  const { data: toolUsesAuto } = useContractRead({
    address: RISE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'userToolUses',
    args: address ? [address, 6] : undefined,
  });

  const { data: userEnergy } = useContractRead({
    address: RISE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'userEnergy',
    args: address ? [address] : undefined,
  });

  // Add energy warning tooltip
  const showEnergyWarning = userEnergy !== undefined && Number(userEnergy) <= 2;

  const { data: onChainRiceTokens } = useContractRead({
    address: RISE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'riceTokens',
    args: address ? [address] : undefined,
  });
  const { data: onChainXP } = useContractRead({
    address: RISE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'totalXP',
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
      .then(res => res.json())
      .then(data => {
        if (data.price) setEthPrice(parseFloat(data.price));
      });
  }, []);

  const filteredItems = marketItems.filter((item: MarketItem) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Contract write for single item (ETH)
  const { writeContract: writeSingle } = useContractWrite({
    mutation: {
      onSuccess(data: any) {
        setTxHash(data.hash || data);
        setPending(true);
      },
      onError(error) {
        setPending(false);
        alert("Transaction failed: " + error.message);
        console.error("writeSingle error:", error);
      }
    },
  });
  // Contract write for bundles (ETH)
  const { writeContract: writeBundle } = useContractWrite({
    mutation: {
      onSuccess(data: any) {
        setTxHash(data.hash || data);
        setPending(true);
      },
      onError(error) {
        setPending(false);
        alert("Transaction failed: " + error.message);
        console.error("writeBundle error:", error);
      }
    },
  });
  // Contract write for RT-priced items
  const { writeContract: writeRT } = useContractWrite({
    mutation: {
      onSuccess(data: any) {
        setTxHash(data.hash || data);
        setPending(true);
      },
      onError(error) {
        setPending(false);
        alert("Transaction failed: " + error.message);
        console.error("writeRT error:", error);
      }
    },
  });
  // Wait for transaction
  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Place the activity logging useEffect here, after all hooks and state
  useEffect(() => {
    if (txSuccess && selectedItem && address && onChainRiceTokens !== undefined && onChainXP !== undefined) {
      // Determine icon using getActivityIcon
      const icon = getActivityIcon('buy', selectedItem.name);
      // Calculate reward string
      let reward = '';
      if (selectedItem.currency === 'ETH') {
        let ethSpent = 0;
        if (selectedItem.category === 'bundle') {
          const bundle = bundleDataMap.get(selectedItem.id);
          if (bundle && Array.isArray(bundle) && bundle.length >= 3) {
            ethSpent = (Number(bundle[2]) / 1e18) * quantity;
          }
        } else {
          const itemIdx = marketItems.findIndex(m => m.id === selectedItem.id);
          const itemRaw = itemsRaw?.[itemIdx];
          if (itemRaw && typeof itemRaw === 'object' && 'result' in itemRaw && Array.isArray(itemRaw.result)) {
            ethSpent = (Number(itemRaw.result[3]) / 1e18) * quantity;
          }
        }
        reward = `-${ethSpent.toFixed(4)} ETH`;
      } else {
        reward = `-${selectedItem.usdPrice * quantity} RT`;
      }
      // Log to both activity systems for reliability
      addRecentActivity(address, {
        icon,
        action: `Bought ${quantity}x ${selectedItem.name}`,
        time: new Date().toISOString(),
        reward,
        color: 'blue',
        txHash: txHash || undefined,
      });
      logAndSyncUserActivity(address, {
        icon,
        action: `Bought ${quantity}x ${selectedItem.name}`,
        time: new Date().toISOString(),
        reward,
        color: 'blue',
        txHash: txHash || undefined,
      }, {
        riceTokens: Number(onChainRiceTokens),
        totalXP: Number(onChainXP),
      });
    }
  }, [txSuccess, selectedItem, address, txHash, quantity, itemsRaw, bundleDataMap, onChainRiceTokens, onChainXP]);

  // Close buy modal and reset state if wallet disconnects while modal is open
  useEffect(() => {
    if (!address && buyModalOpen) {
      setBuyModalOpen(false);
      setSelectedItem(null);
      setPending(false);
      setSuccess(false);
    }
  }, [address, buyModalOpen]);

  // Helper to get bundle breakdown for BuyModal
  function getBundleBreakdown(bundleId: number): string[] {
    const bundle = bundleDataMap.get(bundleId);
    if (!bundle || !Array.isArray(bundle) || !Array.isArray(bundle[3]) || !Array.isArray(bundle[4])) {
      return ['Unknown bundle contents'];
    }
    const itemIds = bundle[3] as number[];
    const itemAmounts = bundle[4] as number[];
    return itemIds.map((id: number, idx: number) => {
      const meta = marketItems.find((m: MarketItem) => m.id === id);
      return `${itemAmounts[idx]}x ${meta ? meta.name : 'Unknown Item'}`;
    });
  }

  const handleBuy = (item: MarketItem) => {
    if (!address) {
      openConnectModal?.();
      return;
    }
    setSelectedItem(item);
    setQuantity(1);
    setBuyModalOpen(true);
  };

  const handleConfirmBuy = async () => {
    if (!selectedItem || !address) return;
    setPending(true);
    setSuccess(false);
    if (selectedItem.currency === 'ETH') {
      if (selectedItem.category === 'bundle') {
        const bundle = bundleDataMap.get(selectedItem.id);
        const priceETH = (bundle && Array.isArray(bundle) && bundle.length >= 7)
          ? BigInt(bundle[2]) * BigInt(quantity)
          : BigInt(0);
        writeBundle({
          address: RISE_FARMING_ADDRESS,
          abi: RiseFarmingABI as any,
          functionName: 'buyBundle',
          args: [BigInt(selectedItem.id), BigInt(quantity), ZERO_ADDRESS],
          value: priceETH,
          account: address,
        });
      } else {
        // Fetch priceETH from contract data (itemsRaw)
        const itemIdx = marketItems.findIndex(m => m.id === selectedItem.id);
        let priceETH = 0n;
        const itemRaw = itemsRaw?.[itemIdx];
        if (itemRaw && typeof itemRaw === 'object' && 'result' in itemRaw && Array.isArray(itemRaw.result)) {
          priceETH = BigInt(itemRaw.result[3] as string) * BigInt(quantity);
        }
        writeSingle({
          address: RISE_FARMING_ADDRESS,
          abi: RiseFarmingABI as any,
          functionName: 'buyItem',
          args: [BigInt(selectedItem.id), BigInt(quantity), ZERO_ADDRESS],
          value: priceETH,
          account: address,
        });
      }
    } else if (selectedItem.currency === 'RT') {
      if (selectedItem.id === 19) {
        // Energy Booster: call the dedicated function
        writeRT({
          address: RISE_FARMING_ADDRESS,
          abi: RiseFarmingABI as any,
          functionName: 'buyEnergyBooster',
          args: [],
          account: address,
        });
      } else {
        // Other RT-priced items
        writeRT({
          address: RISE_FARMING_ADDRESS,
          abi: RiseFarmingABI as any,
          functionName: 'buyItemWithGameRT',
          args: [BigInt(selectedItem.id), BigInt(quantity)],
          account: address,
        });
      }
    }
  };

  const getCardColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-300 bg-yellow-50';
      case 'epic':
        return 'border-purple-300 bg-purple-50';
      case 'rare':
        return 'border-blue-300 bg-blue-50';
      case 'common':
      default:
        return 'border-emerald-200 bg-emerald-50';
    }
  };

  // Create a map from item ID to supply
  const supplyMap = new Map(marketItems.map((item: MarketItem, idx: number) => [item.id, supplies?.[idx] ?? '...']));

  useEffect(() => {
    if (txSuccess) {
      setPending(false);
      setSuccess(true);
      // Optionally auto-close the modal after a short delay
      // setTimeout(() => {
      //   setSuccess(false);
      //   setBuyModalOpen(false);
      //   setSelectedItem(null);
      // }, 2000);
    }
  }, [txSuccess]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-green-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Marketplace</h1>
            <p className="text-gray-600">Upgrade your farm with premium seeds and tools</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Energy Display */}
            {address && (
              <div className="flex items-center space-x-2">
                <Zap className={`w-5 h-5 ${showEnergyWarning ? 'text-red-500' : 'text-yellow-500'}`} />
                <span className="text-sm font-medium">
                  Energy: {userEnergy?.toString() || '0'}
                </span>
                {showEnergyWarning && (
                  <div className="relative group">
                    <Info className="w-4 h-4 text-red-500 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-red-200 rounded-lg p-2 text-xs text-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      Low energy! Buy an Energy Booster to continue farming.
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">{marketItems.length} items available</span>
            </div>
          </div>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-green-100">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            {(['all', 'seeds', 'tools', 'upgrades', 'bundle'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                  selectedCategory === category
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-3 text-center text-gray-400 py-8">No items available.</div>
        ) : (
          filteredItems.map((item: MarketItem, idx: number) => {
            // Find the index in marketItems to get the correct supply
            const itemIdx = marketItems.findIndex(m => m.id === item.id);
            // For bundles, get priceETH and supply from contract
            let ethAmount;
            let supply;
            if (item.category === 'bundle') {
              const bundle = bundleDataMap.get(item.id);
              // Defensive: check bundle exists and is an array of length >= 7
              if (bundle && Array.isArray(bundle) && bundle.length >= 7) {
                ethAmount = (Number(bundle[2]) / 1e18).toFixed(6); // priceETH
                supply = bundle[6].toString(); // supply
              } else {
                ethAmount = undefined;
                supply = '...';
              }
            } else {
              ethAmount = item.currency === 'ETH' ? (item.usdPrice / ethPrice).toFixed(6) : undefined;
              supply = supplyMap.get(item.id) !== undefined && supplyMap.get(item.id) !== '...'
                ? supplyMap.get(item.id).toString()
                : '...';
            }
            return (
              <div
                key={item.id}
                className={`rounded-xl border-2 ${getCardColor(item.rarity)} p-6 shadow-sm transition-transform duration-200 hover:shadow-lg hover:scale-[1.03] flex flex-col justify-between min-w-[220px] max-w-xs mx-auto relative`}
                onMouseEnter={() => setShowDetailsIdx(idx)}
                onMouseLeave={() => setShowDetailsIdx(null)}
                onClick={() => setShowDetailsIdx(idx)}
                tabIndex={0}
                onBlur={() => setShowDetailsIdx(null)}
              >
                {/* Rice icon and supply in top right */}
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1">
                    {item.icon}
                    <span className="text-xs font-semibold text-gray-700 ml-1">Lv{item.level}</span>
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5 ml-2 flex items-center gap-1">
                    Supply: {supply}
                    <span className="relative group">
                      <Info className="w-3 h-3 text-blue-400 ml-1 cursor-pointer" />
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 bg-white border border-gray-300 rounded shadow-lg p-2 text-xs text-gray-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        Buying a bundle reduces both the bundle supply and the single seed supply. The total number of seeds distributed will never exceed 10,000.
                      </span>
                    </span>
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-gray-800 mb-1 flex items-center gap-1">
                    {item.name}
                    {item.rarity === 'legendary' && <span className="ml-1">⭐</span>}
                    {item.rarity === 'epic' && <span className="ml-1">⚡</span>}
                    {item.rarity === 'rare' && <span className="ml-1">↗</span>}
                    {item.rarity === 'common' && <span className="ml-1">🪙</span>}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1 leading-tight">{item.description}</p>
                  <div className="mb-1">
                    <span className="block text-xs font-medium text-gray-700">Benefits:</span>
                    <ul className="list-disc list-inside text-xs text-gray-500 space-y-0.5">
                      {item.benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-sm text-emerald-600">
                    {item.currency === 'ETH' ? `${ethAmount} ETH` : `${item.usdPrice} RT`}
                  </span>
                  {item.currency === 'ETH' && (
                    <span className="text-xs text-gray-500">≈ ${item.usdPrice.toFixed(2)}</span>
                  )}
                  <button
                    className="ml-2 px-3 py-1 rounded bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuy(item);
                    }}
                    disabled={!isWalletConnected}
                  >
                    Buy Now
                  </button>
                </div>
                {showDetailsIdx === idx && (
                  <div className="absolute z-50 top-2 left-1/2 -translate-x-1/2 w-72 bg-white border border-gray-300 rounded-xl shadow-xl p-4 text-xs text-gray-700">
                    <strong>Details:</strong>
                    <div className="mt-1 whitespace-pre-line">{item.details}</div>
                    {DURABLE_TOOL_IDS.includes(item.id) && address && (
                      <div className="text-xs text-yellow-700 mt-1">Uses left: {item.id === 17 ? Number(toolUsesSingle) : item.id === 18 ? Number(toolUsesBundle) : Number(toolUsesAuto)}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {!isWalletConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-yellow-700">
            Connect your wallet to purchase items from the marketplace
          </p>
        </div>
      )}
      <BuyModal 
        open={buyModalOpen}
        item={selectedItem}
        onClose={() => setBuyModalOpen(false)}
        onConfirm={handleConfirmBuy}
        pending={pending}
        success={success}
        bundleBreakdown={selectedItem && selectedItem.category === 'bundle' ? selectedItem.benefits : undefined}
        quantity={quantity}
        setQuantity={setQuantity}
      />
    </div>
  );
}

export default Marketplace;
export type { MarketItem };
export { marketItems };
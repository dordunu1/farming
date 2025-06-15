import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Scissors, Clock, Sparkles, AlertCircle, Sprout } from 'lucide-react';
import PlantModal from './PlantModal';
import TransactionModal from './TransactionModal';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updatePlotProgress, onUserDataSnapshot, getUserData } from '../lib/firebaseUser';
import CircularProgressBar from './CircularProgressBar';
import { marketItems } from './Marketplace';
import { useContractRead, useContractReads } from 'wagmi';
import RiseFarmingABI from '../abi/RiseFarming.json';
import { useAccount } from 'wagmi';
import type { Abi } from 'viem';
import { useWallet as useInGameWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';

// Define FERTILIZER_SPREADER_ID constant (should match Marketplace/Inventory)
const FERTILIZER_SPREADER_ID = 12; // Fertilizer Spreader ID

// Add 'needsWater' to PlotStatus type
type PlotStatus = 'empty' | 'growing' | 'ready' | 'watering' | 'withering' | 'needsWater';

// Add PlotState enum mapping for clarity
const PlotState = {
  Empty: 0,
  NeedsWater: 1,
  Growing: 2,
  Ready: 3,
  Locked: 4,
} as const;

interface FarmGridProps {
  isWalletConnected: boolean;
  energy: number;
  setEnergy: (energy: number) => void;
  riceTokens: number;
  setRiceTokens: (tokens: number) => void;
  plots: Plot[];
  setPlots: React.Dispatch<React.SetStateAction<Plot[]>>;
  waterCans: number;
}

interface Plot {
  id: number;
  status: PlotStatus;
  cropType: string;
  progress: number;
  timeRemaining?: number; // in minutes
  plantedAt?: number;
  lastWatered?: number;
  waterLevel: number; // 0-100
  quality: 'poor' | 'good' | 'excellent' | 'perfect';
  expectedYield: number;
  readyAt?: number;
  _lastFirestoreUpdate?: number;
  yieldBonusBP?: number;
  rarity: 'common' | 'rare' | 'legendary';
  harvestedAt?: number;
  needsFertilizer?: boolean;
  startedGrowing?: boolean;
  seedId?: number;
  growing?: boolean;
  state: number;
}

// Replace the hardcoded RISE_FARMING_ADDRESS with the generic one
const FARMING_ADDRESS = import.meta.env.VITE_FARMING_ADDRESS;

function LockedOverlay({ harvestedAt }: { harvestedAt: number }) {
  const [countdown, setCountdown] = React.useState(0);
  React.useEffect(() => {
    if (harvestedAt) {
      const interval = setInterval(() => {
        const nowSec = Math.floor(Date.now() / 1000);
        const unlockSec = harvestedAt + 2 * 60; // 2 minutes
        setCountdown(Math.max(0, unlockSec - nowSec));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [harvestedAt]);
  return (
    <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center rounded-2xl border-4 border-yellow-400">
      <div className="text-white text-center">
        <div className="mb-2 text-lg font-bold flex items-center justify-center">
          <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17a2 2 0 002-2v-2a2 2 0 00-4 0v2a2 2 0 002 2zm6-2v-2a6 6 0 10-12 0v2a2 2 0 002 2h8a2 2 0 002-2z"/></svg>
          Plot Locked
        </div>
        <div className="mb-2 text-sm">This plot is locked for a cooldown period after harvest.<br />It will be available for planting after the cooldown <b>and</b> applying Fertilizer.</div>
        <div className="mt-2 text-gray-200 font-semibold text-base flex items-center justify-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8a6 6 0 10-12 0v2a2 2 0 002 2h8a2 2 0 002-2V8z"/></svg>
          {countdown > 0
            ? `Available to revive in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')} minutes`
            : 'Ready to revive!'}
        </div>
      </div>
    </div>
  );
}

function FarmGrid({ isWalletConnected, energy, setEnergy, riceTokens, setRiceTokens, plots, setPlots, waterCans }: FarmGridProps) {
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showReviveModal, setShowReviveModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'water' | 'harvest'>('water');
  const { address } = useAccount();
  const { wallet: inGameWallet, isLoading: walletLoading, error: walletError } = useInGameWallet(address);
  const inGameAddress = inGameWallet?.address;
  const [firestorePlots, setFirestorePlots] = useState<Plot[]>([]);
  const [firestoreEnergy, setFirestoreEnergy] = useState<number | null>(null);

  // Remove useContractWrite for revivePlot and related logic
  // Refactor revivePlot to use ethers.js
  const [isRevivePending, setIsRevivePending] = useState(false);
  const [isReviveSuccess, setIsReviveSuccess] = useState(false);
  const [reviveTxHash, setReviveTxHash] = useState<string | null>(null);

  // Refactor fertilizerCount fetch to use ethers.js
  const [fertilizerCount, setFertilizerCount] = useState<number>(0);
  useEffect(() => {
    async function fetchFertilizer() {
      if (!inGameWallet) return;
      const rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL || import.meta.env.VITE_RPC_URL;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(FARMING_ADDRESS, RiseFarmingABI as any, provider);
      try {
        const count = await contract.userItemBalances(address, FERTILIZER_SPREADER_ID);
        setFertilizerCount(Number(count));
      } catch (e) {
        setFertilizerCount(0);
      }
    }
    if (address && inGameWallet) fetchFertilizer();
  }, [address, inGameWallet]);

  // Fetch all plots from the contract
  const NUM_PLOTS = 16;
  const plotIds = Array.from({ length: NUM_PLOTS }, (_, i) => i + 1);
  const { data: onChainPlots, refetch: refetchOnChainPlots } = useContractReads({
    contracts: inGameAddress
      ? plotIds.map((id) => ({
          address: FARMING_ADDRESS,
          abi: RiseFarmingABI as Abi,
          functionName: 'userPlots',
          args: [inGameAddress, id],
        }))
      : []
  });

  // Subscribe to Firestore user data for real-time updates
  useEffect(() => {
    if (!address) return;
    const unsub = onUserDataSnapshot(address, (user) => {
      if (user && Array.isArray(user.plots)) {
        // Patch Firestore plots to ensure all required fields exist
        const patchedPlots = user.plots.map((p: any, idx: number) => ({
          ...p,
          rarity: p.rarity || 'common',
          state: typeof p.state === 'number' ? p.state : 0,
        }));
        setFirestorePlots(patchedPlots);
      }
      if (user && typeof user.energy === 'number') {
        setFirestoreEnergy(user.energy);
      }
    });
    return () => unsub && unsub();
  }, [address]);

  // Merge on-chain and Firestore plot data
  useEffect(() => {
    if (onChainPlots && Array.isArray(onChainPlots)) {
      const mappedPlots = onChainPlots.map((result, idx) => {
        const p = (result as any)?.result;
        if (!p) return plots[idx] || {};
        // ABI: [seedId, plantedAt, readyAt, growthBonusBP, yieldBonusBP, growing, harvestedAt, needsFertilizer, startedGrowing, state]
        const now = Date.now() / 1000;
        let state = p[9]; // state from contract
        if (p[5] === true && p[2] > 0 && now >= Number(p[2]) + 60) {
          state = PlotState.Ready;
        }
        let status: Plot['status'] = 'empty';
        switch (state) {
          case PlotState.Empty:
            status = 'empty';
            break;
          case PlotState.NeedsWater:
            status = 'needsWater';
            break;
          case PlotState.Growing:
            status = 'growing';
            break;
          case PlotState.Ready:
            status = 'ready';
            break;
          case PlotState.Locked:
            status = 'withering';
            break;
          default:
            status = 'empty';
        }
        const seedNames: Record<number, string> = {
          9: 'Basic Rice Seed',
          10: 'Premium Rice Seed',
          11: 'Hybrid Rice Seed',
        };
        let cropType = '';
        if (p[0] && p[0] !== 0) {
          cropType = seedNames[p[0]] || `Seed #${p[0]}`;
        }
        let expectedYield = 0;
        // Map all known seed IDs to their correct yields (from contract and marketplace)
        if (p[0] === 9) expectedYield = 15; // Basic Rice Seed (Single)
        else if (p[0] === 10) expectedYield = 50; // Premium Rice Seed (Single)
        else if (p[0] === 11) expectedYield = 70; // Hybrid Rice Seed (Single)
        else if (p[0] === 13) expectedYield = 21; // Basic Rice Seed (Bundle)
        else if (p[0] === 14) expectedYield = 60; // Premium Rice Seed (Bundle)
        else if (p[0] === 15) expectedYield = 84; // Hybrid Rice Seed (Bundle, updated to 84 RT)
        // Apply yield bonus if present
        if (p[0] !== 0 && p[4] > 0) {
          expectedYield = Math.round(expectedYield * (1 + Number(p[4]) / 1000));
        }
        // Merge Firestore waterLevel and quality
        let waterLevel = 0;
        let quality: Plot['quality'] = 'poor';
        let lastWatered = undefined;
        let progress = 0;
        let timeRemaining = undefined;
        if (firestorePlots[idx]) {
          waterLevel = firestorePlots[idx].waterLevel;
          quality = firestorePlots[idx].quality;
          lastWatered = firestorePlots[idx].lastWatered;
          progress = firestorePlots[idx].progress;
          timeRemaining = firestorePlots[idx].timeRemaining;
        }
        return {
          ...plots[idx],
          id: idx + 1,
          seedId: p[0],
          plantedAt: Number(p[1]),
          readyAt: Number(p[2]),
          growthBonusBP: Number(p[3]),
          yieldBonusBP: Number(p[4]),
          growing: p[5],
          harvestedAt: Number(p[6]),
          needsFertilizer: p[7],
          startedGrowing: p[8],
          state,
          status,
          cropType,
          expectedYield,
          waterLevel,
          quality,
          lastWatered,
          progress,
          timeRemaining,
        };
      });
      setPlots(mappedPlots);
    }
    // eslint-disable-next-line
  }, [onChainPlots, firestorePlots]);

  // Helper to check if a plot is ready to revive
  const isReadyToRevive = (plot: Plot) => {
    if (!plot.needsFertilizer || !plot.harvestedAt) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= plot.harvestedAt + 2 * 60; // 2 minutes
  };

  // Handler for clicking a plot
  const handlePlotClick = (plot: Plot) => {
    if (!isWalletConnected) return;
    switch (plot.state) {
      case PlotState.Locked:
        setSelectedPlot(plot.id);
        setShowReviveModal(true);
        break;
      case PlotState.Ready:
        setSelectedPlot(plot.id);
        setTransactionType('harvest');
        setShowTransactionModal(true);
        break;
      case PlotState.Empty:
        setSelectedPlot(plot.id);
        setShowPlantModal(true);
        break;
      case PlotState.NeedsWater:
        setSelectedPlot(plot.id);
        setTransactionType('water');
        setShowTransactionModal(true);
        break;
      default:
        break;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPlotStyle = (plot: Plot & { quality?: string }) => {
    const baseStyle = "aspect-square rounded-2xl border-2 p-3 cursor-pointer transition-all duration-300 hover:scale-105 relative overflow-hidden";
    let qualityBorder = '';
    if (plot.quality === 'poor') qualityBorder = ' border-red-400';
    else if (plot.quality === 'good' || plot.quality === 'excellent') qualityBorder = ' border-blue-400';
    else qualityBorder = ' border-gray-300';
    switch (plot.status) {
      case 'empty':
        return `${baseStyle} border-dashed bg-gradient-to-br from-gray-50 to-gray-100 hover:border-emerald-300 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50${qualityBorder}`;
      case 'growing':
        return `${baseStyle} bg-gradient-to-br from-emerald-100 to-green-200 shadow-lg${qualityBorder}`;
      case 'ready':
        return `${baseStyle} border-yellow-400 bg-gradient-to-br from-yellow-100 to-orange-200 shadow-xl animate-pulse`;
      case 'watering':
        return `${baseStyle} border-blue-300 bg-gradient-to-br from-blue-100 to-cyan-200 shadow-lg`;
      case 'withering':
        return `${baseStyle} border-red-300 bg-gradient-to-br from-red-100 to-orange-200 shadow-lg`;
      default:
        return baseStyle + qualityBorder;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'perfect': return 'text-purple-600';
      case 'excellent': return 'text-emerald-600';
      case 'good': return 'text-blue-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPlotIcon = (plot: Plot) => {
    switch (plot.status) {
      case 'empty':
        return <Sprout className="w-8 h-8 text-emerald-500 drop-shadow-md" />;
      case 'growing':
        return (
          <motion.div 
            className="flex flex-col items-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-4 h-4 bg-emerald-500 rounded-full mb-1"></div>
            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            <div className="w-2 h-2 bg-emerald-300 rounded-full mt-1"></div>
          </motion.div>
        );
      case 'ready':
        return (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Scissors className="w-6 h-6 text-yellow-600" />
          </motion.div>
        );
      case 'watering':
        return (
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Droplets className="w-6 h-6 text-blue-600" />
          </motion.div>
        );
      case 'withering':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return null;
    }
  };

  // Calculate Farm Value (expected yield in RT)
  const nonEmptyPlots = plots.filter(p => p.status !== 'empty');
  const totalYield = nonEmptyPlots.reduce((sum, p) => sum + (p.expectedYield || 0), 0);
  // Find the best-yielding seed from marketItems
  const bestSeed = marketItems
    .filter(item => item.category === 'seeds' && typeof item.riseReward === 'number')
    .reduce((max, item) => (item.riseReward! > (max?.riseReward || 0) ? item : max), null as null | typeof marketItems[0]);
  const maxYieldPerPlot = bestSeed?.riseReward || 0;
  const maxPossibleYield = plots.length * maxYieldPerPlot;
  const farmValuePercent = maxPossibleYield > 0 ? Math.round((totalYield / maxPossibleYield) * 100) : 0;

  // Refactored revivePlot function
  const revivePlot = async (plotId: number) => {
    if (!address || !inGameWallet) return;
    setIsRevivePending(true);
    setIsReviveSuccess(false);
    try {
      const rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL || import.meta.env.VITE_RPC_URL;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(inGameWallet.privateKey, provider);
      const contract = new ethers.Contract(FARMING_ADDRESS, RiseFarmingABI as any, wallet);
      const tx = await contract.revivePlot(plotId);
      setReviveTxHash(tx.hash);
      await tx.wait();
      setIsRevivePending(false);
      setIsReviveSuccess(true);
      // Optionally refetch plots here
      refetchOnChainPlots();
    } catch (error: any) {
      setIsRevivePending(false);
      setIsReviveSuccess(false);
      alert('Revive transaction failed: ' + (error && error.message ? error.message : String(error)));
    }
  };

  return (
    <>
      {/* Inline biome CSS for immediate visual effect */}
      <style>{`
        .biome-plot {
          background: linear-gradient(to top, #b6e388 60%, #e9f7ef 100%);
          border-radius: 24px 24px 32px 32px;
          box-shadow: 0 4px 16px rgba(60,80,40,0.08);
          overflow: visible;
        }
        .biome-soil {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 28%;
          background: radial-gradient(ellipse at 50% 100%, #a67c52 80%, #7c5a36 100%);
          border-radius: 0 0 32px 32px;
          z-index: 1;
        }
        .biome-grass {
          position: absolute;
          bottom: 22%;
          left: 10%;
          width: 80%;
          height: 12px;
          background: linear-gradient(90deg, #7ec850 60%, #b6e388 100%);
          border-radius: 8px 8px 12px 12px;
          z-index: 2;
          box-shadow: 0 2px 8px rgba(60,80,40,0.08);
        }
      `}</style>
      <div className="grid grid-cols-4 gap-4">
        {plots.map((plot, idx) => {
          // Show locked state if plot.needsFertilizer is true
          const showLocked = plot.needsFertilizer;

          // Calculate progress and time left based on plantedAt and readyAt (on-chain)
          let growthProgress = 0;
          let timeLeft = 0;
          let isReady = false;
          if (plot.status !== 'empty' && plot.plantedAt && plot.readyAt) {
            const now = Date.now();
            const plantedAtMs = plot.plantedAt * 1000;
            const readyAtMs = plot.readyAt * 1000;
            const total = readyAtMs - plantedAtMs;
            const elapsed = now - plantedAtMs;
            growthProgress = Math.min(1, elapsed / total);
            timeLeft = Math.max(0, Math.ceil((readyAtMs - now) / 60000)); // in minutes
            isReady = now >= readyAtMs;
          }
          // --- Yield tooltip logic ---
          let yieldBonus = 0;
          let expectedYield = plot.expectedYield;
          if (plot.yieldBonusBP) {
            yieldBonus = plot.yieldBonusBP / 100;
            expectedYield = Math.round(plot.expectedYield * (1 + yieldBonus / 100));
          }
          // Determine plant icon based on status
          let plantIcon: React.ReactNode = '🌱';
          let plantStage: 'small' | 'medium' | 'large' | 'ready' = 'small';
          let plantSize = 32;
          if (plot.status === 'ready') {
            plantStage = 'ready';
            plantIcon = <Scissors className="w-10 h-10 text-yellow-600" />;
            plantSize = 64;
          } else if (growthProgress < 0.33) {
            plantStage = 'small';
            plantIcon = '🌱';
            plantSize = 32;
          } else if (growthProgress < 0.66) {
            plantStage = 'medium';
            plantIcon = '🌿';
            plantSize = 44;
          } else {
            plantStage = 'large';
            plantIcon = '🌾';
            plantSize = 56;
          }
          const waterBar = Math.max(0, plot.waterLevel);
          // Determine status for rendering
          let renderStatus = plot.status;
          if (plot.status !== 'empty' && isReady) {
            renderStatus = 'ready';
          }
          // --- Render ---
          const nowSec = Math.floor(Date.now() / 1000);
          const canRevive = plot.needsFertilizer && plot.harvestedAt && (nowSec >= plot.harvestedAt + 60 * 60 * 24 * 21); // 3 weeks
          return (
            <motion.div
              key={plot.id}
              className={getPlotStyle({ ...plot, status: renderStatus, quality: plot.quality }) + ' relative biome-plot'}
              onClick={() => {
                if (!isWalletConnected) return;
                if (plot.needsFertilizer && isReadyToRevive(plot)) {
                  setSelectedPlot(plot.id);
                  setShowReviveModal(true);
                  return;
                }
                if (plot.status === 'ready') {
                  setSelectedPlot(plot.id);
                  setTransactionType('harvest');
                  setShowTransactionModal(true);
                } else if (plot.status === 'empty') {
                  setSelectedPlot(plot.id);
                  setShowPlantModal(true);
                } else if (plot.status === 'needsWater') {
                  setSelectedPlot(plot.id);
                  setTransactionType('water');
                  setShowTransactionModal(true);
                } else if (plot.status === 'growing' || plot.status === 'watering' || plot.status === 'withering') {
                  setSelectedPlot(plot.id);
                  setTransactionType('water');
                  setShowTransactionModal(true);
                }
              }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              layout
              style={{ minHeight: 260, maxHeight: 280, height: 260, padding: 0 }}
              title={renderStatus === 'ready' && plot.expectedYield > 0
                ? `Expected Yield: ${expectedYield} RT`
                : plot.status !== 'empty'
                  ? `${plot.cropType} (Quality: ${plot.quality})`
                  : 'Tap to plant'}
            >
              {/* Locked badge/icon */}
              {showLocked && (
                <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold z-40 flex items-center shadow-lg">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17a2 2 0 002-2v-2a2 2 0 00-4 0v2a2 2 0 002 2zm6-2v-2a6 6 0 10-12 0v2a2 2 0 002 2h8a2 2 0 002-2z"/></svg>
                  Locked
                </div>
              )}
              {showLocked && <LockedOverlay harvestedAt={plot.harvestedAt || 0} />}
              <div style={{ width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
                {/* Biome soil and grass layers (SVG for realism) */}
                <div className="biome-soil-svg" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '76px', zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
                  <svg width="100%" height="76" viewBox="0 0 200 76" preserveAspectRatio="none" style={{ display: 'block' }}>
                    <path d="M0,30 Q50,0 100,30 T200,30 V76 H0 Z" fill="#a67c52" />
                    <ellipse cx="50" cy="66" rx="8" ry="3" fill="#7c5a36" opacity="0.3" />
                    <ellipse cx="150" cy="71" rx="10" ry="4" fill="#7c5a36" opacity="0.2" />
                  </svg>
                </div>
                <div className="biome-grass-svg" style={{ position: 'absolute', bottom: '68px', left: 0, width: '100%', height: '20px', zIndex: 2 }}>
                  <svg width="100%" height="20" viewBox="0 0 200 20" preserveAspectRatio="none">
                    <path d="M10,20 Q15,5 20,20" stroke="#7ec850" strokeWidth="3" fill="none" />
                    <path d="M30,20 Q35,0 40,20" stroke="#7ec850" strokeWidth="3" fill="none" />
                    <path d="M60,20 Q65,10 70,20" stroke="#6bbf59" strokeWidth="2" fill="none" />
                    <path d="M90,20 Q95,8 100,20" stroke="#7ec850" strokeWidth="3" fill="none" />
                    <path d="M120,20 Q125,3 130,20" stroke="#6bbf59" strokeWidth="2" fill="none" />
                    <path d="M160,20 Q165,7 170,20" stroke="#7ec850" strokeWidth="3" fill="none" />
                  </svg>
                </div>
                {/* Circular progress bars and timer badge (top left) */}
                {plot.status !== 'empty' && (
                  <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <CircularProgressBar value={Math.round(growthProgress * 100)} size={44} strokeWidth={6} color="#34d399" bgColor="#e5e7eb" label={Math.round(growthProgress * 100) + '%'} />
                    <CircularProgressBar value={Math.round(plot.waterLevel || 0)} size={32} strokeWidth={5} color="#60a5fa" bgColor="#e5e7eb" label={''} />
                  </div>
                )}
                {/* Timer as small horizontal text in top right */}
                {renderStatus !== 'empty' && renderStatus !== 'ready' && timeLeft > 0 && (
                  <div style={{ position: 'absolute', top: 10, right: 14, zIndex: 10, fontSize: 12, color: '#444', fontWeight: 400, background: 'rgba(255,255,255,0.7)', borderRadius: 4, padding: '1px 6px' }}>
                    {formatTime(timeLeft)}
                  </div>
                )}
                {/* Seed name always visible above soil */}
                <div className="w-full flex flex-col items-center" style={{ position: 'absolute', top: 12, left: 0, zIndex: 20, pointerEvents: 'none' }}>
                  <p className="text-xs font-bold text-gray-700" style={{ textAlign: 'center' }}>Plot #{plot.id}</p>
                  <p className="text-xs text-gray-600 mt-1 truncate mb-2" style={{ textAlign: 'center', maxWidth: '90%' }}>{plot.cropType}</p>
                </div>
                <div className="flex flex-col items-center justify-end h-full" style={{ position: 'relative', zIndex: 5, marginTop: 0, marginBottom: 0 }}>
                  {/* Harvest animation: big, pulsing scissors when ready */}
                  {renderStatus === 'ready' ? (
                    <motion.span
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{ fontSize: plantSize, color: '#fbbf24', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Scissors className="w-10 h-10 text-yellow-500 drop-shadow-lg" />
                    </motion.span>
                  ) : plot.status !== 'empty' ? (
                    <span
                      className={'transition-all duration-500'}
                      style={{ marginBottom: 4, fontSize: plantSize }}
                    >
                      {plantIcon}
                    </span>
                  ) : (
                    getPlotIcon(plot)
                  )}
                </div>
                {/* Status effects */}
                <AnimatePresence>
                  {plot.waterLevel > 35 && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-blue-400 rounded-full"
                          style={{
                            left: `${20 + i * 20}%`,
                            top: '10%'
                          }}
                          animate={{
                            y: [0, 40, 0],
                            opacity: [0, 1, 0]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Show water prompt if seed is planted but not growing */}
                {(plot.seedId ?? 0) !== 0 && (plot.growing ?? false) === false && plot.cropType && plot.cropType !== '' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <Droplets className="w-10 h-10 text-blue-400 animate-bounce mb-2" />
                    <span className="text-blue-700 font-semibold text-sm bg-white/80 rounded-xl px-3 py-1 shadow">Water me!</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Farm Statistics */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{plots.filter(p => p.status === 'ready').length}</div>
          <div className="text-sm text-emerald-700">Ready to Harvest</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{plots.filter(p => p.status === 'growing' || p.status === 'watering').length}</div>
          <div className="text-sm text-blue-700">Growing</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{plots.filter(p => p.status === 'withering').length}</div>
          <div className="text-sm text-red-700">Needs Water</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{plots.filter(p => p.status === 'empty').length}</div>
          <div className="text-sm text-gray-700">Empty Plots</div>
        </div>
      </div>

      {/* Modals */}
      <PlantModal
        isOpen={showPlantModal}
        onClose={() => setShowPlantModal(false)}
        plotId={selectedPlot}
        energy={energy}
        setEnergy={setEnergy}
        plots={plots}
        setPlots={setPlots}
      />
      
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        type={transactionType}
        plotId={selectedPlot}
        energy={energy}
        setEnergy={setEnergy}
        riceTokens={riceTokens}
        setRiceTokens={setRiceTokens}
        plots={plots}
        setPlots={setPlots}
        waterCans={waterCans}
      />

      {/* Revive Modal */}
      {showReviveModal && selectedPlot !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-24">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg className="w-6 h-6 mr-2 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17a2 2 0 002-2v-2a2 2 0 00-4 0v2a2 2 0 002 2zm6-2v-2a6 6 0 10-12 0v2a2 2 0 002 2h8a2 2 0 002-2z"/></svg>
                Revive Plot #{selectedPlot}
              </h2>
              <button onClick={() => setShowReviveModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="mb-4 text-gray-700 text-center">
              This plot is ready to be revived! Apply fertilizer to unlock it for planting.
            </div>
            <div className="mb-4 text-center">
              <span className="font-semibold">Fertilizer in Inventory: </span>
              <span className="text-emerald-600 font-bold">{fertilizerCount}</span>
            </div>
            {fertilizerCount > 0 ? (
              <button
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => revivePlot(selectedPlot)}
                disabled={isRevivePending}
              >
                {isRevivePending ? 'Reviving...' : 'Apply Fertilizer to Revive'}
              </button>
            ) : (
              <a
                href="/marketplace"
                className="w-full block text-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-3 rounded-xl font-medium hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 mt-2"
              >
                Buy Fertilizer in Marketplace
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default FarmGrid;
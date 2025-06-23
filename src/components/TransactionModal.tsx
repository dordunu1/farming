import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle, Droplets, Scissors, Zap, Info } from 'lucide-react';
import { useAccount, useContractRead } from 'wagmi';
import RiseFarmingABI from '../abi/RiseFarming.json';
import { updateAfterWater, syncUserOnChainToFirestore, logAndSyncUserActivity, getActivityIcon, updateAfterRevive, updateAfterHarvest } from '../lib/firebaseUser';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, CURRENT_CHAIN } from '../lib/firebase';
import { ethers } from 'ethers';
import { useWallet as useInGameWallet } from '../hooks/useWallet';
import { shredsService, isRiseTestnet } from '../services/shredsService';
import { useNavigate } from 'react-router-dom';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'water' | 'harvest' | 'revive';
  plotId: number | null;
  energy: number;
  setEnergy: (energy: number) => void;
  riceTokens: number;
  setRiceTokens: (tokens: number) => void;
  plots: any[];
  setPlots: (plots: any[]) => void;
  waterCans: number;
}

// Add PlotState enum mapping for clarity
const PlotState = {
  Empty: 0,
  NeedsWater: 1,
  Growing: 2,
  Ready: 3,
  Locked: 4,
} as const;

function TransactionModal({ 
  isOpen, 
  onClose, 
  type, 
  plotId, 
  energy, 
  setEnergy, 
  riceTokens, 
  setRiceTokens, 
  plots, 
  setPlots, 
  waterCans
}: TransactionModalProps) {
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const { address } = useAccount();
  const { wallet: inGameWallet } = useInGameWallet(address);
  const inGameAddress = inGameWallet?.address;
  const hasUpdatedRef = useRef(false);
  const [onChainPlot, setOnChainPlot] = useState<any>(null);
  const [showActionToast, setShowActionToast] = useState(false);
  const [actionToastMsg, setActionToastMsg] = useState('');
  const navigate = useNavigate();

  // Fetch on-chain plot state for harvest logic
  const shouldFetch = isOpen && !!inGameAddress && plotId !== null && typeof plotId === 'number';
  const { data: fetchedPlot } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'userPlots',
    args: shouldFetch ? [inGameAddress as `0x${string}`, plotId as number] : undefined,
  });

  const currentPlot = plots.find((p: any) => p.id === plotId);

  const GOLDEN_HARVESTER_SINGLE_ID = 17;
  const { data: harvesterUses, refetch: refetchHarvesterUses } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'userToolUses',
    args: inGameAddress ? [inGameAddress, GOLDEN_HARVESTER_SINGLE_ID] : undefined,
  });

  const { data: onChainRiceTokens } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'riceTokens',
    args: inGameAddress ? [inGameAddress] : undefined,
  });

  // Add on-chain XP fetch
  const { data: onChainXP } = useContractRead({
    address: import.meta.env.VITE_FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'totalXP',
    args: inGameAddress ? [inGameAddress] : undefined,
  });

  React.useEffect(() => {
    if (type === 'water' && transactionStatus === 'success' && plotId && txHash && !hasUpdatedRef.current) {
      if (!inGameAddress) return;
      hasUpdatedRef.current = true;
      (async () => {
        // Fetch latest on-chain plot data after watering using inGameAddress
        const provider = new ethers.providers.JsonRpcProvider(
          import.meta.env.VITE_CURRENT_CHAIN === 'RISE' 
            ? import.meta.env.VITE_RISE_RPC_URL 
            : import.meta.env.VITE_RPC_URL
        );
        const contract = new ethers.Contract(
          import.meta.env.VITE_FARMING_ADDRESS,
          RiseFarmingABI,
          provider
        );
        const latestPlot = await contract.userPlots(inGameAddress, plotId);
        const plantedAt = Number(latestPlot.plantedAt);
        const readyAt = Number(latestPlot.readyAt);
        const state = Number(latestPlot.state);
        // Map on-chain data to UI plot fields (like PlantModal)
        (setPlots as React.Dispatch<React.SetStateAction<any[]>>)((plots) =>
          plots.map((plot: any) =>
            plot.id === plotId
              ? {
                  ...plot,
                  plantedAt,
                  readyAt,
                  waterLevel: 100,
                  status: state === 2 ? 'growing' : 'needsWater',
                  state,
                }
              : plot
          )
        );
        // Firestore update remains
        const userRef = doc(db, 'chains', CURRENT_CHAIN, 'users', inGameAddress as string);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const plots = userData.plots || [];
          const updatedPlots = plots.map((plot: any) =>
            plot.id === plotId
              ? { ...plot, plantedAt, readyAt, status: state === 2 ? 'growing' : 'needsWater', state }
              : plot
          );
          await setDoc(userRef, { plots: updatedPlots }, { merge: true });
        }
      })();
      updateAfterWater(inGameAddress as string, plotId, txHash, 100).then(() => {
        setEnergy(energy - 5); // Only deduct energy after success
        setTransactionStatus('success');
        setTxHash(txHash);
        // Log and sync activity after water
        if (onChainRiceTokens !== undefined && onChainXP !== undefined) {
          logAndSyncUserActivity(inGameAddress as string, {
            icon: getActivityIcon('water'),
            action: `Watered Plot #${plotId}`,
            time: new Date().toISOString(),
            reward: '+0 RT',
            color: 'blue',
            txHash: txHash,
          }, {
            riceTokens: Number(onChainRiceTokens),
            totalXP: Number(onChainXP),
          });
        }
        setTimeout(() => {
          onClose();
          setTransactionStatus('idle');
        }, 2000);
      });
    }
    // Add Firestore riceTokens update for harvest
    if (type === 'harvest' && transactionStatus === 'success' && plotId && currentPlot) {
      if (!address) return;
      hasUpdatedRef.current = true;
      (async () => {
        // Fetch latest on-chain plot data after harvest using inGameAddress
        const provider = new ethers.providers.JsonRpcProvider(
          import.meta.env.VITE_CURRENT_CHAIN === 'RISE' 
            ? import.meta.env.VITE_RISE_RPC_URL 
            : import.meta.env.VITE_RPC_URL
        );
        const contract = new ethers.Contract(
          import.meta.env.VITE_FARMING_ADDRESS,
          RiseFarmingABI,
          provider
        );
        const plotData = await contract.userPlots(inGameAddress, plotId);
        const state = Number(plotData.state);
        const needsFertilizer = Boolean(plotData.needsFertilizer);
        const harvestedAt = Number(plotData.harvestedAt);
        // Map on-chain data to UI plot fields (like PlantModal)
        (setPlots as React.Dispatch<React.SetStateAction<any[]>>)((plots) =>
          plots.map((plot: any) =>
            plot.id === plotId
              ? {
                  ...plot,
                  state,
                  needsFertilizer,
                  harvestedAt,
                  status: state === 4 ? 'locked' : plot.status,
                  waterLevel: 0,
                  quality: 'poor',
                }
              : plot
          )
        );
        // Firestore update remains
        const userRef = doc(db, 'chains', CURRENT_CHAIN, 'users', address as string);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const plots = userData.plots || [];
          const updatedPlots = plots.map((plot: any) =>
            plot.id === plotId
              ? { ...plot, state, needsFertilizer, harvestedAt, status: state === 4 ? 'locked' : plot.status }
              : plot
          );
          // Count harvested plots
          const harvestedCount = updatedPlots.filter((p: any) => p.status === 'empty' && p.cropType !== '').length;
          await setDoc(userRef, { plots: updatedPlots, numHarvested: harvestedCount }, { merge: true });
        }
        // Update Firestore using connected wallet address
        await updateAfterHarvest(
          address,
          plotId,
          txHash,
          harvestedAt
        );
      })();
      // Log and sync activity after harvest
      if (onChainRiceTokens !== undefined && onChainXP !== undefined) {
        let actualYield = 0;
        if (type === 'harvest' && Array.isArray(fetchedPlot)) {
          const seedId = Number(fetchedPlot[0]);
          const yieldBonusBP = Number(fetchedPlot[4]);
          const baseReward = seedBaseRewards[seedId] || 0;
          actualYield = Math.floor(baseReward * (1000 + yieldBonusBP) / 1000);
        }
        logAndSyncUserActivity(address as string, {
          icon: getActivityIcon('harvest'),
          action: `Harvested Plot #${plotId}`,
          time: new Date().toISOString(),
          reward: `+${actualYield} RT`,
          color: 'green',
          txHash: txHash,
        }, {
          riceTokens: Number(onChainRiceTokens),
          totalXP: Number(onChainXP),
        });
      }
      setTimeout(() => {
        onClose();
        setTransactionStatus('idle');
      }, 1500);
    }
    // After a successful revive transaction
    if (type === 'revive' && transactionStatus === 'success' && address && plotId) {
      setTimeout(() => {
        (async () => {
          try {
            // Use ethers.js to fetch the latest on-chain plot data (optional, for sync)
            const provider = new ethers.providers.JsonRpcProvider(
              import.meta.env.VITE_CURRENT_CHAIN === 'RISE' 
                ? import.meta.env.VITE_RISE_RPC_URL 
                : import.meta.env.VITE_RPC_URL
            );
            const contract = new ethers.Contract(
              import.meta.env.VITE_FARMING_ADDRESS,
              RiseFarmingABI,
              provider
            );
            const latestPlot = await contract.userPlots(inGameAddress, plotId);
            const state = Number(latestPlot.state);
            const needsFertilizer = Boolean(latestPlot.needsFertilizer);
            const harvestedAt = Number(latestPlot.harvestedAt);
            const plantedAt = Number(latestPlot.plantedAt);
            const readyAt = Number(latestPlot.readyAt);

            // Instead of direct Firestore update, call updateAfterRevive
            await updateAfterRevive(address, plotId, txHash);
            // Optionally update local state if needed (fetch latest from Firestore or reset in memory)
            // Log and sync activity is handled in updateAfterRevive
            setTimeout(() => {
              onClose();
              setTransactionStatus('idle');
            }, 1500);
          } catch (error) {
            console.error('[Revive] Firestore update error:', error);
            setTransactionStatus('error');
          }
        })();
      }, 1000);
    }
  }, [type, transactionStatus, address, plotId, txHash, onClose, energy, setPlots, currentPlot, onChainRiceTokens, onChainXP, inGameAddress]);

  React.useEffect(() => {
    if (fetchedPlot) setOnChainPlot(fetchedPlot);
  }, [fetchedPlot]);

  // Reset hasUpdatedRef when a new transaction starts
  React.useEffect(() => {
    hasUpdatedRef.current = false;
  }, [txHash]);

  React.useEffect(() => {
    if (transactionStatus === 'success' && type === 'harvest') {
      refetchHarvesterUses && refetchHarvesterUses();
    }
  }, [transactionStatus, type, refetchHarvesterUses]);

  // Add this effect to close the modal after a successful harvest
  useEffect(() => {
    if (type === 'harvest' && transactionStatus === 'success') {
      setTransactionStatus('success');
      setTimeout(() => {
        onClose();
        setTransactionStatus('idle');
      }, 1500);
    }
  }, [type, transactionStatus, onClose]);

  const showEnergyWarning = energy < 2; // Warning when energy is below 2
  const energyCost = type === 'water' ? 1 : 1; // Both actions cost 1 energy now

  if (!isOpen) return null;

  const handleTransaction = async () => {
    if (!currentPlot) return;
    if (energy < energyCost) {
      alert('Not enough energy!');
      return;
    }
    if (!inGameWallet) return;
    setTransactionStatus('pending');
    try {
      const rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL || import.meta.env.VITE_RPC_URL;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(inGameWallet.privateKey, provider);
      const contract = new ethers.Contract(import.meta.env.VITE_FARMING_ADDRESS, RiseFarmingABI as any, wallet);
      
      let result;
      
      if (type === 'water') {
        if (typeof plotId === 'number' && waterCans > 0) {
          // Use Shreds service for water transaction
          result = await shredsService.sendTransaction(
            null, // transaction object not needed for this method
            wallet,
            contract,
            'waterCrop',
            [plotId],
            {}
          );
          // --- PATCH: Immediately update local plot state for waterLevel ---
          if (result?.hash && address) {
            (setPlots as React.Dispatch<React.SetStateAction<any[]>>)((plots: any[]) =>
              plots.map((plot: any) =>
                plot.id === plotId
                  ? { ...plot, waterLevel: 100, status: 'watering' }
                  : plot
              )
            );
            updateAfterWater(address, plotId, result.hash, 100);
          }
        }
      } else if (type === 'harvest') {
        if (typeof plotId === 'number') {
          // Use Shreds service for harvest transaction
          result = await shredsService.sendTransaction(
            null, // transaction object not needed for this method
            wallet,
            contract,
            'harvestWithGoldenHarvester',
            [plotId],
            {}
          );
        }
      }
      
      if (result?.hash) {
        setTxHash(result.hash);
        setTransactionStatus('success');
        if (type === 'harvest' && result?.hash && address) {
          // PATCH: Instantly update local plot state for feedback (harvest)
          (setPlots as React.Dispatch<React.SetStateAction<any[]>>)((plots) =>
            plots.map((plot: any) =>
              plot.id === plotId
                ? {
                    ...plot,
                    status: 'locked', // or whatever your UI expects for a harvested plot
                    waterLevel: 0,
                    quality: 'poor', // or whatever is appropriate
                  }
                : plot
            )
          );
          setActionToastMsg('🌾 Harvested! Tokens added to your balance.');
          setShowActionToast(true);
          setTimeout(() => setShowActionToast(false), 3000);
        }
        if (type === 'revive' && result?.hash && address) {
          (setPlots as React.Dispatch<React.SetStateAction<any[]>>)((plots) =>
            plots.map((plot: any) =>
              plot.id === plotId
                ? { ...plot, status: 'empty', waterLevel: 0, quality: 'poor' }
                : plot
            )
          );
          setActionToastMsg('🪴 Plot revived! Ready to plant.');
          setShowActionToast(true);
          setTimeout(() => setShowActionToast(false), 3000);
        }
        if (type === 'water' && result?.hash && address) {
          // PATCH: Instantly update local plot state for feedback (water)
          (setPlots as React.Dispatch<React.SetStateAction<any[]>>)((plots) =>
            plots.map((plot: any) =>
              plot.id === plotId
                ? {
                    ...plot,
                    waterLevel: 100,
                    status: 'growing', // or whatever your UI expects
                  }
                : plot
            )
          );
        }
      } else {
        throw new Error('Transaction failed: No result received');
      }
    } catch (err: any) {
      setTransactionStatus('error');
    }
  };

  // Map seedId to baseReward (update as needed, include bundles)
  const seedBaseRewards: Record<number, number> = {
    9: 15,   // Basic Rice Seed (Single)
    10: 50,  // Premium Rice Seed (Single)
    11: 70,  // Hybrid Rice Seed (Single)
    13: 21,  // Basic Rice Seed (Bundle)
    14: 60,  // Premium Rice Seed (Bundle)
    15: 85,  // Hybrid Rice Seed (Bundle)
    // Add more as needed
  };

  // Calculate actualYield for harvest modal and activity log
  let actualYield = 0;
  if (type === 'harvest' && Array.isArray(fetchedPlot)) {
    const seedId = Number(fetchedPlot[0]);
    const yieldBonusBP = Number(fetchedPlot[4]);
    const baseReward = seedBaseRewards[seedId] || 0;
    actualYield = Math.floor(baseReward * (1000 + yieldBonusBP) / 1000);
  }

  const getActionData = () => {
    if (type === 'water') {
      return {
        title: 'Water Crops',
        description: 'Water your rice crops to help them grow faster',
        icon: <Droplets className="w-8 h-8 text-blue-500" />,
        cost: '1 Energy',
        benefit: '+100% water level, improved quality'
      };
    } else {
      return {
        title: 'Harvest Rice',
        description: 'Harvest your fully grown rice and earn tokens',
        icon: <Scissors className="w-8 h-8 text-yellow-500" />,
        cost: '1 Energy',
        benefit: `Earn ${actualYield} Rice Tokens`
      };
    }
  };

  const actionData = getActionData();

  // Add seedMeta for growth time (hours) by cropType (copy from FarmGrid)
  const seedMeta: Record<string, { icon: string; growthTime: number }> = {
    'Basic Rice Seed': { icon: '🌱', growthTime: 8 },
    'Premium Rice Seed': { icon: '🌿', growthTime: 6 },
    'Hybrid Rice Seed': { icon: '🌾', growthTime: 4 },
    'Basic Rice': { icon: '🌱', growthTime: 8 },
    'Premium Rice': { icon: '🌿', growthTime: 6 },
    'Hybrid Rice': { icon: '🌾', growthTime: 4 },
  };

  // Use on-chain data for harvest logic
  const now = Math.floor(Date.now() / 1000);
  const growing = Array.isArray(onChainPlot) ? onChainPlot[5] : onChainPlot?.growing;
  const readyAt = Array.isArray(onChainPlot) ? Number(onChainPlot[2]) : Number(onChainPlot?.readyAt);
  const cooldownPassed = now > (readyAt + 60);
  const canHarvestOnChain =
    growing === true &&
    readyAt > 0 &&
    now > readyAt &&
    cooldownPassed;

  // Guard: if the plot is truly empty, do not render this modal (let PlantModal handle it)
  if (currentPlot && (currentPlot.state === PlotState.Empty || currentPlot.state === undefined)) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-16">
      <motion.div 
        className="bg-white rounded-2xl p-6 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Energy Balance Display */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Zap className={`w-4 h-4 ${showEnergyWarning ? 'text-red-500' : 'text-yellow-500'}`} />
          <span className="text-sm font-medium">
            Energy: {energy}
          </span>
          {showEnergyWarning && (
            <div className="relative group">
              <Info className="w-4 h-4 text-red-500 cursor-help" />
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-red-200 rounded-lg p-2 text-xs text-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                Low energy! Buy an Energy Booster from the marketplace to continue farming.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">{actionData.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(transactionStatus === 'idle' || (type === 'water' && transactionStatus === 'pending') || (type === 'harvest' && transactionStatus === 'pending')) && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {actionData.icon}
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Plot #{plotId}</h3>
              <p className="text-gray-600">{actionData.description}</p>
            </div>

            {currentPlot && (() => {
              let progressPercent = Math.round(currentPlot.progress || 0);
              if (currentPlot.plantedAt && currentPlot.readyAt) {
                const now = Date.now();
                const plantedAtMs = currentPlot.plantedAt * 1000;
                const readyAtMs = currentPlot.readyAt * 1000;
                const total = readyAtMs - plantedAtMs;
                const elapsed = now - plantedAtMs;
                progressPercent = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
              }
              const waterPercent = Math.round(currentPlot.waterLevel || 0);
              return (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Plot Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crop:</span>
                      <span className="font-medium">{currentPlot.cropType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium">{progressPercent}%</span>
                    </div>
                    {/* Growth Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <motion.div
                        className="h-1.5 rounded-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Water Level:</span>
                      <span className="font-medium">{waterPercent}%</span>
                    </div>
                    {/* Water Level Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1 mb-1">
                      <motion.div
                        className={`h-1 rounded-full ${
                          waterPercent > 60 ? 'bg-blue-400' :
                          waterPercent > 30 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${waterPercent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quality:</span>
                      <span className="font-medium capitalize">{currentPlot.quality}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Action:</span>
                <span className="font-medium">{actionData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Energy Cost:</span>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{actionData.cost}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Benefit:</span>
                <span className="font-medium text-emerald-600">{actionData.benefit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Energy:</span>
                <span className="font-medium">{energy}/100</span>
              </div>
            </div>

            {type === 'water' && waterCans <= 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800 text-sm text-center">
                <strong>You are out of Watering Cans!</strong><br />
                <button onClick={() => navigate('/marketplace')} className="underline text-blue-600 hover:text-blue-800">Buy more in the Marketplace</button>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                disabled={transactionStatus === 'pending'}
              >
                Cancel
              </button>
              {type === 'water' && waterCans <= 0 ? (
                <button
                  onClick={() => navigate('/marketplace')}
                  className="flex-1 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 text-center"
                  style={{ display: 'block' }}
                >
                  Buy Water Cans
                </button>
              ) : type === 'harvest' ? (
                <button
                  onClick={
                    !harvesterUses || Number(harvesterUses) <= 0
                      ? () => navigate('/marketplace')
                      : handleTransaction
                  }
                  disabled={
                    (!harvesterUses || Number(harvesterUses) <= 0)
                      ? false
                      : (!canHarvestOnChain ||
                         energy < energyCost ||
                         transactionStatus === 'pending' ||
                         (growing === false && cooldownPassed))
                  }
                  className="flex-1 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700"
                >
                  {!harvesterUses || Number(harvesterUses) <= 0
                    ? 'Buy on Marketplace'
                    : (transactionStatus === 'pending' ? 'Harvesting…' : 'Confirm Harvest Rice')}
                </button>
              ) : (
                <button
                  onClick={handleTransaction}
                  disabled={
                    energy < energyCost ||
                    (type === 'water' && String(transactionStatus) === 'pending') ||
                    (type === 'water' && waterCans <= 0) ||
                    (type === 'water' && currentPlot && currentPlot.waterLevel >= 40)
                  }
                  className={`flex-1 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700`}
                >
                  {type === 'water' && String(transactionStatus) === 'pending'
                    ? 'Confirming…'
                        : energy < energyCost
                          ? 'Not Enough Energy'
                          : `Confirm ${actionData.title}`}
                </button>
              )}
            </div>

            {type === 'water' && currentPlot && currentPlot.waterLevel >= 40 && (
              <div className="mt-2 text-xs text-blue-600 text-center">Watering is only allowed below 40% water level.</div>
            )}

            {type === 'harvest' && !cooldownPassed && (
              <div className="mt-2 text-xs text-yellow-600 text-center">
                Please wait 1 minute after crop is ready before harvesting (syncing on-chain).
              </div>
            )}

            {type === 'harvest' && (
              <div className="text-xs text-yellow-700 mt-2">Golden Harvester uses left: {Number(harvesterUses) || 0}</div>
            )}

            {energy < energyCost && (
              <div className="mt-2 text-xs text-red-600 text-center">
                Not enough energy! This action requires {energyCost} energy. Buy an Energy Booster from the marketplace.
              </div>
            )}
          </div>
        )}

        {transactionStatus === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Transaction Successful!</h3>
            <p className="text-gray-600 mb-4">Your {type} action has been completed.</p>
            {type === 'harvest' && currentPlot && (
              <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                <p className="text-emerald-700 font-medium">
                  +{actualYield} Rice Tokens earned!
                </p>
              </div>
            )}
            {txHash && (
              <p className="text-xs text-gray-500">
                Tx Hash: {txHash}
              </p>
            )}
          </div>
        )}

        {transactionStatus === 'error' && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Transaction Failed</h3>
            <p className="text-gray-600 mb-4">Something went wrong. Please try again.</p>
            <button
              onClick={() => setTransactionStatus('idle')}
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {showActionToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-100 border border-green-300 text-green-900 px-6 py-3 rounded-xl shadow-lg z-50 font-semibold flex items-center gap-2 animate-fade-in">
            {actionToastMsg}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default TransactionModal;
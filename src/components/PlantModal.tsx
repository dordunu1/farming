import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Coins, Clock, Zap, Star, Info } from 'lucide-react';
import { useAccount, useContractRead, useContractReads, usePublicClient } from 'wagmi';
import { useWallet as useInGameWallet } from '../hooks/useWallet';
import RiseFarmingABI from '../abi/RiseFarming.json';
import { marketItems } from './Marketplace';
import { updateAfterPlant } from '../lib/firebaseUser';
import { ethers } from 'ethers';
import { shredsService, isRiseTestnet } from '../services/shredsService';

interface PlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  plotId: number | null;
  energy: number;
  setEnergy: (energy: number) => void;
  plots: any[];
  setPlots: (plots: any[]) => void;
}

// Add Seed type for ownedSeeds and seedOptions
interface Seed {
  id: number;
  name: string;
  rarity: string;
  description: string;
  cost: string;
  energyCost: number;
  growthTime: number;
  yield: string;
  icon: JSX.Element;
}

function parseYield(yieldStr: string) {
  const match = yieldStr.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function PlantModal({ isOpen, onClose, plotId, energy, setEnergy, plots, setPlots }: PlantModalProps) {
  const { address } = useAccount();
  const { wallet: inGameWallet, isLoading: walletLoading, error: walletError } = useInGameWallet(address);
  const inGameAddress = inGameWallet?.address;
  const hasUpdatedRef = useRef(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [showToast, setShowToast] = useState(false);
  // Assume seed IDs are 9, 10, 11 for basic, premium, hybrid
  const seedIds = [9, 10, 11];
  // Use useContractReads for each seed ID (like Inventory)
  const { data: bundleSeedsRaw } = useContractReads({
    contracts: seedIds.map(id => ({
      address: import.meta.env.VITE_FARMING_ADDRESS,
      abi: RiseFarmingABI as any,
      functionName: 'userBundleSeeds',
      args: [inGameAddress, id],
    })),
  });
  const { data: singleSeedsRaw } = useContractReads({
    contracts: seedIds.map(id => ({
      address: import.meta.env.VITE_FARMING_ADDRESS,
      abi: RiseFarmingABI as any,
      functionName: 'userSingleSeeds',
      args: [inGameAddress, id],
    })),
  });
  // Map results to objects keyed by string seed ID
  const bundleSeeds: Record<string, number> = Object.fromEntries(
    (bundleSeedsRaw || []).map((v, i) => [String(seedIds[i]), typeof v?.result === 'bigint' ? Number(v.result) : Number(v?.result || 0)])
  );
  const singleSeeds: Record<string, number> = Object.fromEntries(
    (singleSeedsRaw || []).map((v, i) => [String(seedIds[i]), typeof v?.result === 'bigint' ? Number(v.result) : Number(v?.result || 0)])
  );

  // Seed meta (should match contract/marketplace)
  const seedOptions = [
    {
      id: 9,
      name: 'Basic Rice Seed',
      rarity: 'common',
      description: 'A single basic rice seed for everyday farming',
      cost: '50 RT',
      energyCost: 5,
      growthTime: 8,
      yield: '15 RT',
      bundleYield: '21 RT',
      bundleBonus: '+1.5% growth/yield',
      icon: <span className="text-xl">🌾</span>,
    },
    {
      id: 10,
      name: 'Premium Rice Seed',
      rarity: 'rare',
      description: 'A single premium rice seed with higher yield',
      cost: '0.005 ETH',
      energyCost: 10,
      growthTime: 6,
      yield: '50 RT',
      bundleYield: '60 RT',
      bundleBonus: '+3% growth/yield',
      icon: <span className="text-xl">🌾</span>,
    },
    {
      id: 11,
      name: 'Hybrid Rice Seed',
      rarity: 'legendary',
      description: 'A single hybrid rice seed with unique properties',
      cost: '0.01 ETH',
      energyCost: 20,
      growthTime: 4,
      yield: '70 RT',
      bundleYield: '85 RT',
      bundleBonus: '+7% growth/yield',
      icon: <span className="text-xl">🌾</span>,
    },
  ];

  // Build list of owned seeds (with bundle/single breakdown)
  const ownedSeeds = seedOptions
    .map((seed) => {
      const key = String(seed.id);
      const singles = singleSeeds[key] || 0;
      const bundles = bundleSeeds[key] || 0;
      return { ...seed, singles, bundles, total: singles + bundles };
    })
    .filter((s) => s.total > 0);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedSeed = ownedSeeds[selectedIdx] || ownedSeeds[0];
  const canPlant = selectedSeed && energy >= selectedSeed.energyCost && selectedSeed.total > 0;

  const [txHash, setTxHash] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);

  const publicClient = usePublicClient();

  const showEnergyWarning = energy < 5; // Warning when energy is below 5

  React.useEffect(() => {
    async function syncOnChainPlot() {
      if (txSuccess && address && plotId && selectedSeed && txHash && !hasUpdatedRef.current) {
        hasUpdatedRef.current = true;
        // Fetch on-chain plot data for this plot
        try {
          if (!publicClient) throw new Error('No publicClient');
          const plotData = await publicClient.readContract({
            address: import.meta.env.VITE_FARMING_ADDRESS,
            abi: RiseFarmingABI as any,
            functionName: 'userPlots',
            args: [address, plotId],
          }) as [number, number, number, number, number, boolean];
          // plotData: [seedId, plantedAt, readyAt, growthBonusBP, yieldBonusBP, growing]
          const plantedAt = Number(plotData[1]);
          const readyAt = Number(plotData[2]);
          const cropType = selectedSeed.name;
          const yieldBonus = selectedSeed.bundles > 0 ? parseYield(selectedSeed.bundleYield) : parseYield(selectedSeed.yield);
          const quality = selectedSeed.rarity === 'legendary' ? 'excellent' : selectedSeed.rarity === 'rare' ? 'good' : 'poor';
          const expectedYield = yieldBonus;
          const tx = txHash;
          await updateAfterPlant(
            address,
            plotId,
            cropType,
            yieldBonus,
            tx,
            quality,
            expectedYield,
            plantedAt,
            readyAt
          );
          console.log('PlantModal: updateAfterPlant called', {
            address,
            plotId,
            cropType,
            yieldBonus,
            tx,
            quality,
            expectedYield,
            plantedAt,
            readyAt
          });
        } catch (err) {
          const cropType = selectedSeed.name;
          const yieldBonus = selectedSeed.bundles > 0 ? parseYield(selectedSeed.bundleYield) : parseYield(selectedSeed.yield);
          const quality = selectedSeed.rarity === 'legendary' ? 'excellent' : selectedSeed.rarity === 'rare' ? 'good' : 'poor';
          const expectedYield = yieldBonus;
          const tx = txHash;
          await updateAfterPlant(
            address,
            plotId,
            cropType,
            yieldBonus,
            tx,
            quality,
            expectedYield
          );
        }
        setShowToast(true);
        window.dispatchEvent(new Event('planted'));
        setTimeout(() => {
          setShowToast(false);
          setStep(1);
          onClose();
        }, 2000);
      }
    }
    syncOnChainPlot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txSuccess, address, plotId, selectedSeed, txHash, onClose]);

  React.useEffect(() => {
    hasUpdatedRef.current = false;
  }, [txHash]);

  // Fetch on-chain price for each seed (single seeds only, not bundles)
  const { data: itemsRaw } = useContractReads({
    contracts: seedIds.map(id => ({
      address: import.meta.env.VITE_FARMING_ADDRESS,
      abi: RiseFarmingABI as any,
      functionName: 'items',
      args: [id],
    })),
  });
  // Helper to get price for a seed
  function getSeedPrice(seedId: number): string {
    const itemIdx = seedIds.indexOf(seedId);
    const itemRaw = itemsRaw?.[itemIdx];
    const marketItem = marketItems.find((m) => m.id === seedId);
    if (marketItem?.currency === 'ETH') {
      // ETH price is at index 3 in contract result, in wei
      if (itemRaw && typeof itemRaw === 'object' && 'result' in itemRaw && Array.isArray(itemRaw.result)) {
        const priceWei = itemRaw.result[3];
        if (typeof priceWei === 'bigint' || typeof priceWei === 'number' || typeof priceWei === 'string') {
          const eth = Number(priceWei) / 1e18;
          return `${eth.toFixed(6)} ETH`;
        }
      }
      return '... ETH';
    } else if (marketItem?.currency === 'RT') {
      // RT price is at index 4 in contract result
      if (itemRaw && typeof itemRaw === 'object' && 'result' in itemRaw && Array.isArray(itemRaw.result)) {
        const priceRT = itemRaw.result[4];
        return `${priceRT} RT`;
      }
      return '... RT';
    }
    return '';
  }

  // Handle planting
  const handlePlantSeed = async () => {
    if (!canPlant || !plotId || !selectedSeed || !inGameWallet) return;
    setIsPending(true);
    setTxSuccess(false);
    try {
      const rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL || import.meta.env.VITE_RPC_URL;
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(inGameWallet.privateKey, provider);
      const contract = new ethers.Contract(import.meta.env.VITE_FARMING_ADDRESS, RiseFarmingABI as any, wallet);
      
      // Use Shreds service for transaction
      const result = await shredsService.sendTransaction(
        null, // transaction object not needed for this method
        wallet,
        contract,
        'plantSeed',
        [plotId, selectedSeed.id],
        {}
      );
      
      if (result?.hash) {
        setTxHash(result.hash);
        setIsPending(false);
        setTxSuccess(true);
        setShowToast(true);
        // PATCH: Update local plot state instantly
        (setPlots as React.Dispatch<React.SetStateAction<any[]>>)((plots: any[]) =>
          plots.map((plot: any) =>
            plot.id === plotId
              ? {
                  ...plot,
                  status: 'growing',
                  waterLevel: 100,
                  cropType: selectedSeed.name,
                  quality: selectedSeed.rarity === 'legendary' ? 'excellent' : selectedSeed.rarity === 'rare' ? 'good' : 'poor',
                  expectedYield: selectedSeed.bundles > 0 ? parseYield(selectedSeed.bundleYield) : parseYield(selectedSeed.yield),
                  plantedAt: Math.floor(Date.now() / 1000),
                  // Optionally set readyAt if you can estimate it here
                }
              : plot
          )
        );
        setTimeout(() => setShowToast(false), 3000);
      } else {
        throw new Error('Transaction failed: No result received');
      }
    } catch (err: any) {
      setIsPending(false);
      alert('Planting failed: ' + (err && err.message ? err.message : String(err)));
    }
  };

  if (!isOpen) return null;

  const notEnoughEnergy = selectedSeed && energy < selectedSeed.energyCost;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col justify-between relative mt-10">
        {/* Energy Balance Display - moved to top */}
        <div className="flex flex-col items-center mb-4">
          <div className={`flex items-center gap-3 px-5 py-2 rounded-xl shadow font-semibold text-lg ${notEnoughEnergy ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}> 
            <Zap className={`w-6 h-6 ${notEnoughEnergy ? 'text-red-400' : 'text-yellow-500'}`} />
            <span>Your Energy:</span>
            <span className="font-bold text-2xl">{energy}</span>
            <span className="text-base font-normal text-gray-400 ml-2">/ 100</span>
          </div>
          {notEnoughEnergy && (
            <div className="mt-2 text-sm text-red-600 font-medium">Not enough energy to plant <span className="font-bold">{selectedSeed?.name}</span> (requires {selectedSeed?.energyCost})</div>
          )}
        </div>
        {/* Toast message */}
        {showToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-100 border border-emerald-300 text-emerald-900 px-6 py-3 rounded-xl shadow-lg z-50 font-semibold flex items-center gap-2 animate-fade-in">
            🌱 Seed planted! Don't forget to water it for best results!
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Plant Seeds</h2>
            <button
              onClick={() => { setStep(1); onClose(); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-gray-500 mb-2">Plot #{plotId}</div>
          {/* Step 1: Seed selection */}
          {step === 1 && (
            <div className="overflow-y-auto" style={{ maxHeight: '40vh' }}>
              {ownedSeeds.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <span className="mb-2">You do not own any seeds.</span>
                  <span className="text-xs">Purchase seeds from the marketplace to start planting.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mb-4">
                  {ownedSeeds.map((seed, idx) => {
                    const isSelected = idx === selectedIdx;
                    return (
                      <button
                        key={seed.id}
                        className={`w-full text-left rounded-xl border-2 p-4 flex flex-col gap-1 transition-all duration-150 ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-gray-200 bg-gray-50 hover:border-emerald-300'}`}
                        onClick={() => setSelectedIdx(idx)}
                      >
                        <div className="flex items-center gap-3 mb-1">
                          {seed.icon}
                          <span className="font-semibold text-lg text-gray-800">{seed.name}</span>
                          <span className={`text-xs font-bold ml-2 capitalize ${seed.rarity === 'legendary' ? 'text-yellow-600' : seed.rarity === 'rare' ? 'text-blue-600' : 'text-emerald-600'}`}>{seed.rarity}</span>
                          <span className="ml-auto text-sm font-bold text-emerald-700">{getSeedPrice(seed.id)}</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">{seed.description}</div>
                        <div className="flex flex-wrap gap-4 text-xs mb-1">
                          <span className="text-blue-500 font-semibold">Energy: {seed.energyCost}</span>
                          <span className="text-gray-500">Growth: {seed.growthTime}h</span>
                          <span className="text-yellow-600">Yield: {seed.yield} <span className="text-gray-400">(Single)</span></span>
                          <span className="text-yellow-700">Bundle Yield: {seed.bundleYield} <span className="text-gray-400">(Bundle)</span></span>
                          <span className="text-emerald-700">Bonus: {seed.bundleBonus}</span>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <span className="text-gray-700">From Bundles: <span className="font-bold">{seed.bundles}</span></span>
                          <span className="text-gray-700">Singles: <span className="font-bold">{seed.singles}</span></span>
                          <span className="text-gray-700">Total: <span className="font-bold">{seed.total}</span></span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* Step 2: Transaction summary and actions */}
          {step === 2 && ownedSeeds.length > 0 && selectedSeed && (
            <div className="bg-gray-50 rounded-xl p-4 mt-2 mb-2">
              <div className="font-semibold mb-2 text-gray-800">Transaction Summary</div>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between"><span>Seed Type:</span> <span className="font-bold">{selectedSeed.name}</span></div>
                <div className="flex justify-between"><span>Cost:</span> <span className="font-bold">{getSeedPrice(selectedSeed.id)}</span></div>
                <div className="flex justify-between">
                  <span>Energy Cost:</span>
                  <span className={`font-bold ${energy < selectedSeed.energyCost ? 'text-red-500' : 'text-emerald-500'}`}>{selectedSeed.energyCost} Energy{energy < selectedSeed.energyCost && (<span className="ml-2 text-xs text-red-500">(Not enough energy)</span>)}</span>
                </div>
                {/* Add note about actual on-chain deduction */}
                <div className="mt-1 text-xs text-blue-600 font-medium italic">Note: Only 1 energy will actually be deducted per planting, regardless of the seed's listed cost.</div>
                <div className="flex justify-between"><span>Growth Time:</span> <span className="font-bold">{selectedSeed.growthTime}h</span></div>
                <div className="flex justify-between"><span>Expected Yield:</span> <span className={`font-bold ${selectedSeed.bundles > 0 ? 'text-yellow-700' : 'text-emerald-700'}`}>{selectedSeed.bundles > 0 ? selectedSeed.bundleYield : selectedSeed.yield}</span></div>
                <div className="flex justify-between"><span>Bonus:</span> <span className={`font-bold ${selectedSeed.bundles > 0 ? 'text-yellow-700' : 'text-emerald-700'}`}>{selectedSeed.bundles > 0 ? selectedSeed.bundleBonus : 'None'}</span></div>
                {selectedSeed.bundles > 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-yellow-50 text-yellow-800 text-xs font-semibold text-center">
                    Bundle Bonus Active! Planting from a bundle gives you {selectedSeed.bundleBonus} and {selectedSeed.bundleYield} RT yield.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Step controls */}
        {step === 1 && ownedSeeds.length > 0 && (
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => { setStep(1); onClose(); }}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                ownedSeeds[selectedIdx]?.total > 0 && energy >= ownedSeeds[selectedIdx]?.energyCost
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={ownedSeeds[selectedIdx]?.total <= 0 || energy < ownedSeeds[selectedIdx]?.energyCost}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </div>
        )}
        {step === 2 && ownedSeeds.length > 0 && selectedSeed && (
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => { setStep(1); onClose(); }}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                canPlant
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!canPlant || isPending}
              onClick={handlePlantSeed}
            >
              {isPending ? 'Planting...' : energy < selectedSeed.energyCost ? 'Not Enough Energy' : '+ Plant Seeds'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlantModal;
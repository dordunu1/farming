import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Scissors, Clock, Sparkles, AlertCircle, Sprout } from 'lucide-react';
import PlantModal from './PlantModal';
import TransactionModal from './TransactionModal';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updatePlotProgress } from '../lib/firebaseUser';
import CircularProgressBar from './CircularProgressBar';
import { marketItems } from './Marketplace';

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
  status: 'empty' | 'growing' | 'ready' | 'watering' | 'withering';
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
}

function FarmGrid({ isWalletConnected, energy, setEnergy, riceTokens, setRiceTokens, plots, setPlots, waterCans }: FarmGridProps) {
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'water' | 'harvest'>('water');

  // Update plots every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setPlots(prevPlots => {
        const updatedPlots = prevPlots.map(plot => {
          if (plot.status === 'growing' || plot.status === 'watering' || plot.status === 'withering' || plot.status === 'ready') {
            const newTimeRemaining = Math.max(0, (plot.timeRemaining || 0) - 1);
            const newProgress = plot.timeRemaining ? Math.min(100, 100 - (newTimeRemaining / (plot.timeRemaining + 1)) * 100) : plot.progress;
            const timeSinceWatered = plot.lastWatered ? (Date.now() - plot.lastWatered) / (1000 * 60 * 60) : 24; // hours
            const newWaterLevel = Math.max(0, plot.waterLevel - (timeSinceWatered * 2)); // 2% per hour
            let newStatus = plot.status;
            if (newTimeRemaining === 0 && newProgress >= 100) {
              newStatus = 'ready';
            } else if (newWaterLevel < 20) {
              newStatus = 'withering';
            } else if (newWaterLevel > 80) {
              newStatus = 'watering';
            } else {
              newStatus = 'growing';
            }
            // Always update Firestore with new progress and waterLevel
            const user = localStorage.getItem('walletAddress');
            if (user) {
              import('../lib/firebaseUser').then(({ updatePlotProgress }) => {
                updatePlotProgress(user, plot.id, newProgress, newWaterLevel, newWaterLevel !== plot.waterLevel ? Date.now() : plot.lastWatered);
              });
            }
            return {
              ...plot,
              timeRemaining: newTimeRemaining,
              progress: newProgress,
              waterLevel: newWaterLevel,
              status: newStatus,
              // Do not recalculate quality here; always use Firestore value
            };
          }
          return plot;
        });
        return updatedPlots;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const handlePlotClick = (plot: Plot) => {
    if (!isWalletConnected) return;
    setSelectedPlot(plot.id);
    if (plot.status === 'empty') {
      setShowPlantModal(true);
    } else if (plot.status === 'ready') {
      setTransactionType('harvest');
      setShowTransactionModal(true);
    } else if (plot.status === 'growing' || plot.status === 'watering' || plot.status === 'withering') {
      setTransactionType('water');
      setShowTransactionModal(true);
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
        {plots.map((plot) => {
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
          return (
            <motion.div
              key={plot.id}
              className={getPlotStyle({ ...plot, status: renderStatus, quality: plot.quality }) + ' relative biome-plot'}
              onClick={() => handlePlotClick({ ...plot, status: renderStatus })}
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
                    <CircularProgressBar value={Math.round(waterBar)} size={32} strokeWidth={5} color="#60a5fa" bgColor="#e5e7eb" label={''} />
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
    </>
  );
}

export default FarmGrid;
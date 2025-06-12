import { useEffect, useState } from 'react';
import { db, CURRENT_CHAIN } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Droplets, Scissors, AlertCircle, Sprout } from 'lucide-react';
import CircularProgressBar from './CircularProgressBar';

interface Plot {
  id: number;
  status: string;
  cropType: string;
  progress: number;
  waterLevel: number;
  quality: string;
  expectedYield: number;
  timeRemaining?: number;
  plantedAt?: number;
  readyAt?: number;
  harvestedAt?: number;
}

interface UserFarm {
  walletAddress: string;
  pfp: string;
  plots: Plot[];
  totalHarvests: number;
  riceTokens: number;
  numPlanted: number;
}

const PLOTS_PER_USER = 20;
const USERS_PER_PAGE = 2;
const MAX_USERS = 20;

export default function GlobalFarm() {
  const [userFarms, setUserFarms] = useState<UserFarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [allPlots, setAllPlots] = useState<any[]>([]);
  const PLOTS_PER_PAGE = 16;
  const totalPages = Math.ceil(allPlots.length / PLOTS_PER_PAGE);
  const pagePlots = allPlots.slice(page * PLOTS_PER_PAGE, (page + 1) * PLOTS_PER_PAGE);

  useEffect(() => {
    async function fetchFarms() {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, 'chains', CURRENT_CHAIN, 'users'));
      let users = usersSnap.docs.map(doc => doc.data() as UserFarm);
      // Only users with at least 1 non-empty plot
      users = users.filter(u => u.plots && u.plots.some(plot => plot.status !== 'empty'));
      // Sort by totalHarvests, then riceTokens
      users.sort((a, b) => {
        if ((b.totalHarvests || 0) !== (a.totalHarvests || 0)) {
          return (b.totalHarvests || 0) - (a.totalHarvests || 0);
        }
        return (b.riceTokens || 0) - (a.riceTokens || 0);
      });
      // Flatten all non-empty plots across all users, attach user pfp to each plot
      const allPlots = users.flatMap(user =>
        (user.plots || [])
          .filter(plot => plot.status !== 'empty')
          .map(plot => ({ ...plot, userPfp: user.pfp }))
      );
      setUserFarms([]); // not used anymore
      setAllPlots(allPlots);
      setLoading(false);
    }
    fetchFarms();
  }, []);

  // Helper functions copied from FarmGrid for exact design
  const getPlotStyle = (plot: Plot) => {
    const baseStyle = "aspect-square rounded-2xl border-2 p-3 cursor-pointer transition-all duration-300 hover:scale-105 relative overflow-hidden";
    switch (plot.status) {
      case 'empty':
        return `${baseStyle} border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:border-emerald-300 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50`;
      case 'growing':
        return `${baseStyle} border-emerald-300 bg-gradient-to-br from-emerald-100 to-green-200 shadow-lg`;
      case 'ready':
        return `${baseStyle} border-yellow-400 bg-gradient-to-br from-yellow-100 to-orange-200 shadow-xl animate-pulse`;
      case 'watering':
        return `${baseStyle} border-blue-300 bg-gradient-to-br from-blue-100 to-cyan-200 shadow-lg`;
      case 'withering':
        return `${baseStyle} border-red-300 bg-gradient-to-br from-red-100 to-orange-200 shadow-lg`;
      default:
        return baseStyle;
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

  // Add LockedOverlay for cooldown/locked state
  function LockedOverlay({ harvestedAt }: { harvestedAt: number }) {
    const [countdown, setCountdown] = useState(0);
    useEffect(() => {
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

  return (
    <>
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
    <div className="max-w-5xl mx-auto py-12">
      <h2 className="text-3xl font-bold text-emerald-700 mb-4">Global Farm</h2>
      <p className="text-gray-600 mb-8">See the top 20 most active farms from around the world. Each page shows 2 farms (40 plots).</p>
      {loading ? (
        <div className="text-center py-12 text-lg text-gray-500">Loading farms...</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-6 pb-12 w-full max-w-screen-lg mx-auto overflow-visible">
            {pagePlots.map((plot, idx) => {
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
                timeLeft = Math.max(0, Math.ceil((readyAtMs - now) / 60000));
                isReady = now >= readyAtMs;
              }
              let plantIcon: React.ReactNode = '🌱';
              let plantStage: 'small' | 'medium' | 'large' | 'ready' = 'small';
              let plantSize = 40;
              if (plot.status === 'ready' || growthProgress >= 1) {
                plantStage = 'ready';
                plantIcon = <Scissors className="w-10 h-10 text-yellow-600" />;
                plantSize = 88;
              } else if (growthProgress < 0.33) {
                plantStage = 'small';
                plantIcon = '🌱';
                plantSize = 40;
              } else if (growthProgress < 0.66) {
                plantStage = 'medium';
                plantIcon = '🌿';
                plantSize = 56;
              } else {
                plantStage = 'large';
                plantIcon = '🌾';
                plantSize = 72;
              }
              const waterBar = Math.max(0, plot.waterLevel);
              let renderStatus = plot.status;
              if (plot.status !== 'empty' && isReady) {
                renderStatus = 'ready';
              }
              return (
                <div
                  key={plot.id + '-' + idx}
                  className={getPlotStyle({ ...plot, status: renderStatus, quality: plot.quality }) + ' relative biome-plot'}
                  style={{ minHeight: 260, maxHeight: 280, height: 260, padding: 0 }}
                  title={renderStatus === 'ready' && plot.expectedYield > 0
                    ? `Expected Yield: ${plot.expectedYield} RT`
                    : plot.status !== 'empty'
                      ? `${plot.cropType} (Quality: ${plot.quality})`
                      : 'Plot'}
                >
                  {/* User profile logo and timer in top right, stacked vertically */}
                  <div style={{ position: 'absolute', top: 8, right: 12, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <img src={plot.userPfp} alt="avatar" className="w-8 h-8 rounded-full border-2 border-emerald-300 bg-white" />
                    {renderStatus !== 'empty' && renderStatus !== 'ready' && timeLeft > 0 && (
                      <div style={{ fontSize: 12, color: '#444', fontWeight: 400, background: 'rgba(255,255,255,0.7)', borderRadius: 4, padding: '1px 6px', marginTop: 2 }}>
                        {timeLeft > 60 ? `${Math.floor(timeLeft / 60)}h ${timeLeft % 60}m` : `${timeLeft}m`}
                      </div>
                    )}
                  </div>
                  <div style={{ width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
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
                    {plot.status !== 'empty' && (
                      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <CircularProgressBar value={Math.round(growthProgress * 100)} size={44} strokeWidth={6} color="#34d399" bgColor="#e5e7eb" label={Math.round(growthProgress * 100) + '%'} />
                        <CircularProgressBar value={Math.round(waterBar)} size={32} strokeWidth={5} color="#60a5fa" bgColor="#e5e7eb" label={''} />
                      </div>
                    )}
                    <div className="w-full flex flex-col items-center" style={{ position: 'absolute', top: 12, left: 0, zIndex: 20, pointerEvents: 'none' }}>
                      <p className="text-xs font-bold text-gray-700" style={{ textAlign: 'center' }}>Plot #{plot.id}</p>
                      <p className="text-xs text-gray-600 mt-1 truncate mb-2" style={{ textAlign: 'center', maxWidth: '90%' }}>{plot.cropType}</p>
                    </div>
                    <div className="flex flex-col items-center justify-end h-full" style={{ position: 'relative', zIndex: 5, marginTop: 0, marginBottom: 0 }}>
                      {renderStatus === 'ready' ? (
                        <span
                          style={{ fontSize: plantSize, color: '#fbbf24', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Scissors className="w-10 h-10 text-yellow-500 drop-shadow-lg" />
                        </span>
                      ) : plot.status !== 'empty' ? (
                        <span
                          className={
                            'transition-all duration-500'
                          }
                          style={{ marginBottom: 4, fontSize: plantSize }}
                        >
                          {plantIcon}
                        </span>
                      ) : null}
                    </div>
                    {plot.status === 'needsWater' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <Droplets className="w-10 h-10 text-blue-400 animate-bounce mb-2" />
                        <span className="text-blue-700 font-semibold text-sm bg-white/80 rounded-xl px-3 py-1 shadow">Water me!</span>
                      </div>
                    )}
                    {plot.status === 'withering' && plot.harvestedAt ? (
                      <>
                        <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold z-40 flex items-center shadow-lg">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17a2 2 0 002-2v-2a2 2 0 00-4 0v2a2 2 0 002 2zm6-2v-2a6 6 0 10-12 0v2a2 2 0 002 2h8a2 2 0 002-2z"/></svg>
                          Locked
                        </div>
                        <LockedOverlay harvestedAt={plot.harvestedAt} />
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-4 mb-8">
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span className="text-gray-600 font-medium">Page {page + 1} of {totalPages}</span>
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
    </>);
} 
import { Box, Sprout } from 'lucide-react';
import { useAccount, useContractRead, useContractReads } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import RiseFarmingABI from '../abi/RiseFarming.json';
import { marketItems, MarketItem } from './Marketplace';
import { useWallet as useInGameWallet } from '../hooks/useWallet';

const FARMING_ADDRESS = import.meta.env.VITE_FARMING_ADDRESS;

// Card color utility (copied from Marketplace)
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

function Inventory() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const { wallet: inGameWallet, isLoading: walletLoading, error: walletError } = useInGameWallet(address);
  const inGameAddress = inGameWallet?.address;
  
  const itemIds = marketItems.map(item => item.id);
  // Only use seed IDs for bundle/single mapping
  const seedIds = marketItems.filter(item => item.category === 'seeds').map(item => item.id);
  // Fetch total balances (for all items)
  const { data: balancesRaw } = useContractRead({
    address: FARMING_ADDRESS,
    abi: RiseFarmingABI as any,
    functionName: 'getUserInventory',
    args: inGameAddress ? [inGameAddress, itemIds] : undefined,
  });
  const balances: (bigint | number)[] = Array.isArray(balancesRaw) ? balancesRaw : [];
  // Fetch bundle and single seed counts for all seeds using useContractReads
  const { data: bundleSeedsRaw } = useContractReads({
    contracts: seedIds.map(id => ({
      address: FARMING_ADDRESS,
      abi: RiseFarmingABI as any,
      functionName: 'userBundleSeeds',
      args: [inGameAddress, id],
    })),
  });
  const { data: singleSeedsRaw } = useContractReads({
    contracts: seedIds.map(id => ({
      address: FARMING_ADDRESS,
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

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Box className="w-16 h-16 text-emerald-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Your Inventory</h2>
        <p className="text-gray-500 text-center max-w-md mb-4">
          Connect your wallet to view your inventory.
        </p>
      </div>
    );
  }

  // Show loading state while wallet is loading
  if (walletLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Box className="w-16 h-16 text-emerald-400 mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Loading Wallet...</h2>
        <p className="text-gray-500 text-center max-w-md mb-4">
          Initializing your in-game wallet...
        </p>
      </div>
    );
  }

  // Show error state if wallet failed to load
  if (walletError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Box className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Wallet Error</h2>
        <p className="text-red-500 text-center max-w-md mb-4">
          Failed to load your in-game wallet: {walletError}
        </p>
      </div>
    );
  }

  if (!balances) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Box className="w-16 h-16 text-emerald-400 mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Loading Inventory...</h2>
      </div>
    );
  }

  // Prepare inventory list
  // Always show Fertilizer Spreader (id: 12) in inventory, even if amount is 0
  const inventory: { item: MarketItem; amount: number }[] = marketItems.map((item, idx) => ({
    item,
    amount: Number(balances[idx] ?? 0),
  })).filter(entry => entry.amount > 0 || entry.item.id === 12); // 12 = Fertilizer Spreader

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Your Inventory</h2>
        {inGameWallet && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 ml-4 text-green-700 font-medium flex items-center">
            ✅ In-Game Wallet Connected: {inGameWallet.address.slice(0, 6)}...{inGameWallet.address.slice(-4)}
          </div>
        )}
      </div>
      {inventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Box className="w-16 h-16 text-emerald-400 mb-4" />
          <p className="text-gray-500 text-center max-w-md mb-4">
            You have not purchased any items yet. Buy seeds, tools, or bundles from the marketplace!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Show singles */}
          {inventory.map(({ item, amount }, idx) => {
            const key: string = String(item.id);
            return (
              <div key={item.id} className={`rounded-xl border-2 p-6 shadow-sm flex flex-col items-center ${getCardColor(item.rarity)}`}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="flex items-center gap-2 font-semibold text-lg mb-1">
                  {item.name}
                  {item.category === 'seeds' && (
                    <button
                      className="ml-1 p-1 rounded-full bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors"
                      title="Go to My Farm"
                      onClick={() => navigate('/farm')}
                    >
                      <Sprout className="w-5 h-5 text-emerald-600" />
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-2">{item.description}</div>
                <div className="text-sm font-bold text-emerald-700 mb-1">Amount: {amount}</div>
                {/* Show breakdown for seeds */}
                {item.category === 'seeds' && (
                  <div className="text-xs text-gray-700 mb-2">
                    <span className="font-semibold">From Bundles:</span> {bundleSeeds[key] || 0} |
                    <span className="font-semibold ml-2">Singles:</span> {singleSeeds[key] || 0}
                  </div>
                )}
                <ul className="list-disc list-inside text-xs text-gray-600 mb-2">
                  {item.benefits.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Inventory; 
import { cookieStorage, createStorage, http } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Dynamically build networks from env
const riseTestnet = {
  id: parseInt(import.meta.env.VITE_RISE_CHAIN_ID),
  name: import.meta.env.VITE_RISE_NETWORK_NAME,
  network: 'rise-testnet',
  nativeCurrency: {
    name: import.meta.env.VITE_RISE_CURRENCY_SYMBOL,
    symbol: import.meta.env.VITE_RISE_CURRENCY_SYMBOL,
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RISE_RPC_URL] },
    public: { http: [import.meta.env.VITE_RISE_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'RISE Explorer', url: import.meta.env.VITE_RISE_BLOCK_EXPLORER_URL },
  },
  testnet: true,
};

const somniaTestnet = {
  id: parseInt(import.meta.env.VITE_CHAIN_ID),
  name: import.meta.env.VITE_NETWORK_NAME,
  network: 'somnia-testnet',
  nativeCurrency: {
    name: import.meta.env.VITE_CURRENCY_SYMBOL,
    symbol: import.meta.env.VITE_CURRENCY_SYMBOL,
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RPC_URL] },
    public: { http: [import.meta.env.VITE_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: import.meta.env.VITE_BLOCK_EXPLORER_URL },
  },
  testnet: true,
};

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
if (!projectId) throw new Error('Project ID is not defined');

export const networks = [riseTestnet, somniaTestnet] as [typeof riseTestnet, typeof somniaTestnet];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig; 
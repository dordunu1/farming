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

const nexusTestnet = {
  id: parseInt(import.meta.env.VITE_NEXUS_CHAIN_ID),
  name: import.meta.env.VITE_NEXUS_NETWORK_NAME,
  network: 'nexus-testnet',
  nativeCurrency: {
    name: import.meta.env.VITE_NEXUS_CURRENCY_SYMBOL,
    symbol: import.meta.env.VITE_NEXUS_CURRENCY_SYMBOL,
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_NEXUS_RPC_URL] },
    public: { http: [import.meta.env.VITE_NEXUS_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Nexus Explorer', url: import.meta.env.VITE_NEXUS_BLOCK_EXPLORER_URL },
  },
  testnet: true,
};

const pharosTestnet = {
  id: parseInt(import.meta.env.VITE_PHAROS_CHAIN_ID),
  name: import.meta.env.VITE_PHAROS_NETWORK_NAME,
  network: 'pharos',
  nativeCurrency: {
    name: import.meta.env.VITE_PHAROS_CURRENCY_SYMBOL,
    symbol: import.meta.env.VITE_PHAROS_CURRENCY_SYMBOL,
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_PHAROS_RPC_URL] },
    public: { http: [import.meta.env.VITE_PHAROS_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Pharos Explorer', url: import.meta.env.VITE_PHAROS_BLOCK_EXPLORER_URL },
  },
  testnet: true,
};

export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
if (!projectId) throw new Error('Project ID is not defined');

export const networks = [riseTestnet, somniaTestnet, nexusTestnet, pharosTestnet];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig; 
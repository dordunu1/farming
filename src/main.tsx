import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import ReownProvider from './context/ReownProvider';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

const fluentTestnet = {
  id: parseInt(import.meta.env.VITE_FLUENT_CHAIN_ID),
  name: import.meta.env.VITE_FLUENT_NETWORK_NAME,
  network: 'fluent-testnet',
  nativeCurrency: {
    name: import.meta.env.VITE_FLUENT_CURRENCY_SYMBOL,
    symbol: import.meta.env.VITE_FLUENT_CURRENCY_SYMBOL,
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_FLUENT_RPC_URL] },
    public: { http: [import.meta.env.VITE_FLUENT_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Fluent Explorer', url: import.meta.env.VITE_FLUENT_BLOCK_EXPLORER_URL },
  },
  testnet: true,
};

const config = getDefaultConfig({
  appName: 'RiceRise',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [riseTestnet, somniaTestnet, nexusTestnet, pharosTestnet, fluentTestnet],
  ssr: false,
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReownProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
    </ReownProvider>
  </StrictMode>
);

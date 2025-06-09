import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

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

const config = getDefaultConfig({
  appName: 'RiceRise',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [riseTestnet],
  ssr: false,
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#22c55e', // Tailwind emerald-500
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'rounded',
          })}
        >
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>
);

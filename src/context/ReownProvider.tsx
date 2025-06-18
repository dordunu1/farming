import React, { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { wagmiAdapter, config, projectId, networks } from '../config/reown';

const metadata = {
  name: 'RiceRise',
  description: 'RiceRise Farming Game',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  icons: ['https://i.imgur.com/dkXpF4C.png'],
};

const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  features: {
    analytics: true,
    socials: ['google', 'discord', 'github', 'facebook', 'apple', 'x', 'farcaster',],
  },
});

const queryClient = new QueryClient();

export default function ReownProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.AppKit = appKit;
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

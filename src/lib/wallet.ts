import { useAccount, useConnect, useDisconnect } from 'wagmi';

// Placeholder for wallet connection logic using RainbowKit/WalletConnect
export function connectWallet() {
  // To be implemented: RainbowKit/WalletConnect logic
  return null;
}

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error, status } = useConnect();
  const { disconnect } = useDisconnect();

  // Find WalletConnect and Injected connectors
  const injectedConnector = connectors.find((c) => c.id === 'injected');
  const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect');

  return {
    address,
    isConnected,
    connectInjected: () => injectedConnector && connect({ connector: injectedConnector }),
    connectWalletConnect: () => walletConnectConnector && connect({ connector: walletConnectConnector }),
    disconnect,
    error,
    status,
    connectors,
  };
} 
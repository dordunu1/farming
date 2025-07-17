const { config: dotenvConfig } = require('dotenv');
dotenvConfig();

require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200 // or even lower, like 50 for deployment
      }
    }
  },
  networks: {
    'rise-testnet': {
      url: process.env.RISE_RPC_URL || 'https://testnet.riselabs.xyz',
      chainId: 11155931,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    'somnia-testnet': {
      url: process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network',
      chainId: 50312,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    'nexus-testnet': {
      url: process.env.NEXUS_RPC_URL || 'https://testnet3.rpc.nexus.xyz',
      chainId: 3940,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      'rise-testnet': 'empty',
      'somnia-testnet': 'empty',
      'nexus-testnet': 'empty', // Placeholder, update if Nexus explorer supports verification
    },
    customChains: [
      {
        network: 'rise-testnet',
        chainId: 11155931,
        urls: {
          apiURL: 'https://explorer.testnet.riselabs.xyz/api',
          browserURL: 'https://explorer.testnet.riselabs.xyz',
        },
      },
      {
        network: 'somnia-testnet',
        chainId: 50312,
        urls: {
          apiURL: 'https://shannon-explorer.somnia.network/api',
          browserURL: 'https://shannon-explorer.somnia.network',
        },
      },
      {
        network: 'nexus-testnet',
        chainId: 3940,
        urls: {
          apiURL: 'https://testnet3.explorer.nexus.xyz/api', // Placeholder, update if available
          browserURL: 'https://testnet3.explorer.nexus.xyz',
        },
      },
    ],
  },
};

module.exports = config; 
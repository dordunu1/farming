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
  },
  etherscan: {
    apiKey: {
      'rise-testnet': 'empty',
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
    ],
  },
};

module.exports = config; 
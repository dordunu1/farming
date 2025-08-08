# Fluent Blockchain Integration Todo List

## ✅ Completed
- [x] Create `contracts/FluentFarming.sol` (already done)

## 🔄 In Progress / Next Steps

### 1. Environment Configuration
- [x] Create `.env.fluent` file with Fluent testnet configuration
- [x] Add Fluent environment variables:
  - `VITE_FLUENT_CHAIN_ID=20994`
  - `VITE_FLUENT_NETWORK_NAME=Fluent Testnet`
  - `VITE_FLUENT_CURRENCY_SYMBOL=ETH`
  - `VITE_FLUENT_BLOCK_EXPLORER_URL=https://testnet.fluentscan.xyz`
  - `VITE_FLUENT_RPC_URL=https://rpc.testnet.fluent.xyz`
  - `FLUENT_RPC_URL=https://rpc.testnet.fluent.xyz`

### 2. Hardhat Configuration
- [x] Update `hardhat.config.cjs` to add Fluent testnet network configuration
- [x] Add Fluent to etherscan configuration
- [x] Add Fluent custom chain configuration

### 3. Deployment Scripts
- [x] Update `scripts/deploy.cjs` to deploy `FluentFarming` on Fluent network
- [ ] Update `scripts/verify.cjs` to verify `FluentFarming` on Fluent testnet
- [ ] Create `scripts/verify-fluent.cjs` if needed

### 4. Package.json Scripts
- [x] Add `dev:fluent` script to `package.json` for `vite --mode fluent`
- [x] Add `build:fluent` script if needed

### 5. Frontend Configuration
- [x] Update `src/main.tsx` to add Fluent to the chain configuration for WalletConnect/RainbowKit
- [x] Update `src/config/reown.ts` to add Fluent to the supported networks array

### 6. Component Updates
- [x] Update `src/components/Profile.tsx` for Fluent support (currency, RPC, provider logic)
- [x] Update `src/components/Marketplace.tsx` for Fluent support (display ETH as native symbol)
- [x] Update `src/components/TransactionModal.tsx` for Fluent support (provider logic and transaction handling)
- [x] Update `src/components/HomeScreen.tsx` for Fluent support (provider logic)
- [x] Update `src/components/FarmGrid.tsx` for Fluent support (provider logic and plot status)
- [x] Update `src/components/PlantModal.tsx` for Fluent support (provider logic and seed info display)
- [x] Update `src/components/DailyRewardModal.tsx` for Fluent support (provider logic)

### 7. Component Verification
- [x] Check `src/components/Inventory.tsx` for chain-agnostic logic
- [x] Check `src/components/GlobalFarm.tsx` for `CURRENT_CHAIN` usage
- [x] Check `components/WalletModal.tsx` for chain logic
- [x] Check `src/components/AchievementModal.tsx` for chain logic

### 8. App Configuration
- [x] Update `src/App.tsx` for branding if needed

### 9. Deployment and Testing
- [x] Deploy `FluentFarming` contract to Fluent testnet
- [x] Verify contract on Fluent block explorer
- [ ] Test all functionality on Fluent network
- [x] Update contract addresses in environment files

## Network Details
- **Chain ID**: 20994
- **Network Name**: Fluent Testnet
- **Currency Symbol**: ETH
- **RPC URL**: https://rpc.testnet.fluent.xyz
- **Block Explorer**: https://testnet.fluentscan.xyz

## Notes
- Replace "Lisk" and "Lisk Sepolia" references with "Fluent" and "Fluent Testnet"
- Follow the same patterns as existing chains (Rise, Somnia, Nexus, Pharos)
- Ensure all environment variables follow the same naming convention
- Test thoroughly on Fluent testnet before mainnet deployment

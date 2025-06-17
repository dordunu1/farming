# Shreds Integration Setup Guide

## Overview
This guide explains how to set up Shreds integration for ultra-fast transactions on RISE testnet while maintaining compatibility with other chains.

## Installation

### 1. Install Shreds Package
```bash
npm install shreds
# or
yarn add shreds
# or
bun add shreds
```

### 2. Environment Variables
Add these to your `.env` file for RISE testnet:

```env
# RISE Testnet Configuration
VITE_CURRENT_CHAIN=RISE
VITE_RISE_RPC_URL=https://testnet.riselabs.xyz
VITE_SHREDS_WEBSOCKET_URL=wss://testnet.riselabs.xyz/ws
VITE_RISE_CHAIN_ID=11155931
VITE_RISE_NETWORK_NAME=RISE Testnet
VITE_RISE_CURRENCY_SYMBOL=ETH
VITE_RISE_BLOCK_EXPLORER_URL=https://explorer.testnet.riselabs.xyz
```

## How It Works

### Chain Detection
The integration automatically detects which chain you're on:
- **RISE Testnet**: Uses Shreds for 5ms transaction confirmations
- **Other Chains**: Falls back to standard transactions

### Features
1. **Ultra-Fast Transactions**: ~5ms confirmations on RISE testnet
2. **Real-Time Monitoring**: Watch for contract events as they happen
3. **Graceful Fallback**: Works on all chains, optimized for RISE
4. **Visual Indicators**: Shows when Shreds is enabled

### Usage

#### In Marketplace
The Marketplace component now automatically uses Shreds when on RISE testnet:

```typescript
// This happens automatically in handleConfirmBuy()
const result = await shredsService.sendTransaction(
  null,
  wallet,
  contract,
  'buyItem',
  [BigInt(itemId), BigInt(quantity), ZERO_ADDRESS],
  { value: priceETH }
);
```

#### Manual Usage
```typescript
import { shredsService, isRiseTestnet } from '../services/shredsService';

// Check if Shreds is available
if (isRiseTestnet()) {
  console.log('⚡ Shreds enabled for ultra-fast transactions');
}

// Send transaction with Shreds (RISE) or standard (other chains)
const result = await shredsService.sendTransaction(
  transaction,
  wallet,
  contract,
  'methodName',
  [arg1, arg2],
  { value: amount }
);
```

## Testing

### 1. Test on RISE Testnet
1. Set `VITE_CURRENT_CHAIN=RISE` in your `.env`
2. Start the app: `npm run dev:rise`
3. Connect wallet and try buying items
4. You should see "⚡ Shreds Enabled" indicator
5. Transactions should complete in ~5ms

### 2. Test on Somnia Testnet
1. Set `VITE_CURRENT_CHAIN=SOMNIA` in your `.env`
2. Start the app: `npm run dev:somnia`
3. Connect wallet and try buying items
4. No Shreds indicator should appear
5. Transactions use standard confirmation times

## Troubleshooting

### Shreds Not Working
1. **Check package installation**: `npm list shreds`
2. **Verify environment variables**: Ensure RISE config is correct
3. **Check console logs**: Look for Shreds initialization messages
4. **Network connectivity**: Ensure WebSocket connection to RISE testnet

### Fallback Behavior
If Shreds fails to initialize, the system automatically falls back to standard transactions. Check console for warnings like:
```
⚠️ Failed to initialize Shreds, falling back to standard transactions
```

### Performance Monitoring
Monitor transaction times in the browser console:
- **Shreds**: "✅ Shreds transaction confirmed in ~5ms"
- **Standard**: Normal transaction confirmation times

## Next Steps

### Phase 1: Marketplace (Current)
- ✅ Shreds integration in Marketplace
- ✅ Visual indicators
- ✅ Graceful fallback

### Phase 2: Other Components
- [ ] TransactionModal (watering/harvesting)
- [ ] PlantModal (planting seeds)
- [ ] Real-time plot monitoring

### Phase 3: Advanced Features
- [ ] Real-time leaderboard updates
- [ ] Live marketplace inventory
- [ ] Competitive events

## Benefits

### For Users
- **Instant feedback**: No more waiting for confirmations
- **Better UX**: Smooth, responsive gameplay
- **Competitive advantage**: Faster transactions than other games

### For Developers
- **Chain flexibility**: Works on all chains
- **Easy maintenance**: Single codebase for multiple chains
- **Future-proof**: Ready for Shreds on other chains

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify your environment configuration
3. Ensure you're connected to the correct network
4. Test with small transactions first

The integration is designed to be robust and will always fall back to standard transactions if Shreds is unavailable. 
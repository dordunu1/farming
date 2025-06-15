# Wallet Persistence System Guide

## Overview
The improved wallet system ensures that in-game wallets persist across sessions and survive cache clearing. The system uses deterministic wallet generation based on external wallet signatures.

## How It Works

### 1. Initial Setup
When a user first connects their wallet and signs in:
1. User connects external wallet (RainbowKit)
2. User signs message: "Sign in to RiceRise"
3. Signature is stored securely in both localStorage and IndexedDB
4. In-game wallet is generated deterministically from the signature
5. Wallet info is stored for quick access

### 2. Wallet Persistence
The system stores two types of data:
- **Signature**: The original signature from external wallet (encrypted)
- **Wallet Info**: Generated wallet details (encrypted)

### 3. Cache Clearing Recovery
When cache is cleared:
1. System tries to load stored wallet info
2. If not found, system retrieves stored signature
3. Wallet is regenerated deterministically from signature
4. New wallet info is stored for future use

## Key Features

### Deterministic Generation
- Same signature always generates the same wallet
- Wallet address, private key, and mnemonic are consistent
- No data loss when cache is cleared

### Dual Storage
- **localStorage**: Fast access, encrypted storage
- **IndexedDB**: Backup storage, survives some cache clearing scenarios

### Automatic Recovery
- Profile component automatically attempts wallet recovery
- Refresh button available if automatic recovery fails
- Clear error messages and loading states

## User Experience

### Normal Flow
1. User connects wallet → signs message → wallet generated automatically
2. Profile shows wallet info immediately
3. No additional steps required

### After Cache Clearing
1. User connects wallet → signs message (required)
2. System automatically regenerates wallet from stored signature
3. Profile shows wallet info
4. If automatic recovery fails, user can click "Refresh Wallet" button

### Error Handling
- Clear loading states during wallet operations
- Helpful error messages if wallet generation fails
- Manual refresh option available

## Technical Implementation

### Storage Keys
- `signature_${userId}`: Encrypted signature storage
- `wallet_${userId}`: Encrypted wallet info storage
- IndexedDB stores: `wallets` and `signatures`

### Security
- All sensitive data encrypted with AES-GCM
- Signatures and wallet info never stored in plain text
- Encryption keys managed securely

### Performance
- Fast wallet retrieval from localStorage
- IndexedDB as backup for reliability
- Minimal network requests

## Troubleshooting

### Wallet Not Found
If the Profile shows "No in-game wallet found":
1. Click "Refresh In-Game Wallet" button
2. System will regenerate wallet from stored signature
3. If this fails, user may need to sign in again

### Signature Missing
If signature is missing:
1. User must disconnect and reconnect wallet
2. Sign the authentication message again
3. System will store new signature and generate wallet

### Cache Clearing
The system is designed to handle cache clearing automatically:
1. localStorage cleared → system uses IndexedDB
2. IndexedDB cleared → system uses localStorage
3. Both cleared → user must sign in again

## Best Practices

1. **Always sign in after cache clearing**: Required for security
2. **Use refresh button if wallet missing**: Automatic recovery should work
3. **Keep signature secure**: Never share or expose signatures
4. **Regular testing**: Test cache clearing scenarios regularly

## Future Improvements

1. **Cloud backup**: Store encrypted signatures in user's cloud storage
2. **Multi-device sync**: Sync wallets across devices
3. **Enhanced security**: Additional encryption layers
4. **Recovery options**: Backup and restore functionality 
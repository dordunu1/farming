# API Documentation

The RiceRise API provides developers with programmatic access to game data, player statistics, and blockchain interactions. Build tools, analytics, and integrations with our comprehensive API.

## API Overview

### Base URL
```
https://api.ricerise.game/v1
```

### Authentication
All API requests require authentication using API keys:

```http
Authorization: Bearer YOUR_API_KEY
```

### Rate Limits
- **Free Tier**: 100 requests per hour
- **Developer Tier**: 1,000 requests per hour
- **Enterprise Tier**: 10,000 requests per hour

## Getting Started

### Obtaining API Keys
1. Visit [RiceRise Developer Portal](https://developers.ricerise.game)
2. Create a developer account
3. Generate your API key
4. Choose your tier based on usage needs

### Quick Start Example
```javascript
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.ricerise.game/v1';

async function getPlayerData(walletAddress) {
  const response = await fetch(`${BASE_URL}/players/${walletAddress}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}
```

## Core Endpoints

### Player Data

#### Get Player Profile
```http
GET /players/{walletAddress}
```

**Response:**
```json
{
  "walletAddress": "0x742d35Cc6e3f6b0b5df69e6e5d9e6f7b8a9c0d1e",
  "playerLevel": 5,
  "totalXP": 2450,
  "riceTokens": 1847,
  "energy": 85,
  "maxEnergy": 125,
  "farmLevel": 3,
  "totalHarvests": 47,
  "joinDate": "2024-01-15T10:30:00Z",
  "lastActive": "2024-01-20T14:22:00Z",
  "achievements": [
    {
      "id": "first_harvest",
      "name": "First Harvest",
      "unlockedAt": "2024-01-15T11:45:00Z"
    }
  ]
}
```

#### Get Player Statistics
```http
GET /players/{walletAddress}/stats
```

**Response:**
```json
{
  "totalEarnings": 15420,
  "totalSpent": 8930,
  "netProfit": 6490,
  "averageYield": 185.5,
  "bestHarvest": 625,
  "farmingStreak": 12,
  "plotsOwned": 16,
  "activePlots": 14,
  "cropQualityDistribution": {
    "poor": 5,
    "good": 15,
    "excellent": 20,
    "perfect": 7
  }
}
```

### Farm Data

#### Get Farm Status
```http
GET /farms/{walletAddress}
```

**Response:**
```json
{
  "farmId": "farm_123456",
  "ownerAddress": "0x742d35Cc6e3f6b0b5df69e6e5d9e6f7b8a9c0d1e",
  "farmLevel": 3,
  "totalPlots": 16,
  "plots": [
    {
      "id": 1,
      "status": "growing",
      "cropType": "Premium Rice",
      "progress": 75,
      "timeRemaining": 135,
      "waterLevel": 60,
      "quality": "good",
      "expectedYield": 285,
      "plantedAt": "2024-01-20T08:00:00Z",
      "lastWatered": "2024-01-20T12:00:00Z"
    }
  ],
  "upgrades": [
    {
      "type": "auto_watering",
      "level": 1,
      "purchasedAt": "2024-01-18T15:30:00Z"
    }
  ]
}
```

#### Get Plot Details
```http
GET /farms/{walletAddress}/plots/{plotId}
```

**Response:**
```json
{
  "plotId": 1,
  "status": "ready",
  "cropType": "Hybrid Rice",
  "progress": 100,
  "waterLevel": 75,
  "quality": "excellent",
  "expectedYield": 520,
  "plantedAt": "2024-01-20T04:00:00Z",
  "lastWatered": "2024-01-20T10:00:00Z",
  "readyAt": "2024-01-20T14:00:00Z",
  "harvestWindow": {
    "start": "2024-01-20T14:00:00Z",
    "end": "2024-01-20T20:00:00Z"
  }
}
```

### Marketplace Data

#### Get Marketplace Items
```http
GET /marketplace/items
```

**Query Parameters:**
- `category`: seeds, tools, upgrades, nfts
- `rarity`: common, rare, epic, legendary
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `sortBy`: price, popularity, newest
- `limit`: Number of items (default: 20, max: 100)
- `offset`: Pagination offset

**Response:**
```json
{
  "items": [
    {
      "id": "premium_rice_seeds",
      "name": "Premium Rice Seeds",
      "description": "High-yield rice seeds with 25% faster growth",
      "price": 0.005,
      "currency": "ETH",
      "category": "seeds",
      "rarity": "rare",
      "inStock": true,
      "totalSold": 1247,
      "rating": 4.8,
      "benefits": [
        "+25% growth speed",
        "+15% harvest yield"
      ]
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0,
    "hasNext": true
  }
}
```

#### Get Item Details
```http
GET /marketplace/items/{itemId}
```

**Response:**
```json
{
  "id": "auto_watering_system",
  "name": "Auto-Watering System",
  "description": "Automatically waters your crops every 6 hours",
  "price": 150,
  "currency": "RT",
  "category": "tools",
  "rarity": "epic",
  "inStock": true,
  "totalSold": 892,
  "rating": 4.9,
  "reviews": [
    {
      "playerId": "player_789",
      "rating": 5,
      "comment": "Game changer! Saves so much energy.",
      "date": "2024-01-19T16:20:00Z"
    }
  ],
  "benefits": [
    "Auto-watering every 6 hours",
    "Saves energy",
    "Maintains crop quality"
  ],
  "requirements": {
    "farmLevel": 2,
    "playerLevel": 3
  }
}
```

### Leaderboard Data

#### Get Leaderboard
```http
GET /leaderboard
```

**Query Parameters:**
- `period`: weekly, monthly, allTime
- `metric`: tokens, harvests, level
- `limit`: Number of entries (default: 100)

**Response:**
```json
{
  "period": "weekly",
  "metric": "tokens",
  "leaderboard": [
    {
      "rank": 1,
      "playerId": "player_456",
      "walletAddress": "0x...",
      "displayName": "RiceMaster2024",
      "value": 15420,
      "change": "+2",
      "level": 12,
      "avatar": "🌾"
    }
  ],
  "playerRank": {
    "rank": 47,
    "value": 2847,
    "change": "+5"
  },
  "updatedAt": "2024-01-20T15:00:00Z"
}
```

### Transaction Data

#### Get Transaction History
```http
GET /transactions/{walletAddress}
```

**Query Parameters:**
- `type`: plant, water, harvest, purchase
- `startDate`: ISO 8601 date string
- `endDate`: ISO 8601 date string
- `limit`: Number of transactions (default: 50)

**Response:**
```json
{
  "transactions": [
    {
      "id": "tx_789012",
      "type": "harvest",
      "plotId": 3,
      "amount": 285,
      "currency": "RT",
      "txHash": "0x1234567890abcdef...",
      "blockNumber": 18950123,
      "timestamp": "2024-01-20T14:30:00Z",
      "gasUsed": 65000,
      "gasFee": 0.002
    }
  ],
  "summary": {
    "totalTransactions": 156,
    "totalEarned": 15420,
    "totalSpent": 8930,
    "totalGasFees": 0.245
  }
}
```

## Real-time Data

### WebSocket Connection
Connect to real-time updates:

```javascript
const ws = new WebSocket('wss://api.ricerise.game/v1/ws');

ws.onopen = function() {
  // Subscribe to player updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'player',
    walletAddress: '0x742d35Cc6e3f6b0b5df69e6e5d9e6f7b8a9c0d1e'
  }));
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

### Available Channels
- `player`: Player data updates
- `farm`: Farm status changes
- `marketplace`: Marketplace updates
- `leaderboard`: Leaderboard changes
- `global`: Global game events

## Blockchain Integration

### Smart Contract Interactions

#### Get Contract ABI
```http
GET /contracts/{contractName}/abi
```

#### Get Contract Address
```http
GET /contracts/{contractName}/address
```

**Response:**
```json
{
  "contractName": "RiceToken",
  "address": "0x...",
  "network": "ethereum",
  "chainId": 1,
  "deployedAt": "2024-01-10T12:00:00Z",
  "verified": true
}
```

### Token Data

#### Get Token Information
```http
GET /tokens/RT
```

**Response:**
```json
{
  "symbol": "RT",
  "name": "Rice Token",
  "decimals": 18,
  "totalSupply": "1000000000000000000000000000",
  "circulatingSupply": "200000000000000000000000000",
  "price": {
    "usd": 0.0245,
    "eth": 0.000012,
    "change24h": "+5.2%"
  },
  "marketCap": 4900000,
  "volume24h": 125000
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "PLAYER_NOT_FOUND",
    "message": "Player with wallet address not found",
    "details": {
      "walletAddress": "0x..."
    }
  },
  "timestamp": "2024-01-20T15:30:00Z",
  "requestId": "req_123456789"
}
```

### Common Error Codes
- `INVALID_API_KEY`: API key is invalid or expired
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `PLAYER_NOT_FOUND`: Player doesn't exist
- `FARM_NOT_FOUND`: Farm doesn't exist
- `INVALID_PARAMETERS`: Request parameters are invalid
- `INTERNAL_ERROR`: Server error

## SDK Libraries

### JavaScript/TypeScript
```bash
npm install @ricerise/api-sdk
```

```javascript
import { RiceRiseAPI } from '@ricerise/api-sdk';

const api = new RiceRiseAPI('your_api_key');
const player = await api.getPlayer('0x...');
```

### Python
```bash
pip install ricerise-api
```

```python
from ricerise_api import RiceRiseAPI

api = RiceRiseAPI('your_api_key')
player = api.get_player('0x...')
```

## Best Practices

### Performance Optimization
- **Cache responses** when appropriate
- **Use pagination** for large datasets
- **Batch requests** when possible
- **Implement retry logic** for failed requests

### Security
- **Keep API keys secure** and rotate regularly
- **Use HTTPS** for all requests
- **Validate responses** before using data
- **Implement rate limiting** in your application

### Data Freshness
- **Check timestamps** on cached data
- **Use WebSockets** for real-time updates
- **Implement polling** with appropriate intervals
- **Handle stale data** gracefully

---

**Next**: Explore [Smart Contract ABI](contracts.md) for direct blockchain integration!
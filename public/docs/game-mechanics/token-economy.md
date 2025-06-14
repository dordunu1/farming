# Token Economy & On-Chain Security

This document explains how the RiceRise on-chain token economy works, what is enforced by the smart contract, and how it relates to the farming and energy systems described in the game docs.

---

## 0. How RT Rewards Accumulate and Are Claimed

- **All Rice Token (RT) rewards** from quests, daily streaks, and harvests are accumulated in your on-chain balance (tracked by the smart contract).
- When your on-chain RT balance reaches **500 RT**, you can claim your RT as ERC-20 tokens to your wallet using the `claimRiseTokens` function.
- This ensures all rewards are secure, auditable, and anti-cheat enforced. Micro-claims are prevented by the minimum threshold.
- The RT balance shown in the UI always reflects your on-chain balance, including all sources (quests, streaks, harvests, etc).

---

## 1. On-Chain Enforcement (Smart Contract)

### What the Contract Enforces
- **Seed Purchases:** All seeds, tools, and bundles are purchased on-chain. Prices are enforced by the contract.
- **Seed Rewards:** Each seed has a fixed, on-chain reward (base yield) and growth time. These cannot be changed by the frontend.
- **Growth Time:** The contract enforces how long a seed must grow before it can be harvested.
- **Harvesting:** Only after the required growth time can a user harvest and receive the on-chain reward.
- **Quest Rewards:** All quest rewards are tracked and claimed on-chain, preventing double-claiming.
- **Minimum Claim Threshold:** Users must accumulate at least 500 RISE before they can claim as ERC20 tokens.
- **Bundles & Tools:** Bundles are on-chain lists of items; tools and upgrades are also tracked as on-chain items.

#### Energy System
- **Initial Energy Claim**: Each user can claim 10 energy once using `claimInitialEnergy()`
- **Energy Booster**: Can be purchased for 25 RT to get 25 energy
- **Energy Costs**: All farming actions (planting, watering, harvesting) cost 1 energy each
- **Energy Tracking**: User's energy balance is tracked on-chain

#### Seed System
- **Seed Purchases**: All seeds, tools, and bundles are purchased on-chain with fixed prices
- **Seed Types**:
  - Basic Rice Seed: 0.0004 ETH, 15 RT base reward
  - Premium Rice Seed: 0.0006 ETH, 50 RT base reward
  - Hybrid Rice Seed: 0.0010 ETH, 85 RT base reward
- **Growth Times**:
  - Basic Rice: 7 minutes
  - Premium Rice: 6 minutes
  - Hybrid Rice: 5 minutes
- **Bundle Bonuses**:
  - Basic Rice Bundle: +40% growth and yield
  - Premium Rice Bundle: +20% growth and yield
  - Hybrid Rice Bundle: +21.43% growth and yield

#### Tool System
- **Tool Durability**: All tools have 5 uses before being burned
- **Tool Types**:
  - Watering Can: 0.000397 ETH, 5 uses
  - Golden Harvester (Single): 0.0008 ETH, 5 uses, +20% harvest bonus
  - Golden Harvester (Bundle): 0.0016 ETH, 5 uses, +20% harvest bonus
  - Fertilizer Spreader: RT cost, 1 use, +25% growth, +15% yield
  - Auto-Watering System: RT cost, 5 uses

#### Plot System
- **Plot States**: Empty → Needs Water → Growing → Ready → Locked
- **Plot Revival**: After harvest, plot is locked for 2 minutes, requires Fertilizer Spreader to revive
- **Plot Quality**: Water levels affect yield (50% to 125% based on quality)
- **Plot Growth**: Growth time and yield bonuses are enforced on-chain

#### Quest System
- **Quest Rewards**:
  - Plant 3 seeds: 1 RT
  - Water 5 plots: 2 RT
  - Harvest 2 plots: 3 RT
- **Daily Rewards**: 1-7 RT based on streak day
- **Anti-Cheat**: Prevents double-claiming of quest rewards

#### Security Features
- **Minimum Claim Threshold**: 500 RT required to claim as ERC20 tokens
- **Growth/Yield Caps**: Maximum 7% bonus for growth and yield
- **Tool Usage**: Tracks and enforces tool durability
- **Plot Cooldown**: Enforces 2-minute cooldown after harvest
- **Energy Requirements**: Enforces energy costs for all actions

---

## 2. How This Relates to Game Docs

### Farming Basics
- The contract enforces all core mechanics: prices, growth times, yields, and bonuses
- The frontend/game logic handles UI/UX and quality multipliers
- All purchases, plantings, and harvests are on-chain and auditable

### Quest System
- **Quest Types**: Daily quests are tracked in the frontend
- **Quest Rewards**: Fixed RT rewards set on-chain
- **Claiming**: Rewards go directly to on-chain RT balance
- **Anti-Cheat**: Contract prevents double-claiming

### Energy System
- Energy is tracked on-chain
- Initial energy claim (10) is enforced
- Energy booster purchases (25 RT for 25 energy) are enforced
- Energy costs for actions are enforced

---

## 3. Security & Anti-Cheat Notes

- **All core values are enforced on-chain**: prices, growth times, yields, bonuses
- **Frontend cannot override on-chain values**
- **Multipliers are capped**: Maximum 7% for growth and yield
- **Minimum claim threshold**: 500 RT prevents spam
- **Quest rewards are tracked on-chain**
- **Tool durability is enforced**
- **Plot cooldown is enforced**
- **Energy system is enforced**
- **All actions emit events for tracking**

---

## 4. Example: Complete Lifecycle

1. **Initial Setup**:
   - Claim 10 energy (on-chain)
   - Buy seeds and tools (on-chain)

2. **Farming Cycle**:
   - Plant seed (costs 1 energy, on-chain)
   - Water crop (costs 1 energy, requires Watering Can, on-chain)
   - Wait for growth (enforced by contract)
   - Harvest with Golden Harvester (costs 1 energy, on-chain)
   - Wait 2 minutes cooldown
   - Revive with Fertilizer Spreader (on-chain)

3. **Rewards**:
   - RT accumulates in contract balance
   - Claim when balance reaches 500 RT
   - Convert to ERC20 tokens

### Quest Lifecycle
1. **Complete**: Track requirements in frontend
2. **Claim**: Add RT to contract balance
3. **Accumulate**: Add to total balance

---

## 5. Extensibility
- New seeds, tools, and bundles can be added by contract owner
- Quest rewards can be modified using `setQuestReward`
- Future features can be added via contract upgrades
- DAO can vote to pause owner functions

---

**For more details, see:**
- [Farming Basics](./farming-basics.md)
- [Energy System](./energy-system.md) 
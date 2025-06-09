# Token Economy & On-Chain Security

This document explains how the RiceRise on-chain token economy works, what is enforced by the smart contract, and how it relates to the farming and energy systems described in the game docs.

---

## 0. How RT Rewards Accumulate and Are Claimed

- **All Rice Token (RT) rewards** from quests, daily streaks, and harvests are accumulated in your on-chain balance (tracked by the smart contract).
- When your on-chain RT balance reaches **20 RT** (20 * 10¹⁸), you can claim your RT as ERC-20 tokens to your wallet using the `claimRiseTokens` function.
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
- **Minimum Claim Threshold:** Users must accumulate at least 20 RISE before they can claim as ERC20 tokens.
- **Bundles & Tools:** Bundles are on-chain lists of items; tools and upgrades are also tracked as on-chain items.

### What the Contract Does NOT Enforce
- **Energy:** Energy is a gameplay resource, managed by the frontend. The contract does not track or enforce energy costs.
- **Yield Multipliers:** Quality, farm level, and streak bonuses are applied in the frontend/game logic, not on-chain. The contract only enforces the base yield.
- **Quest Progress:** Quest completion status is tracked in the frontend, but rewards are enforced on-chain.

---

## 2. How This Relates to Game Docs

### Farming Basics
- The contract enforces the **core anti-cheat rules**: price, growth time, and base yield for each seed.
- The frontend/game logic applies multipliers for quality, farm level, and streak, as described in [farming-basics.md](./farming-basics.md).
- All purchases, plantings, and harvests are on-chain and auditable.

### Quest System
- **Quest Types:** Daily quests (Plant seeds, Water plots, Harvest crops) are tracked in the frontend.
- **Quest Rewards:** Each quest has a fixed RT reward amount set on-chain by the contract owner.
- **Claiming:** Users can claim quest rewards directly to their RT balance in the contract.
- **Anti-Cheat:** The contract prevents double-claiming of quest rewards through on-chain tracking.

### Energy System
- Energy is a "soft" resource for gameplay, described in [energy-system.md](./energy-system.md).
- All energy costs and regeneration are handled in the frontend/game logic.
- The contract does not track or enforce energy, but the UI should always reflect the energy system described in the docs.

---

## 3. Security & Anti-Cheat Notes

- **Base yield, price, and growth time are always enforced on-chain.**
- **Frontend cannot override on-chain values.** Even if a user hacks the UI, they cannot claim more than the contract allows.
- **Multipliers (quality, farm level, streak) are for gameplay only.** If you want to make these trustless, you can add them to the contract in the future.
- **Minimum claim threshold (20 RISE) prevents spam and micro-claims.**
- **Quest rewards are tracked on-chain** to prevent double-claiming and ensure fair distribution.
- **All actions emit events for backend/Firebase sync and analytics.**

---

## 4. Example: Seed Lifecycle

1. **Purchase:** User buys a seed (on-chain, price enforced).
2. **Plant:** User plants the seed (on-chain, seed is burned, growth timer starts).
3. **Grow:** Frontend/game logic tracks energy and watering (not on-chain).
4. **Harvest:** After growth time, user harvests (on-chain, receives base yield as RISE balance).
5. **Claim:** When user has at least 20 RISE, they can claim as ERC20 tokens (on-chain).

### Quest Lifecycle
1. **Complete:** User completes quest requirements (tracked in frontend).
2. **Claim:** User claims quest reward (on-chain, adds RT to contract balance).
3. **Accumulate:** RT from quests adds to total balance in contract.
4. **Convert:** When total RT reaches 20, user can convert to ERC20 tokens.

---

## 5. Extensibility
- New seeds, tools, upgrades, and bundles can be added by the contract owner.
- Quest rewards can be modified by the contract owner using `setQuestReward`.
- Future features (e.g., on-chain multipliers, new payment tokens) can be added via contract upgrades.

---

**For more details, see:**
- [Farming Basics](./farming-basics.md)
- [Energy System](./energy-system.md) 
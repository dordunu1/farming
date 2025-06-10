# Energy System (RiceRise On-Chain)

## Overview
- Energy is tracked on-chain for each user.
- Starts at 0 for new users.
- Energy is only gained by claiming (once) or buying boosters.
- There is **no automatic or natural regeneration**.

## How to Get Energy

### 1. Claim Initial Energy
- Each user can claim **25 energy once**.
- Claim is only available after 5 minutes from first login/interaction.
- Use the `claimInitialEnergy()` contract function (UI will show a claim button and countdown).

### 2. Buy Energy Booster
- Each purchase gives **25 energy for 25 RT**.
- Limited by contract supply (initially 20,000 boosters).
- Use the `buyEnergyBooster()` contract function (UI: Marketplace > Energy Booster).

## Using Energy
- **All farming actions** (plant, water, harvest, etc.) cost **1 energy** each.
- If you have 0 energy, you cannot perform farming actions until you claim or buy more.

## No Natural Regeneration
- Energy does **not** regenerate over time.
- You must claim or buy boosters to replenish energy.

## Item IDs Table (from Contract)

| ID  | Name                        | Type      | Description/Use                        |
|-----|-----------------------------|-----------|----------------------------------------|
| 9   | Basic Rice Seed (Single)    | Seed      | Plant basic rice                       |
| 10  | Premium Rice Seed (Single)  | Seed      | Plant premium rice                     |
| 11  | Hybrid Rice Seed (Single)   | Seed      | Plant hybrid rice                      |
| 13  | Basic Rice Seed (Bundle)    | Bundle    | Bonus yield/growth for basic rice      |
| 14  | Premium Rice Seed (Bundle)  | Bundle    | Bonus yield/growth for premium rice    |
| 15  | Hybrid Rice Seed (Bundle)   | Bundle    | Bonus yield/growth for hybrid rice     |
| 17  | Golden Harvester (Single)   | Tool      | Harvest single plot, +20% RT           |
| 18  | Golden Harvester (Bundle)   | Tool      | Harvest all ready plots, +20% RT       |
| 19  | Energy Booster              | Booster   | +25 energy per purchase                |
| 12  | Fertilizer Spreader         | Tool      | Revive harvested plot after cooldown   |
| 6   | Auto-Watering System        | Tool      | Waters all crops every 6h              |
| 5   | Watering Can                | Tool      | Waters crops, +40% water level         |

## Checking Supply and Claim Status
- The UI displays the remaining supply of Energy Boosters (from `getEnergyBoosterSupply()` contract function).
- The UI shows if you have claimed your initial energy and the countdown until claim is available.

## Summary
- **No more energy potions, upgrades, or natural regen.**
- All energy is on-chain, claimable once, or bought as boosters.
- All actions cost 1 energy.
- UI will guide you to claim or buy energy as needed.

---

**Next**: Learn about [Crop Quality & Yield](crop-quality.md) to maximize your harvest returns!
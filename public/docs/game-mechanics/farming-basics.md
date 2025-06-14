# Farming Basics

Master the fundamentals of rice farming in RiceRise to maximize your yields and build a thriving agricultural empire.

## Core Farming Cycle

### The Three-Phase Cycle
Every crop follows this cycle:
1. **Planting** → 2. **Growing** → 3. **Harvesting**

Each phase requires different actions and attention to optimize your results.

## Energy System (On-Chain)

### How Energy Works
- Energy is tracked on-chain for each user
- Each user can claim 10 energy once (on first login) using `claimInitialEnergy()`
- All farming actions (planting, watering, harvesting) cost 1 energy each
- When energy runs out, buy Energy Booster (25 RT for 25 energy) using `buyEnergyBooster()`
- Energy does not regenerate automatically
- Energy is required for all farming actions

### Energy Booster
- **Cost:** 25 RT
- **Effect:** Adds 25 energy to your on-chain balance
- **How to Use:** Buy from marketplace, calls `buyEnergyBooster()`

## Planting Phase

### Seed Selection
Choose the right seeds for your strategy:

| Seed Type | Cost | Growth Time | Base Yield | Bundle Bonus |
|-----------|------|-------------|------------|--------------|
| Basic Rice | 0.0004 ETH | 7 min | 15 RT | +40% (Bundle) |
| Premium Rice | 0.0006 ETH | 6 min | 50 RT | +20% (Bundle) |
| Hybrid Rice | 0.0010 ETH | 5 min | 85 RT | +21.43% (Bundle) |

### Planting Strategy
- **Diversify**: Mix different seed types
- **Timing**: Stagger plantings for continuous harvests
- **Energy**: Ensure sufficient energy for full cycle
- **Budget**: Balance investment with expected returns

## Growing Phase

### Water Management
Water is crucial for crop development:

- **Watering costs 1 energy per action**
- **Crops do not start growing until first watering**
- **Watering Can required for watering (5 uses per can)**

#### Water Level Impact
- **0-20%**: Withering (50% yield penalty)
- **20-40%**: Poor quality (75% yield)
- **40-60%**: Good quality (90% yield)
- **60-80%**: Excellent quality (100% yield)
- **80-100%**: Perfect quality (125% yield bonus)

#### Watering Schedule
- **Check regularly** for optimal results
- **Water when level drops below 60%**
- **Use Auto-Watering System** for automation (5 uses)

### Growth Monitoring
Track these key metrics:

#### Progress Indicators
- **Growth Bar**: 0-100% completion
- **Time Remaining**: Countdown to harvest
- **Water Level**: Current hydration status
- **Quality Rating**: Poor → Good → Excellent → Perfect

#### Visual Cues
- **Plot Color**: Indicates current status
- **Status Icons**: Shows current plot state
- **Quality Indicators**: Color-coded borders

## Harvesting Phase

### Optimal Timing
Harvest at the right moment:
- **100% Growth**: Crop is fully mature
- **Ready State**: Visual ready indicator
- **Golden Harvester Required**: For harvesting

### Yield Calculation
Your final yield depends on:

```
Final Yield = Base Yield × Quality Multiplier × Bundle Bonus × Golden Harvester Bonus
```

#### Quality Multipliers
- **Poor**: 0.5x (50% of base yield)
- **Good**: 0.75x (75% of base yield)
- **Excellent**: 1.0x (100% of base yield)
- **Perfect**: 1.25x (125% of base yield)

#### Bundle Bonuses
- **Basic Rice Bundle**: +40% growth and yield
- **Premium Rice Bundle**: +20% growth and yield
- **Hybrid Rice Bundle**: +21.43% growth and yield

#### Golden Harvester Bonus
- **+20%** bonus on all harvests
- **Single**: Harvests one plot
- **Bundle**: Harvests all ready plots
- **5 uses** per harvester

## Tools & Equipment

### Essential Tools
- **Watering Can**
  - Cost: 0.000397 ETH
  - Uses: 5 per can
  - Required for watering crops

- **Fertilizer Spreader**
  - Cost: Available for RT
  - Effect: +25% growth, +15% yield
  - Required for plot revival

### Advanced Tools
- **Golden Harvester**
  - Single: 0.0008 ETH
  - Bundle: 0.0016 ETH
  - Uses: 5 per harvester
  - Effect: +20% harvest bonus

- **Auto-Watering System**
  - Cost: Available for RT
  - Uses: 5 per system
  - Effect: Waters all growing plots

## Plot Lifecycle

### States
1. **Empty**: Available for planting
2. **Needs Water**: After planting, before first water
3. **Growing**: Actively growing crop
4. **Ready**: Ready for harvest
5. **Locked**: After harvest, needs revival

### Revival Process
- After harvest, plot enters locked state
- Wait for cooldown period
- Use Fertilizer Spreader to revive
- Plot returns to empty state

## Best Practices

### Energy Management
- **Start with 10 free energy**
- **Buy Energy Boosters** (25 RT for 25 energy)
- **Plan actions** to minimize energy waste
- **Keep emergency energy** for critical actions

### Tool Management
- **Track tool uses** (5 uses per tool)
- **Buy tools in advance**
- **Use Auto-Watering** for efficiency
- **Save Golden Harvester** for optimal harvests

### Quality Optimization
- **Maintain high water levels**
- **Use Fertilizer Spreader** strategically
- **Time harvests** for perfect quality
- **Monitor plot states** regularly

## Common Issues

### Low Energy
- **Solution**: Buy Energy Booster (25 RT)
- **Prevention**: Plan actions efficiently

### Tool Depletion
- **Solution**: Buy new tools
- **Prevention**: Track remaining uses

### Withering Crops
**Problem**: Crops turning red, losing yield
**Solution**: 
- Water immediately
- Check every 2-3 hours
- Set phone reminders
- Consider energy boosters

### Low Yields
**Problem**: Harvests below expectations
**Solution**:
- Improve watering consistency
- Upgrade to better seeds
- Focus on quality over quantity
- Check farm level bonuses

### Energy Shortages
**Problem**: Running out of energy frequently
**Solution**:
- Claim your initial 5 energy on first login
- Buy energy boosters from the marketplace (25 RT for 5 energy)
- Plan actions in advance
- Optimize action timing

## Growth Speed & Yield Bonuses (On-Chain Rules)

To ensure fairness and prevent cheating, all growth speed and yield bonuses are enforced on-chain. The allowed bonus range is **1.5% to 7%**.

### Growth Speed Bonus
- **Formula:**
  - Adjusted growth time = base growth time × (1 - (growthSpeedBonus / 100))
  - Example: For a 5% bonus, adjusted = base × 0.95
- **Cap:**
  - Minimum: 0%
  - Maximum: 7%
- **Result:**
  - Crops with a growth speed bonus will be ready sooner, but never more than 7% faster than base.

### Yield Bonus
- **Formula:**
  - Final yield = base yield × (1 + (yieldBonus / 100))
  - Example: For a 5% bonus, final = base × 1.05
- **Cap:**
  - Minimum: 1.5%
  - Maximum: 7%
- **Result:**
  - Crops with a yield bonus will earn more RT, but never more than 7% above base.

**All calculations are performed on-chain. Any attempt to plant or harvest with out-of-range bonuses will fail.**

## Seed Harvest Yields

| Seed Type                | Growth/Yield Bonus | Harvest RT (per seed) |
|--------------------------|--------------------|----------------------|
| Basic Rice Seed (Single) | 0%                 | 15                   |
| Basic Rice Seed (Bundle) | 1.5%               | 21                   |
| Premium Rice Seed (Single)| 0%                | 50                   |
| Premium Rice Seed (Bundle)| 3%                | 60                   |
| Hybrid Rice Seed (Single)| 0%                 | 70                   |
| Hybrid Rice Seed (Bundle)| 7%                 | 85                   |

- **Bundles** give higher yield per seed and include growth/yield bonuses.
- **Single seeds** have no growth/yield bonus.

## On-Chain Tool Mechanics (Golden Harvester, Fertilizer Spreader, Auto-Watering System)

### Golden Harvester (Single & Bundle)
- **Single:** Required to harvest a single plot. When used, burns one harvester and gives +20% RT bonus. RT is assigned on-chain instantly.
- **Bundle:** Required to harvest all ready plots at once. When used, burns one bundle and gives +20% RT bonus on all harvested plots. RT is assigned on-chain instantly.

### Fertilizer Spreader
- Applied to a plot to boost growth and yield bonuses. Burns one per use, updates plot's growth/yield bonus on-chain.
- **Growth Effect:** Increases the plot's growth bonus, which reduces the time required to reach harvest. The original plantedAt timestamp is NOT changed; instead, the time to harvest is recalculated using the new bonus.

### Auto-Watering System
- Lets user water all their growing plots in one call if they own the tool. The tool is only consumed if at least one plot is watered. (Actual water logic can be expanded as needed.)

### Tool Effects Table

| Tool                      | How to Use / Apply                        | On-Chain Effect                                      | Durability |
|---------------------------|-------------------------------------------|------------------------------------------------------|------------|
| Golden Harvester (Single) | `harvestWithGoldenHarvester(plotId)`      | Harvests one plot, +20% RT, burns after 5 uses       | 5 uses     |
| Golden Harvester (Bundle) | `multiHarvestWithGoldenHarvester()`       | Harvests all ready plots, +20% RT each, burns after 5 uses | 5 uses     |
| Fertilizer Spreader       | `applyFertilizer(plotId)`                 | Boosts growth/yield for a plot, burns one tool per use| 1 use      |
| Auto-Watering System      | `autoWaterCrops()`                        | Waters all growing plots for owner, burns after 5 uses| 5 uses     |

### UI/UX Notes
- Show the number of uses left for each tool in the UI.
- Warn the user when a tool is about to break (1 use left).
- Auto-harvest (cron) also decrements uses and burns the tool after 5 uses.

## Plot Revival After Harvest (New Mechanic)

### Plot Lifecycle Update
After a plot is harvested, it enters a cooldown period and cannot be replanted immediately. The new lifecycle is:

1. **Growing** → 2. **Ready** → 3. **Harvested (Locked)** → 4. **Reviving (with Fertilizer)** → 5. **Available for Planting**

- **Harvested (Locked):** When a plot is harvested, it is set to `growing = false`, and a `harvestedAt` timestamp is recorded. The plot is locked for 3 weeks and cannot be replanted.
- **Reviving:** After 3 weeks, the user must apply a Fertilizer Spreader to the plot to revive it. This burns one fertilizer and sets the plot as available for planting again.

### On-Chain Logic
- The Plot struct now includes `harvestedAt` and `needsFertilizer` fields.
- After harvest, set `growing = false`, `harvestedAt = block.timestamp`, and `needsFertilizer = true`.
- To revive, the user calls `revivePlot(plotId)`, which checks:
  - 3 weeks have passed since `harvestedAt`
  - The user has a fertilizer item (burns one)
  - Sets `needsFertilizer = false` so the plot can be planted again
- Planting is only allowed if `needsFertilizer == false`.

### UI/UX Notes
- Show a "Locked" or "Revive" state on the plot card after harvest.
- Display a timer for when the plot can be revived.
- Show a "Revive with Fertilizer" button if the cooldown is over and the user has fertilizer in their wallet.
- If the user does not have fertilizer, show a prompt to buy more.

## Tool Durability (New Mechanic)

### How It Works
- **Golden Harvester (Single & Bundle)** and **Auto-Watering System** now have durability.
- Each tool can be used **5 times** before it is burned (removed from inventory).
- The number of uses left is tracked on-chain.
- When a tool is purchased or received, it starts with 5 uses.
- Each time you use the tool (manual or via cron/auto), the use count decreases by 1.
- When uses reach 0, the tool is burned.

### Example
- If you buy 2 Golden Harvesters, you get 10 total uses (5 per tool).
- After 5 uses, 1 harvester is burned; after 10, both are gone.

### UI/UX Notes
- Show the number of uses left for each tool in the UI.
- Warn the user when a tool is about to break (1 use left).
- Auto-harvest (cron) also decrements uses and burns the tool after 5 uses.

## Plot Lifecycle (On-Chain Logic Clarification)

- When you plant a seed, the contract sets `plantedAt` and `readyAt` timestamps, and marks the plot as `growing`.
- The plot is considered **ready to harvest** as soon as the current time passes `readyAt` and `growing` is still true. This is checked automatically by the contract—**no background job or update function is needed**.
- When you harvest, the contract immediately sets `growing = false`, records `harvestedAt`, and sets `needsFertilizer = true` to start the revival cooldown.
- The plot remains locked until the cooldown passes and you apply fertilizer to revive it.
- All state transitions are handled by contract logic and timestamps—**the UI simply reads the current state from the contract**.

---

**Next**: Learn about the [Marketplace](features/marketplace.md) to acquire seeds and tools!
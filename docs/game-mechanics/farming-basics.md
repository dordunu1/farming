# Farming Basics

Master the fundamentals of rice farming in RiceRise to maximize your yields and build a thriving agricultural empire.

## Core Farming Cycle

### The Three-Phase Cycle
Every crop follows this cycle:
1. **Planting** → 2. **Growing** → 3. **Harvesting**

Each phase requires different actions and attention to optimize your results.

## Energy System (On-Chain)

### How Energy Works
- Energy is now tracked on-chain for each user.
- Each user can claim 5 energy once (on first login/interaction) using the `claimInitialEnergy()` contract function.
- All farming actions (planting, watering, harvesting) cost 1 energy each.
- When a user's energy reaches 0, they must purchase an Energy Booster (cost: 25 RT, gives 5 energy) using the `buyEnergyBooster()` contract function (available in the UI marketplace).
- Energy does **not** regenerate automatically over time in the UI.
- Energy is required for all farming actions. If you have no energy, you cannot plant, water, or harvest until you buy a booster.

### Energy Booster
- **Cost:** 25 RT
- **Effect:** Instantly adds 5 energy to your on-chain balance
- **How to Use:** Buy from the marketplace in the UI, which calls the contract's `buyEnergyBooster()` function

## Planting Phase

### Seed Selection
Choose the right seeds for your strategy:

| Seed Type | Cost | Growth Time | Base Yield | Energy Cost |
|-----------|------|-------------|------------|-------------|
| Basic Rice | 50 RT | 8 hours | 100-150 RT | 10 |
| Premium Rice | 0.005 ETH | 6 hours | 200-300 RT | 10 |
| Hybrid Rice | 0.01 ETH | 4 hours | 400-600 RT | 15 |

### Planting Strategy
- **Diversify**: Mix different seed types
- **Timing**: Stagger plantings for continuous harvests
- **Energy**: Ensure sufficient energy for full cycle (claim initial energy and buy boosters as needed)
- **Budget**: Balance investment with expected returns

## Growing Phase

### Water Management
Water is crucial for crop development:

- **Watering now costs 1 energy per action.**
- **Crops do not start growing until they are watered for the first time.**

#### Water Level Impact
- **0-20%**: Withering (50% yield penalty)
- **20-40%**: Poor quality (75% yield)
- **40-60%**: Good quality (90% yield)
- **60-80%**: Excellent quality (100% yield)
- **80-100%**: Perfect quality (125% yield bonus)

#### Watering Schedule
- **Check every 2-4 hours** for optimal results
- **Water when level drops below 60%**
- **Avoid over-watering** (diminishing returns)
- **Set reminders** for important crops

### Growth Monitoring
Track these key metrics:

#### Progress Indicators
- **Growth Bar**: 0-100% completion
- **Time Remaining**: Countdown to harvest
- **Water Level**: Current hydration status
- **Quality Rating**: Poor → Good → Excellent → Perfect

#### Visual Cues
- **Plot Color**: Indicates current status
- **Animations**: Water droplets, growth effects
- **Icons**: Status-specific symbols
- **Borders**: Color-coded condition indicators

## Harvesting Phase

### Optimal Timing
Harvest at the right moment:
- **100% Growth**: Crop is fully mature
- **Yellow Border**: Visual ready indicator
- **Pulsing Animation**: Attention-grabbing effect
- **Notification**: System alerts when ready

### Yield Calculation
Your final yield depends on:

```
Final Yield = Base Yield × Quality Multiplier × Farm Level Bonus × Streak Bonus
```

#### Quality Multipliers
- **Poor**: 0.5x (50% of base yield)
- **Good**: 0.75x (75% of base yield)
- **Excellent**: 1.0x (100% of base yield)
- **Perfect**: 1.25x (125% of base yield)

#### Farm Level Bonuses
- **Level 1-3**: No bonus
- **Level 4-6**: +5% yield
- **Level 7-9**: +10% yield
- **Level 10+**: +15% yield

## Advanced Farming Techniques

### Crop Rotation
Optimize your plots with rotation:
1. **High-yield crops** in prime slots
2. **Quick crops** for energy efficiency
3. **Experimental plots** for testing
4. **Backup plots** for emergencies

### Batch Management
Efficient batch operations:
- **Group plantings** by growth time
- **Synchronized watering** schedules
- **Coordinated harvesting** sessions
- **Energy optimization** planning

### Risk Management
Protect your investments:
- **Diversified portfolio** of seed types
- **Emergency water reserves** (energy)
- **Harvest timing** flexibility
- **Market price** awareness

## Farm Optimization

### Plot Efficiency
Maximize your 16 plots:
- **Active plots**: 12-14 for continuous production
- **Experimental plots**: 2-3 for testing new strategies
- **Emergency plots**: 1-2 for quick energy recovery

### Energy Allocation
Smart energy management:
- **Reserve 30 energy** for emergencies
- **Plan full cycles** before starting
- **Use energy boosters** strategically
- **Time actions** with regeneration

### Quality Focus
Prioritize crop quality:
- **Perfect quality** gives 25% bonus yield
- **Consistent watering** maintains quality
- **Quality tools** (future feature) enhance results
- **Experience bonuses** improve over time

## Common Farming Patterns

### The Steady Farmer
- **Strategy**: Consistent basic rice production
- **Schedule**: 8-hour cycles, 3 times daily
- **Investment**: Low risk, steady returns
- **Best for**: Beginners, casual players

### The Speed Farmer
- **Strategy**: Fast hybrid rice cycles
- **Schedule**: 4-hour cycles, 6 times daily
- **Investment**: High risk, high returns
- **Best for**: Active players, profit maximizers

### The Balanced Farmer
- **Strategy**: Mix of all seed types
- **Schedule**: Staggered timing
- **Investment**: Medium risk, optimized returns
- **Best for**: Experienced players, long-term growth

## Seasonal Events

### Special Seasons
Limited-time farming bonuses:
- **Spring Growth**: +20% growth speed
- **Summer Harvest**: +15% yield bonus
- **Autumn Festival**: Rare seed drops
- **Winter Rest**: Energy regeneration boost

### Event Strategies
- **Prepare in advance** with resources
- **Adjust farming patterns** for bonuses
- **Participate actively** for exclusive rewards
- **Plan long-term** around event calendar

## Troubleshooting Common Issues

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

**Next**: Learn about the [Energy System](energy-system.md) to master resource management!
# Farming Basics

Master the fundamentals of rice farming in RiceRise to maximize your yields and build a thriving agricultural empire.

## Core Farming Cycle

### The Three-Phase Cycle
Every crop follows this cycle:
1. **Planting** → 2. **Growing** → 3. **Harvesting**

Each phase requires different actions and attention to optimize your results.

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
- **Energy**: Ensure sufficient energy for full cycle
- **Budget**: Balance investment with expected returns

## Growing Phase

### Water Management
Water is crucial for crop development:

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
- Plan actions in advance
- Use natural regeneration
- Purchase energy boosters
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

| Tool                      | How to Use / Apply                        | On-Chain Effect                                      |
|---------------------------|-------------------------------------------|------------------------------------------------------|
| Golden Harvester (Single) | `harvestWithGoldenHarvester(plotId)`      | Harvests one plot, +20% RT, burns one tool           |
| Golden Harvester (Bundle) | `multiHarvestWithGoldenHarvester()`       | Harvests all ready plots, +20% RT each, burns bundle |
| Fertilizer Spreader       | `applyFertilizer(plotId)`                 | Boosts growth/yield for a plot, burns one tool       |
| Auto-Watering System      | `autoWaterCrops()`                        | Waters all growing plots for owner, burns one if used|

---

**Next**: Learn about the [Energy System](energy-system.md) to master resource management!
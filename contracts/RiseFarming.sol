// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RiseFarming is Ownable, Pausable, ReentrancyGuard {
    // --- Structs ---
    struct Item {
        uint256 id;
        string name;
        uint8 itemType; // 0=seed, 1=tool, 2=upgrade
        uint256 priceETH;
        address paymentToken;
        uint256 baseReward; // RISE earned on harvest (base yield)
        uint256 baseGrowthTime; // seconds until harvest (base)
        uint16 growthBonusBP; // growth speed bonus in basis points (e.g. 15 = 1.5%, 70 = 7%)
        uint16 yieldBonusBP; // yield bonus in basis points (e.g. 15 = 1.5%, 70 = 7%)
        bool active;
        uint256 maxSupply; // Maximum supply for this item
        uint256 supply;    // Current supply of this item
    }
    struct Bundle {
        uint256 id;
        string name;
        uint256[] itemIds;
        uint256[] itemAmounts;
        uint256 priceETH;
        address paymentToken;
        bool active;
        uint256 maxSupply;
        uint256 supply;
    }
    enum PlotState { Empty, NeedsWater, Growing, Ready, Locked }
    struct Plot {
        uint256 seedId;
        uint256 plantedAt;
        uint256 readyAt;
        uint16 growthBonusBP;
        uint16 yieldBonusBP;
        bool growing;
        uint256 harvestedAt;
        bool needsFertilizer;
        bool startedGrowing;
        PlotState state;
    }

    // --- Storage ---
    mapping(uint256 => Item) public items;
    mapping(uint256 => Bundle) public bundles;
    mapping(address => mapping(uint256 => uint256)) public userItemBalances; // user => itemId => balance
    mapping(address => mapping(uint256 => Plot)) public userPlots; // user => plotId => Plot
    mapping(address => uint256) public userStreaks;
    mapping(address => uint256) public lastClaimedDay;
    mapping(address => uint256) public playerLevel;
    mapping(address => uint256) public totalXP;
    mapping(address => uint256) public farmLevel;
    mapping(address => uint256) public totalHarvests;
    mapping(address => uint256) public riceTokens; // On-chain RISE balance
    mapping(address => bool) public hasAutoWatering;
    // Add quest tracking
    mapping(address => mapping(uint256 => bool)) public claimedQuests; // user => questId => claimed
    mapping(uint256 => uint256) public questRewards; // questId => reward amount

    // Payment tokens
    mapping(address => bool) public acceptedPaymentTokens; // 0x0 for ETH, or ERC20 address

    // Daily rewards
    uint256[7] public dailyRewards; // 1 RT to 7 RT

    IERC20 public riseToken;

    uint16 public constant MIN_BONUS_BP = 0; // 0% now allowed for single seeds
    uint16 public constant MAX_BONUS_BP = 70; // 7%

    // Add item IDs for harvester and energy booster
    uint256 public constant HARVESTER_ID = 7;
    uint256 public constant ENERGY_BOOSTER_ID = 19;

    // Add Basic Rice Seed (Single)
    uint256 public constant BASIC_SEED_SINGLE_ID = 9;
    // Add Premium Rice Seed (Single)
    uint256 public constant PREMIUM_SEED_SINGLE_ID = 10;
    // Add Hybrid Rice Seed (Single)
    uint256 public constant HYBRID_SEED_SINGLE_ID = 11;
    // Add Fertilizer Spreader
    uint256 public constant FERTILIZER_SPREADER_ID = 12;
    // Add Starter Bundle (as an item for supply tracking)
    uint256 public constant STARTER_BUNDLE_ID = 4;
    // Add Auto-Watering System
    uint256 public constant AUTO_WATERING_SYSTEM_ID = 6;
    // Add Watering Can
    uint256 public constant WATERING_CAN_ID = 5;

    // Add Golden Harvester (Single & Bundle)
    uint256 public constant GOLDEN_HARVESTER_SINGLE_ID = 17;
    uint256 public constant GOLDEN_HARVESTER_BUNDLE_ID = 18;

    // Add tool durability mapping
    mapping(address => mapping(uint256 => uint256)) public userToolUses;

    // --- Events ---
    event ItemPurchased(address indexed user, uint256 bundleId, uint256[] itemIds, uint256[] amounts, address paymentToken, uint256 price);
    event SeedPlanted(address indexed user, uint256 plotId, uint256 seedId);
    event Harvested(address indexed user, uint256 plotId, uint256 reward);
    event DailyRewardClaimed(address indexed user, uint256 day, uint256 reward);
    event ToolUsed(address indexed user, uint256 toolId, uint256 plotId);
    event FarmUpgraded(address indexed user, uint256 upgradeId);
    event PaymentTokenAdded(address token);
    event PaymentTokenRemoved(address token);
    event RiseClaimed(address indexed user, uint256 amount);
    event BundlePurchased(address indexed user, uint256 bundleId, uint256[] itemIds, uint256[] amounts, uint256 price);
    event QuestRewardClaimed(address indexed user, uint256 questId, uint256 reward);
    event ItemPurchasedWithRT(address indexed user, uint256 itemId, uint256 amount, uint256 totalRT);
    event PlotReady(address indexed user, uint256 plotId);
    event PlotAutoWatered(address indexed user, uint256 plotId);
    event ToolUseDecremented(address indexed user, uint256 toolId, uint256 usesLeft);
    event ToolBurned(address indexed user, uint256 toolId);

    // --- Storage ---
    mapping(address => mapping(uint256 => uint256)) public userSingleSeeds;
    mapping(address => mapping(uint256 => uint256)) public userBundleSeeds;

    // Add a pause flag for daily rewards
    bool public dailyRewardPaused = false;

    // --- Energy System ---
    mapping(address => uint256) public userEnergy;
    mapping(address => bool) public hasClaimedInitialEnergy;

    // --- Constructor ---
    constructor() Ownable(msg.sender) {
        acceptedPaymentTokens[address(0)] = true;
        dailyRewards = [1, 2, 3, 4, 5, 6, 7]; // Example: 1 RT for day 1, 2 RT for day 2, etc.

        // Initialize quest rewards
        questRewards[1] = 1; // 1 RT for planting 3 seeds
        questRewards[2] = 2; // 2 RT for watering 5 plots
        questRewards[3] = 3; // 3 RT for harvesting 2 plots

        // Update Basic Rice Seed (Single)
        items[BASIC_SEED_SINGLE_ID] = Item({
            id: BASIC_SEED_SINGLE_ID,
            name: "Basic Rice Seed (Single)",
            itemType: 0,
            priceETH: 400000000000000, // 0.0004 ETH
            paymentToken: address(0),
            baseReward: 15,
            baseGrowthTime: 420, // 7 minutes
            growthBonusBP: 0,
            yieldBonusBP: 0,
            active: true,
            maxSupply: 10000,
            supply: 10000
        });
        // Update Basic Rice Seed (Bundle)
        bundles[13] = Bundle({
            id: 13,
            name: "Basic Rice Seed (Bundle)",
            itemIds: new uint256[](1),
            itemAmounts: new uint256[](1),
            priceETH: 600000000000000, // 0.0006 ETH
            paymentToken: address(0),
            active: true,
            maxSupply: 1000,
            supply: 1000
        });
        bundles[13].itemIds[0] = BASIC_SEED_SINGLE_ID;
        bundles[13].itemAmounts[0] = 5;
        items[BASIC_SEED_SINGLE_ID].growthBonusBP = 15;
        items[BASIC_SEED_SINGLE_ID].yieldBonusBP = 15;

        // Update Premium Rice Seed (Single)
        items[PREMIUM_SEED_SINGLE_ID] = Item({
            id: PREMIUM_SEED_SINGLE_ID,
            name: "Premium Rice Seed (Single)",
            itemType: 0,
            priceETH: 600000000000000, // 0.0006 ETH
            paymentToken: address(0),
            baseReward: 50,
            baseGrowthTime: 360, // 6 minutes
            growthBonusBP: 0,
            yieldBonusBP: 0,
            active: true,
            maxSupply: 4000,
            supply: 4000
        });
        // Update Premium Rice Seed (Bundle)
        bundles[14] = Bundle({
            id: 14,
            name: "Premium Rice Seed (Bundle)",
            itemIds: new uint256[](1),
            itemAmounts: new uint256[](1),
            priceETH: 1000000000000000, // 0.0010 ETH
            paymentToken: address(0),
            active: true,
            maxSupply: 1000,
            supply: 1000
        });
        bundles[14].itemIds[0] = PREMIUM_SEED_SINGLE_ID;
        bundles[14].itemAmounts[0] = 2;
        items[PREMIUM_SEED_SINGLE_ID].growthBonusBP = 30;
        items[PREMIUM_SEED_SINGLE_ID].yieldBonusBP = 30;

        // Update Hybrid Rice Seed (Single)
        items[HYBRID_SEED_SINGLE_ID] = Item({
            id: HYBRID_SEED_SINGLE_ID,
            name: "Hybrid Rice Seed (Single)",
            itemType: 0,
            priceETH: 1000000000000000, // 0.0010 ETH
            paymentToken: address(0),
            baseReward: 70,
            baseGrowthTime: 300, // 5 minutes
            growthBonusBP: 0,
            yieldBonusBP: 0,
            active: true,
            maxSupply: 2000,
            supply: 2000
        });
        // Update Hybrid Rice Seed (Bundle)
        bundles[15] = Bundle({
            id: 15,
            name: "Hybrid Rice Seed (Bundle)",
            itemIds: new uint256[](1),
            itemAmounts: new uint256[](1),
            priceETH: 1400000000000000, // 0.0014 ETH
            paymentToken: address(0),
            active: true,
            maxSupply: 500,
            supply: 500
        });
        bundles[15].itemIds[0] = HYBRID_SEED_SINGLE_ID;
        bundles[15].itemAmounts[0] = 2;
        items[HYBRID_SEED_SINGLE_ID].baseReward = 85;
        items[HYBRID_SEED_SINGLE_ID].growthBonusBP = 70;
        items[HYBRID_SEED_SINGLE_ID].yieldBonusBP = 70;

        // Golden Harvester (Single)
        items[GOLDEN_HARVESTER_SINGLE_ID] = Item({
            id: GOLDEN_HARVESTER_SINGLE_ID,
            name: "Golden Harvester (Single)",
            itemType: 1,
            priceETH: 800000000000000, // 0.0008 ETH
            paymentToken: address(0),
            baseReward: 0,
            baseGrowthTime: 0,
            growthBonusBP: 0,
            yieldBonusBP: 0,
            active: true,
            maxSupply: 3750,
            supply: 3750
        });
        // Golden Harvester (Bundle)
        bundles[16] = Bundle({
            id: 16,
            name: "Golden Harvester (Bundle)",
            itemIds: new uint256[](1),
            itemAmounts: new uint256[](1),
            priceETH: 1600000000000000, // 0.0016 ETH
            paymentToken: address(0),
            active: true,
            maxSupply: 1875,
            supply: 1875
        });
        bundles[16].itemIds[0] = GOLDEN_HARVESTER_SINGLE_ID;
        bundles[16].itemAmounts[0] = 2;
        // Add Fertilizer Spreader
        items[FERTILIZER_SPREADER_ID] = Item({
            id: FERTILIZER_SPREADER_ID,
            name: "Fertilizer Spreader",
            itemType: 1, // tool
            priceETH: 0, // Set actual price as needed
            paymentToken: address(0),
            baseReward: 0,
            baseGrowthTime: 0,
            growthBonusBP: 25,
            yieldBonusBP: 15,
            active: true,
            maxSupply: 10000,
            supply: 10000
        });
        // Add Starter Bundle (as an item for supply tracking)
        items[STARTER_BUNDLE_ID] = Item({
            id: STARTER_BUNDLE_ID,
            name: "Starter Bundle",
            itemType: 0, // or 3 if you want a new type for bundles
            priceETH: 0, // Set actual price as needed
            paymentToken: address(0),
            baseReward: 0,
            baseGrowthTime: 0,
            growthBonusBP: 0,
            yieldBonusBP: 0,
            active: true,
            maxSupply: 1000,
            supply: 1000
        });
        // Add Auto-Watering System
        items[AUTO_WATERING_SYSTEM_ID] = Item({
            id: AUTO_WATERING_SYSTEM_ID,
            name: "Auto-Watering System",
            itemType: 1, // tool
            priceETH: 0, // Set actual price as needed
            paymentToken: address(0),
            baseReward: 0,
            baseGrowthTime: 0,
            growthBonusBP: 0,
            yieldBonusBP: 0,
            active: true,
            maxSupply: 25000,
            supply: 25000
        });
        // Add Watering Can
        items[WATERING_CAN_ID] = Item({
            id: WATERING_CAN_ID,
            name: "Watering Can",
            itemType: 1, // tool
            priceETH: 397000000000000, // Set price as needed (in wei)
            paymentToken: address(0),
            baseReward: 0,
            baseGrowthTime: 0,
            growthBonusBP: 0,
            yieldBonusBP: 0,
            active: true,
            maxSupply: 50000,
            supply: 50000
        });

        // Initialize bundles with supply
        // Basic Rice Seed (Bundle): 5x Basic Rice Seed (Single)
        bundles[13] = Bundle({
            id: 13,
            name: "Basic Rice Seed (Bundle)",
            itemIds: new uint256[](1),
            itemAmounts: new uint256[](1),
            priceETH: 600000000000000, // 0.0006 ETH
            paymentToken: address(0),
            active: true,
            maxSupply: 1000,
            supply: 1000
        });
        bundles[13].itemIds[0] = BASIC_SEED_SINGLE_ID;
        bundles[13].itemAmounts[0] = 5;

        // Premium Rice Seed (Bundle): 2x Premium Rice Seed (Single)
        bundles[14] = Bundle({
            id: 14,
            name: "Premium Rice Seed (Bundle)",
            itemIds: new uint256[](1),
            itemAmounts: new uint256[](1),
            priceETH: 1000000000000000, // 0.0010 ETH
            paymentToken: address(0),
            active: true,
            maxSupply: 1000,
            supply: 1000
        });
        bundles[14].itemIds[0] = PREMIUM_SEED_SINGLE_ID;
        bundles[14].itemAmounts[0] = 2;

        // Hybrid Rice Seed (Bundle, 2x)
        bundles[15] = Bundle({
            id: 15,
            name: "Hybrid Rice Seed (Bundle)",
            itemIds: new uint256[](1),
            itemAmounts: new uint256[](1),
            priceETH: 1400000000000000, // 0.0014 ETH
            paymentToken: address(0),
            active: true,
            maxSupply: 500,
            supply: 500
        });
        bundles[15].itemIds[0] = HYBRID_SEED_SINGLE_ID;
        bundles[15].itemAmounts[0] = 2;

        // Energy Booster
        items[ENERGY_BOOSTER_ID] = Item({
            id: ENERGY_BOOSTER_ID,
            name: "Energy Booster",
            itemType: 2,
            priceETH: 0, // Set actual price as needed
            paymentToken: address(0),
            baseReward: 0,
            baseGrowthTime: 0,
            growthBonusBP: 0,
            yieldBonusBP: 0,
            active: true,
            maxSupply: 20000,
            supply: 20000
        });
    }

    // --- Admin Functions ---
    function addItem(Item memory item) external onlyOwner {
        items[item.id] = item;
    }
    function updateItem(Item memory item) external onlyOwner {
        require(items[item.id].id != 0, "Item does not exist");
        items[item.id] = item;
    }
    function deactivateItem(uint256 itemId) external onlyOwner {
        items[itemId].active = false;
    }
    function addBundle(Bundle memory bundle) external onlyOwner {
        bundles[bundle.id] = bundle;
    }
    function updateBundle(Bundle memory bundle) external onlyOwner {
        require(bundles[bundle.id].id != 0, "Bundle does not exist");
        bundles[bundle.id] = bundle;
    }
    function deactivateBundle(uint256 bundleId) external onlyOwner {
        bundles[bundleId].active = false;
    }
    function addPaymentToken(address token) external onlyOwner {
        acceptedPaymentTokens[token] = true;
        emit PaymentTokenAdded(token);
    }
    function removePaymentToken(address token) external onlyOwner {
        acceptedPaymentTokens[token] = false;
        emit PaymentTokenRemoved(token);
    }
    function pause() external onlyOwner {
        _pause();
    }
    function unpause() external onlyOwner {
        _unpause();
    }
    function withdrawETH() external onlyOwner {
        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Withdraw failed");
    }
    function withdrawToken(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal > 0, "No balance");
        IERC20(token).transfer(msg.sender, bal);
    }
    function setRiseToken(address _riseToken) external onlyOwner {
        riseToken = IERC20(_riseToken);
    }
    function setItemMaxSupply(uint256 itemId, uint256 maxSupply) external onlyOwner {
        require(items[itemId].id != 0, "Item does not exist");
        items[itemId].maxSupply = maxSupply;
        items[itemId].supply = maxSupply;
    }

    // --- Marketplace ---
    function buyBundle(uint256 bundleId, uint256 amount, address paymentToken) external payable whenNotPaused nonReentrant {
        Bundle storage bundle = bundles[bundleId];
        require(bundle.active, "Bundle inactive");
        require(bundle.supply >= amount, "Insufficient bundle supply");
        uint256 totalPrice = paymentToken == address(0) ? bundle.priceETH * amount : 0; // Only ETH for now
        if (paymentToken == address(0)) {
            require(msg.value >= totalPrice, "Insufficient ETH");
        } else {
            IERC20(paymentToken).transferFrom(msg.sender, address(this), totalPrice);
        }
        // Check and decrement supply for each item in the bundle
        for (uint256 i = 0; i < bundle.itemIds.length; i++) {
            uint256 itemId = bundle.itemIds[i];
            uint256 itemAmount = bundle.itemAmounts[i] * amount;
            require(items[itemId].supply >= itemAmount, "Insufficient supply");
            items[itemId].supply -= itemAmount;
            // If seed, increment bundle seed count
            if (items[itemId].itemType == 0) {
                userBundleSeeds[msg.sender][itemId] += itemAmount;
            }
            // In buyBundle, for each item in the bundle:
            if (items[itemId].itemType == 1) {
                userToolUses[msg.sender][itemId] += 5 * itemAmount;
            }
        }
        // Decrement bundle supply
        bundle.supply -= amount;
        // Credit items
        for (uint256 i = 0; i < bundle.itemIds.length; i++) {
            userItemBalances[msg.sender][bundle.itemIds[i]] += bundle.itemAmounts[i] * amount;
        }
        emit BundlePurchased(msg.sender, bundleId, bundle.itemIds, bundle.itemAmounts, totalPrice);
        // Award XP for buying harvester bundle, else 1 XP
        if (bundleId == GOLDEN_HARVESTER_BUNDLE_ID) {
            totalXP[msg.sender] += 5;
        } else {
            totalXP[msg.sender] += 1;
        }
    }

    function buyItem(uint256 itemId, uint256 amount, address paymentToken) external payable whenNotPaused nonReentrant {
        Item storage item = items[itemId];
        require(item.active, "Item inactive");
        require(item.supply >= amount, "Insufficient supply");
        require(amount > 0, "Amount must be > 0");
        uint256 totalPrice = paymentToken == address(0) ? item.priceETH * amount : 0; // Only ETH for now
        if (paymentToken == address(0)) {
            require(msg.value >= totalPrice, "Insufficient ETH");
        } else {
            IERC20(paymentToken).transferFrom(msg.sender, address(this), totalPrice);
        }
        // Decrement supply
        item.supply -= amount;
        // Credit item to user
        userItemBalances[msg.sender][itemId] += amount;
        // If seed, increment single seed count
        if (item.itemType == 0) {
            userSingleSeeds[msg.sender][itemId] += amount;
        }
        // In buyItem, when a user receives a tool, set uses to 5 per tool received
        if (item.itemType == 1) {
            userToolUses[msg.sender][itemId] += 5 * amount;
        }
        // Emit event (reuse ItemPurchased for consistency)
        uint256[] memory itemIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        itemIds[0] = itemId;
        amounts[0] = amount;
        emit ItemPurchased(msg.sender, 0, itemIds, amounts, paymentToken, totalPrice);
        // Award XP for buying harvester, else 1 XP
        if (itemId == HARVESTER_ID || itemId == GOLDEN_HARVESTER_SINGLE_ID || itemId == GOLDEN_HARVESTER_BUNDLE_ID) {
            totalXP[msg.sender] += 5;
        } else {
            totalXP[msg.sender] += 1;
        }
    }

    // --- Planting & Harvesting ---
    function plantSeed(uint256 plotId, uint256 seedId) external whenNotPaused nonReentrant {
        require(userEnergy[msg.sender] >= 1, "Not enough energy");
        userEnergy[msg.sender] -= 1;
        Plot storage plot = userPlots[msg.sender][plotId];
        require(!plot.needsFertilizer, "Apply fertilizer first");
        require(userItemBalances[msg.sender][seedId] > 0, "No seeds");
        Item storage seed = items[seedId];
        require(seed.active && seed.itemType == 0, "Invalid seed");
        require(seed.growthBonusBP >= MIN_BONUS_BP && seed.growthBonusBP <= MAX_BONUS_BP, "Growth bonus out of range");
        require(seed.yieldBonusBP >= MIN_BONUS_BP && seed.yieldBonusBP <= MAX_BONUS_BP, "Yield bonus out of range");
        // Burn one use
        userItemBalances[msg.sender][seedId] -= 1;
        uint16 growthBonusBP = 0;
        uint16 yieldBonusBP = 0;
        if (userBundleSeeds[msg.sender][seedId] > 0) {
            userBundleSeeds[msg.sender][seedId] -= 1;
            // Apply correct bundle bonus from docs/marketplace
            if (seedId == 9) { growthBonusBP = 400; yieldBonusBP = 400; } // Basic Rice Seed: 40%
            else if (seedId == 10) { growthBonusBP = 200; yieldBonusBP = 200; } // Premium Rice Seed: 20%
            else if (seedId == 11) { growthBonusBP = 214; yieldBonusBP = 214; } // Hybrid Rice Seed: 21.43%
        } else if (userSingleSeeds[msg.sender][seedId] > 0) {
            userSingleSeeds[msg.sender][seedId] -= 1;
            // No bonus
            growthBonusBP = 0;
            yieldBonusBP = 0;
        } else {
            revert("No seeds available");
        }
        // Do not set plantedAt/readyAt/growing yet
        userPlots[msg.sender][plotId] = Plot({
            seedId: seedId,
            plantedAt: 0,
            readyAt: 0,
            growthBonusBP: growthBonusBP,
            yieldBonusBP: yieldBonusBP,
            growing: false,
            harvestedAt: 0,
            needsFertilizer: false,
            startedGrowing: false,
            state: PlotState.NeedsWater
        });
        emit SeedPlanted(msg.sender, plotId, seedId);
        totalXP[msg.sender] += 1; // Award 1 XP for planting
    }

    // --- Daily Rewards ---
    function setDailyRewardPaused(bool paused) external onlyOwner {
        dailyRewardPaused = paused;
    }

    function claimDailyReward() external whenNotPaused nonReentrant {
        require(!dailyRewardPaused, "Daily reward is paused");
        uint256 day = (userStreaks[msg.sender] % 7);
        require(block.timestamp > lastClaimedDay[msg.sender] + 1 days, "Already claimed today");
        uint256 reward = dailyRewards[day];
        riceTokens[msg.sender] += reward;
        userStreaks[msg.sender] += 1;
        lastClaimedDay[msg.sender] = block.timestamp;
        emit DailyRewardClaimed(msg.sender, day + 1, reward);
        totalXP[msg.sender] += 1; // Award 1 XP for claiming daily reward
    }

    // --- Tools/Upgrades Example ---
    function useTool(uint256 toolId, uint256 plotId) external whenNotPaused nonReentrant {
        require(userItemBalances[msg.sender][toolId] > 0, "No tool");
        Item storage tool = items[toolId];
        require(tool.active && tool.itemType == 1, "Invalid tool");
        userItemBalances[msg.sender][toolId] -= 1;
        // Apply tool effect (e.g., water instantly)
        emit ToolUsed(msg.sender, toolId, plotId);
    }
    function upgradeFarm(uint256 upgradeId) external whenNotPaused nonReentrant {
        require(userItemBalances[msg.sender][upgradeId] > 0, "No upgrade");
        Item storage upgrade = items[upgradeId];
        require(upgrade.active && upgrade.itemType == 2, "Invalid upgrade");
        userItemBalances[msg.sender][upgradeId] -= 1;
        farmLevel[msg.sender] += 1;
        emit FarmUpgraded(msg.sender, upgradeId);
        totalXP[msg.sender] += 1; // Award 1 XP for upgrading farm
    }

    // --- Quest Functions ---
    function setQuestReward(uint256 questId, uint256 reward) external onlyOwner {
        questRewards[questId] = reward;
    }

    function claimQuestReward(uint256 questId) external whenNotPaused nonReentrant {
        require(!claimedQuests[msg.sender][questId], "Quest already claimed");
        uint256 reward = questRewards[questId];
        require(reward > 0, "Invalid quest or no reward");
        
        // Add reward to user's RT balance
        riceTokens[msg.sender] += reward;
        claimedQuests[msg.sender][questId] = true;
        
        emit QuestRewardClaimed(msg.sender, questId, reward);
        totalXP[msg.sender] += 1; // Award 1 XP for claiming quest reward
    }

    // --- Utility ---
    function getUserInventory(address user, uint256[] calldata itemIds) external view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](itemIds.length);
        for (uint256 i = 0; i < itemIds.length; i++) {
            balances[i] = userItemBalances[user][itemIds[i]];
        }
        return balances;
    }
    function getUserPlots(address user, uint256[] calldata plotIds) external view returns (Plot[] memory) {
        Plot[] memory plots = new Plot[](plotIds.length);
        for (uint256 i = 0; i < plotIds.length; i++) {
            plots[i] = userPlots[user][plotIds[i]];
        }
        return plots;
    }
    function claimRiseTokens() external nonReentrant {
        uint256 amount = riceTokens[msg.sender];
        require(amount >= 20 ether, "Must claim at least 20 RISE");
        riceTokens[msg.sender] = 0;
        require(riseToken.transfer(msg.sender, amount), "Transfer failed");
        emit RiseClaimed(msg.sender, amount);
    }
    // Fallback to receive ETH
    receive() external payable {}

    // --- New Function ---
    function waterCrop(uint256 plotId) external whenNotPaused nonReentrant {
        require(userEnergy[msg.sender] >= 1, "Not enough energy");
        userEnergy[msg.sender] -= 1;
        require(userItemBalances[msg.sender][WATERING_CAN_ID] > 0, "No watering can");
        userItemBalances[msg.sender][WATERING_CAN_ID] -= 1;
        Plot storage plot = userPlots[msg.sender][plotId];
        if (!plot.startedGrowing) {
            Item storage seed = items[plot.seedId];
            uint256 adjustedGrowthTime = seed.baseGrowthTime * (1000 - plot.growthBonusBP) / 1000;
            plot.plantedAt = block.timestamp;
            plot.readyAt = block.timestamp + adjustedGrowthTime;
            plot.growing = true;
            plot.startedGrowing = true;
            plot.state = PlotState.Growing;
        }
        // else: normal watering logic (e.g., increase water level, improve quality, etc.)
        emit ToolUsed(msg.sender, WATERING_CAN_ID, plotId);
        totalXP[msg.sender] += 1; // Award 1 XP for watering
    }

    // --- New Functions for Tools ---
    // 1. Single Golden Harvester: Harvest one plot with +20% bonus, burn one per use
    function harvestWithGoldenHarvester(uint256 plotId) external whenNotPaused nonReentrant {
        require(userEnergy[msg.sender] >= 1, "Not enough energy");
        userEnergy[msg.sender] -= 1;
        require(userItemBalances[msg.sender][GOLDEN_HARVESTER_SINGLE_ID] > 0, "Need Golden Harvester (Single)");
        Plot storage plot = userPlots[msg.sender][plotId];
        require(plot.growing, "Nothing growing");
        require(block.timestamp >= plot.readyAt, "Not ready");
        // Burn one harvester
        require(userToolUses[msg.sender][GOLDEN_HARVESTER_SINGLE_ID] > 0, "No harvester uses left");
        userToolUses[msg.sender][GOLDEN_HARVESTER_SINGLE_ID] -= 1;
        if (userToolUses[msg.sender][GOLDEN_HARVESTER_SINGLE_ID] == 0) {
            userItemBalances[msg.sender][GOLDEN_HARVESTER_SINGLE_ID] -= 1;
            emit ToolBurned(msg.sender, GOLDEN_HARVESTER_SINGLE_ID);
        }
        // Calculate yield with +20% bonus
        Item storage seed = items[plot.seedId];
        uint256 baseYield = seed.baseReward * (1000 + plot.yieldBonusBP) / 1000;
        uint256 bonusYield = baseYield * 20 / 100;
        uint256 totalYield = baseYield + bonusYield;
        riceTokens[msg.sender] += totalYield;
        plot.growing = false;
        plot.harvestedAt = block.timestamp;
        plot.needsFertilizer = true;
        plot.state = PlotState.Locked;
        emit Harvested(msg.sender, plotId, totalYield);
        totalHarvests[msg.sender] += 1;
        totalXP[msg.sender] += 1; // Award 1 XP for harvesting
    }

    // 2. Golden Harvester Bundle: Harvest all ready plots, burn one per use
    function multiHarvestWithGoldenHarvester() external whenNotPaused nonReentrant {
        require(userItemBalances[msg.sender][GOLDEN_HARVESTER_BUNDLE_ID] > 0, "Need Golden Harvester (Bundle)");
        uint256 totalYield = 0;
        uint256 plotsHarvested = 0;
        for (uint256 i = 0; i < 16; i++) {
            Plot storage plot = userPlots[msg.sender][i];
            if (plot.growing && block.timestamp >= plot.readyAt) {
                Item storage seed = items[plot.seedId];
                uint256 baseYield = seed.baseReward * (1000 + plot.yieldBonusBP) / 1000;
                uint256 bonusYield = baseYield * 20 / 100;
                uint256 plotYield = baseYield + bonusYield;
                totalYield += plotYield;
                plot.growing = false;
                plot.harvestedAt = block.timestamp;
                plot.needsFertilizer = true;
                plotsHarvested++;
                totalHarvests[msg.sender] += 1;
                emit Harvested(msg.sender, i, plotYield);
            }
        }
        require(plotsHarvested > 0, "No plots ready");
        // Burn one harvester bundle
        require(userToolUses[msg.sender][GOLDEN_HARVESTER_BUNDLE_ID] > 0, "No harvester bundle uses left");
        userToolUses[msg.sender][GOLDEN_HARVESTER_BUNDLE_ID] -= 1;
        if (userToolUses[msg.sender][GOLDEN_HARVESTER_BUNDLE_ID] == 0) {
            userItemBalances[msg.sender][GOLDEN_HARVESTER_BUNDLE_ID] -= 1;
            emit ToolBurned(msg.sender, GOLDEN_HARVESTER_BUNDLE_ID);
        }
        riceTokens[msg.sender] += totalYield;
        totalXP[msg.sender] += 1; // Award 1 XP for multi-harvest
    }

    // 3. Fertilizer Spreader: Apply to plot, boost growth/yield, burn one per use
    function applyFertilizer(uint256 plotId) external whenNotPaused nonReentrant {
        require(userItemBalances[msg.sender][FERTILIZER_SPREADER_ID] > 0, "No Fertilizer");
        Plot storage plot = userPlots[msg.sender][plotId];
        require(plot.growing, "Nothing growing");
        userItemBalances[msg.sender][FERTILIZER_SPREADER_ID] -= 1;
        // Option B: Boost both growth and yield, and update readyAt
        uint256 elapsed = block.timestamp - plot.plantedAt;
        plot.growthBonusBP += 25;
        plot.yieldBonusBP += 15;
        Item storage seed = items[plot.seedId];
        uint256 newAdjustedGrowthTime = seed.baseGrowthTime * (1000 - plot.growthBonusBP) / 1000;
        if (elapsed < newAdjustedGrowthTime) {
            plot.readyAt = block.timestamp + (newAdjustedGrowthTime - elapsed);
        } else {
            plot.readyAt = block.timestamp; // Already ready!
        }
        emit ToolUsed(msg.sender, FERTILIZER_SPREADER_ID, plotId);
        totalXP[msg.sender] += 1; // Award 1 XP for applying fertilizer
    }

    // 4. Auto-Watering System: Water all growing plots if user owns the tool
    function autoWaterCrops() external whenNotPaused nonReentrant {
        require(userItemBalances[msg.sender][AUTO_WATERING_SYSTEM_ID] > 0, "No Auto-Watering System");
        require(userToolUses[msg.sender][AUTO_WATERING_SYSTEM_ID] > 0, "No auto-watering uses left");
        bool watered = false;
        for (uint256 i = 0; i < 16; i++) {
            Plot storage plot = userPlots[msg.sender][i];
            if (plot.growing) {
                // Update water level or timer here
                watered = true;
                emit ToolUsed(msg.sender, AUTO_WATERING_SYSTEM_ID, i);
            }
        }
        if (watered) {
            userItemBalances[msg.sender][AUTO_WATERING_SYSTEM_ID] -= 1;
            userToolUses[msg.sender][AUTO_WATERING_SYSTEM_ID] -= 1;
            if (userToolUses[msg.sender][AUTO_WATERING_SYSTEM_ID] == 0) {
                userItemBalances[msg.sender][AUTO_WATERING_SYSTEM_ID] -= 1;
                emit ToolBurned(msg.sender, AUTO_WATERING_SYSTEM_ID);
            }
            totalXP[msg.sender] += 1; // Award 1 XP for auto-watering
        }
    }

    function buyItemWithGameRT(uint256 itemId, uint256 amount) external whenNotPaused nonReentrant {
        Item storage item = items[itemId];
        require(item.active, "Item inactive");
        require(item.supply >= amount, "Insufficient supply");
        require(item.priceETH == 0, "Not an RT-priced item");
        uint256 priceRT = 50 * amount; // 50 RT per item (plain integer, no decimals)
        require(riceTokens[msg.sender] >= priceRT, "Not enough RT");
        riceTokens[msg.sender] -= priceRT;
        item.supply -= amount;
        userItemBalances[msg.sender][itemId] += amount;
        emit ItemPurchasedWithRT(msg.sender, itemId, amount, priceRT);
        // Award XP for buying harvester, else 1 XP
        if (itemId == HARVESTER_ID || itemId == GOLDEN_HARVESTER_SINGLE_ID || itemId == GOLDEN_HARVESTER_BUNDLE_ID) {
            totalXP[msg.sender] += 5;
        } else {
            totalXP[msg.sender] += 1;
        }
    }

    // --- Batch Plot Updater for Cron ---
    // Call this from a cron job to update all plots for a user to 'ready' if mature
    function updatePlotsForUser(address user) public {
        for (uint256 i = 0; i < 16; i++) {
            Plot storage plot = userPlots[user][i];
            if (plot.growing && block.timestamp >= plot.readyAt) {
                emit PlotReady(user, i);
            }
        }
    }

    // Call this from a cron job to auto-water all growing plots for a user
    function autoWaterPlotsForUser(address user) public {
        for (uint256 i = 0; i < 16; i++) {
            Plot storage plot = userPlots[user][i];
            if (plot.growing && block.timestamp < plot.readyAt) {
                // Simulate watering (add your logic here if you track water)
                emit PlotAutoWatered(user, i);
            }
        }
    }

    function revivePlot(uint256 plotId) external whenNotPaused nonReentrant {
        Plot storage plot = userPlots[msg.sender][plotId];
        require(plot.needsFertilizer, "Plot does not need fertilizer");
        require(block.timestamp >= plot.harvestedAt + 2 minutes, "Cooldown not over"); // TEST: 2 minutes lock
        require(userItemBalances[msg.sender][FERTILIZER_SPREADER_ID] > 0, "No fertilizer");
        userItemBalances[msg.sender][FERTILIZER_SPREADER_ID] -= 1;
        // Reset plot to empty state so it can be planted again
        plot.seedId = 0;
        plot.plantedAt = 0;
        plot.readyAt = 0;
        plot.growthBonusBP = 0;
        plot.yieldBonusBP = 0;
        plot.growing = false;
        plot.harvestedAt = 0;
        plot.needsFertilizer = false;
        plot.state = PlotState.Empty;
        totalXP[msg.sender] += 1; // Award 1 XP for reviving
    }

    // --- Claim Initial Energy (only once) ---
    function claimInitialEnergy() external whenNotPaused {
        require(!hasClaimedInitialEnergy[msg.sender], "Already claimed");
        userEnergy[msg.sender] += 10;
        hasClaimedInitialEnergy[msg.sender] = true;
    }

    // --- Buy Energy Booster (25 RT for 25 energy) ---
    function buyEnergyBooster() external whenNotPaused nonReentrant {
        uint256 boosterCost = 25; // 25 RT per booster
        uint256 energyAmount = 25; // Each booster gives 25 energy
        require(riceTokens[msg.sender] >= boosterCost, "Not enough RT");
        require(items[ENERGY_BOOSTER_ID].supply > 0, "Energy Booster sold out");
        riceTokens[msg.sender] -= boosterCost;
        userEnergy[msg.sender] += energyAmount;
        items[ENERGY_BOOSTER_ID].supply -= 1;
        // Optionally emit an event
    }

    function getEnergyBoosterSupply() external view returns (uint256) {
        return items[ENERGY_BOOSTER_ID].supply;
    }
} 
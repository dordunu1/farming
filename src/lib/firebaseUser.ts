import { db } from './firebase';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';

export interface Plot {
  id: number;
  status: 'empty' | 'growing' | 'ready' | 'watering' | 'withering' | 'needsWater';
  cropType: string;
  progress: number;
  timeRemaining?: number;
  plantedAt?: number;
  lastWatered?: number;
  waterLevel: number;
  quality: 'poor' | 'good' | 'excellent' | 'perfect';
  expectedYield: number;
  txHash?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
  txHash?: string;
}

export interface Notification {
  id: number;
  type: 'harvest' | 'achievement' | 'market' | 'warning';
  message: string;
  time: string;
  txHash?: string;
}

export interface Quest {
  id: number;
  title: string;
  progress: number;
  target: number;
  reward: number;
  completed: boolean;
  txHash?: string;
}

export interface Activity {
  icon: string;
  action: string;
  time: string;
  reward: string;
  color: string;
  txHash?: string;
}

export interface Transaction {
  id?: string; // Firestore doc id
  type: 'harvest' | 'reward' | 'quest' | 'streak' | 'purchase' | 'other';
  plotId?: number;
  questId?: number;
  amount: number;
  txHash: string;
  timestamp: any;
  [key: string]: any;
}

export interface UserData {
  walletAddress: string;
  riceTokens: number;
  energy: number;
  maxEnergy: number;
  playerLevel: number;
  totalXP: number;
  numPlanted: number;
  numWatered: number;
  numHarvested: number;
  farmLevel: number;
  totalHarvests: number;
  dailyStreak: number;
  lastLogin: any;
  achievements: Achievement[];
  notifications: Notification[];
  quests: Quest[];
  plots: Plot[];
  recentActivity: Activity[];
  pfp: string; // DiceBear avatar URL
  lastQuestReset?: number;
}

// XP thresholds for each level (index = level)
export const levelThresholds = [0, 20, 80, 120, 180, 220, 300];

// Increment action counters and XP, and level up if needed
export async function incrementUserAction(walletAddress: string, action: 'plant' | 'water' | 'harvest', xpGained: number) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const user = userSnap.data() as UserData;
  let updates: any = {};
  if (action === 'plant') updates.numPlanted = (user.numPlanted || 0) + 1;
  if (action === 'water') updates.numWatered = (user.numWatered || 0) + 1;
  if (action === 'harvest') updates.numHarvested = (user.numHarvested || 0) + 1;
  // Add XP, cap at 300
  let newXP = (user.totalXP || 0) + xpGained;
  if (newXP > 300) newXP = 300;
  updates.totalXP = newXP;
  // Level up if threshold reached, max level 7
  let newLevel = user.playerLevel || 1;
  while (newLevel < levelThresholds.length && newXP >= levelThresholds[newLevel]) {
    newLevel++;
  }
  if (newLevel > 7) newLevel = 7;
  if (newLevel > user.playerLevel) {
    updates.playerLevel = newLevel;
  }
  await setDoc(userRef, updates, { merge: true });
}

export async function createUserIfNotExists(walletAddress: string, defaultData: Partial<UserData> = {}) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      walletAddress: walletAddress,
      riceTokens: 0,
      energy: 0,
      maxEnergy: 100,
      playerLevel: 1,
      totalXP: 0,
      numPlanted: 0,
      numWatered: 0,
      numHarvested: 0,
      farmLevel: 1,
      totalHarvests: 0,
      dailyStreak: 0,
      lastLogin: new Date(),
      achievements: [],
      notifications: [],
      quests: [],
      plots: Array.from({ length: 16 }, (_, i) => ({
        id: i + 1,
        status: 'empty',
        cropType: '',
        progress: 0,
        waterLevel: 0,
        quality: 'poor',
        expectedYield: 0,
        txHash: '',
      })),
      recentActivity: [],
      pfp: `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`,
      lastQuestReset: 0,
      ...defaultData,
    });
  }
}

export async function getUserData(walletAddress: string) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() as UserData : null;
}

export async function addTransaction(walletAddress: string, tx: Transaction) {
  const txRef = collection(db, 'users', walletAddress, 'transactions');
  await addDoc(txRef, tx);
}

export async function getTransactions(walletAddress: string) {
  const txRef = collection(db, 'users', walletAddress, 'transactions');
  const q = query(txRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
}

/**
 * Increment user's energy by 1, but cap at 5 (free energy cap).
 * Only updates Firestore if energy < 5.
 */
export async function incrementFreeEnergy(walletAddress: string) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const user = userSnap.data() as UserData;
  if (user.energy < 5) {
    const newEnergy = Math.min(5, user.energy + 1);
    await setDoc(userRef, { energy: newEnergy }, { merge: true });
  }
}

/**
 * Set user's energy (for purchases, etc.), always capped at maxEnergy.
 */
export async function setUserEnergy(walletAddress: string, newEnergy: number) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const user = userSnap.data() as UserData;
  const cappedEnergy = Math.min(user.maxEnergy, newEnergy);
  await setDoc(userRef, { energy: cappedEnergy }, { merge: true });
}

export async function updateAfterPlant(walletAddress: string, plotId: number, cropType: string, yieldBonus: number, txHash: string, quality: string = 'good', expectedYield: number = 0, plantedAt?: number, readyAt?: number) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const plots = userData.plots || [];
  const numPlanted = (userData.numPlanted || 0) + 1;
  let recentActivity = userData.recentActivity || [];

  // XP logic
  let newXP = (userData.totalXP || 0) + 1;
  if (newXP > 300) newXP = 300;
  let newLevel = userData.playerLevel || 1;
  while (newLevel < levelThresholds.length && newXP >= levelThresholds[newLevel]) {
    newLevel++;
  }
  if (newLevel > 7) newLevel = 7;

  // Prevent duplicate activity for the same txHash
  if (!recentActivity.length || recentActivity[0].txHash !== txHash) {
    recentActivity = [
      {
        icon: '🌱',
        action: `Planted ${cropType}`,
        time: new Date().toISOString(),
        reward: `+${yieldBonus || expectedYield} RT`,
        color: 'green',
        txHash,
      },
      ...recentActivity,
    ].slice(0, 20); // keep only latest 20
  }

  // Update the correct plot
  const updatedPlots = plots.map((plot: any) =>
    plot.id === plotId
      ? {
          ...plot,
          status: 'needsWater',
          cropType,
          progress: 0,
          timeRemaining: (() => {
            // Set timeRemaining in minutes based on cropType
            if (cropType === 'Basic Rice Seed') return 8 * 60;
            if (cropType === 'Premium Rice Seed') return 6 * 60;
            if (cropType === 'Hybrid Rice Seed') return 4 * 60;
            return 8 * 60; // fallback
          })(),
          quality: 'poor',
          expectedYield: yieldBonus || expectedYield,
          txHash,
        }
      : plot
  );
  await setDoc(userRef, {
    plots: updatedPlots,
    numPlanted,
    totalXP: newXP,
    playerLevel: newLevel,
    recentActivity,
  }, { merge: true });
}

export async function updateAfterWater(walletAddress: string, plotId: number, txHash: string, waterIncrease: number = 40) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const plots = userData.plots || [];
  const numWatered = (userData.numWatered || 0) + 1;
  let recentActivity = userData.recentActivity || [];

  // XP logic
  let newXP = (userData.totalXP || 0) + 1;
  if (newXP > 300) newXP = 300;
  let newLevel = userData.playerLevel || 1;
  while (newLevel < levelThresholds.length && newXP >= levelThresholds[newLevel]) {
    newLevel++;
  }
  if (newLevel > 7) newLevel = 7;

  // Prevent duplicate activity for the same txHash
  if (!recentActivity.length || recentActivity[0].txHash !== txHash) {
    recentActivity = [
      {
        icon: '💧',
        action: `Watered Plot #${plotId}`,
        time: new Date().toISOString(),
        reward: '+0 RT',
        color: 'blue',
        txHash,
      },
      ...recentActivity,
    ].slice(0, 20); // keep only latest 20
  }

  // Update the correct plot
  const updatedPlots = plots.map((plot: any) => {
    if (plot.id === plotId) {
      const newWaterLevel = Math.min(100, (plot.waterLevel || 0) + waterIncrease);
      let newQuality = plot.quality;
      if (newWaterLevel > 80) newQuality = 'excellent';
      else if (newWaterLevel > 60) newQuality = 'good';
      else if (newWaterLevel > 40) newQuality = 'fair';
      else newQuality = 'poor';
      return {
        ...plot,
        waterLevel: newWaterLevel,
        lastWatered: Date.now(),
        status: newWaterLevel > 80 ? 'watering' : 'growing',
        quality: newQuality,
      };
    }
    return plot;
  });
  await setDoc(userRef, {
    plots: updatedPlots,
    numWatered,
    totalXP: newXP,
    playerLevel: newLevel,
    recentActivity,
  }, { merge: true });
}

export function onUserDataSnapshot(walletAddress: string, callback: (user: UserData | null) => void) {
  const userRef = doc(db, 'users', walletAddress);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserData);
    } else {
      callback(null);
    }
  });
}

export async function addRecentActivity(walletAddress: string, activity: Activity) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  let recentActivity = userData.recentActivity || [];
  // Prevent duplicate activity for the same txHash (if provided)
  if (!activity.txHash || !recentActivity.length || recentActivity[0].txHash !== activity.txHash) {
    recentActivity = [activity, ...recentActivity].slice(0, 20);
    await setDoc(userRef, { recentActivity }, { merge: true });
  }
}

// Add a real-time listener for recentActivity
export function onRecentActivitySnapshot(walletAddress: string, callback: (activity: Activity[]) => void) {
  const userRef = doc(db, 'users', walletAddress);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.recentActivity || []);
    }
  });
}

export async function updatePlotProgress(walletAddress: string, plotId: number, progress: number, waterLevel: number, lastWatered?: number) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  const plots = userData.plots || [];
  const updatedPlots = plots.map((plot: any) =>
    plot.id === plotId ? { ...plot, progress, waterLevel, ...(lastWatered !== undefined ? { lastWatered } : {}) } : plot
  );
  await setDoc(userRef, { plots: updatedPlots }, { merge: true });
}

export async function resetDailyQuestsIfNeeded(walletAddress: string) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  const now = Date.now();
  const lastReset = userData.lastQuestReset || 0;
  // Reset if more than 24 hours have passed
  if (now - lastReset > 24 * 60 * 60 * 1000) {
    await setDoc(userRef, {
      numPlanted: 0,
      numWatered: 0,
      numHarvested: 0,
      lastQuestReset: now,
      // Optionally reset claimed state in local Firestore if you track it
    }, { merge: true });
  }
}

/**
 * Sync all on-chain user fields to Firestore for leaderboard/analytics.
 * Call this after any on-chain action (plant, water, harvest, buy, claim, etc).
 * Pass in all the latest values you want to store.
 */
export async function syncUserOnChainToFirestore(walletAddress: string, data: Partial<UserData>) {
  if (!walletAddress) return;
  const userRef = doc(db, 'users', walletAddress);
  await setDoc(userRef, data, { merge: true });
}

/**
 * Log an activity and sync on-chain user fields to Firestore.
 * Call this after any on-chain action (plant, water, harvest, buy, claim, etc).
 * Pass in the activity object and the latest values you want to store.
 */
export async function logAndSyncUserActivity(walletAddress: string, activity: Activity, data: Partial<UserData>) {
  if (!walletAddress) return;
  // Log activity
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  let recentActivity = [];
  if (userSnap.exists()) {
    const userData = userSnap.data();
    recentActivity = userData.recentActivity || [];
    // Prevent duplicate activity for the same txHash (if provided)
    if (!activity.txHash || !recentActivity.length || recentActivity[0].txHash !== activity.txHash) {
      recentActivity = [activity, ...recentActivity].slice(0, 20);
    }
  } else {
    recentActivity = [activity];
  }
  await setDoc(userRef, { recentActivity, ...data }, { merge: true });
}

/**
 * Get a visually appealing icon for an activity type and item name.
 */
export function getActivityIcon(type: string, itemName?: string): string {
  switch (type) {
    case 'plant': return '🌱';
    case 'water': return '💧';
    case 'harvest': return '✂️';
    case 'buy':
      if (itemName?.toLowerCase().includes('golden harvester')) return '✂️';
      if (itemName?.toLowerCase().includes('seed')) return '🌾';
      if (itemName?.toLowerCase().includes('watering can')) return '🛠️';
      if (itemName?.toLowerCase().includes('bundle')) return '📦';
      if (itemName?.toLowerCase().includes('energy')) return '⚡';
      if (itemName?.toLowerCase().includes('fertilizer')) return '🧪';
      if (itemName?.toLowerCase().includes('auto-watering')) return '🤖';
      return '🛒';
    case 'quest': return '🎯';
    case 'daily': return '🎁';
    case 'upgrade': return '🏡';
    case 'achievement': return '🏆';
    case 'error': return '⚠️';
    default: return '📝';
  }
}

export async function updateAfterHarvest(walletAddress: string, plotId: number, txHash: string, yieldAmount: number) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  const plots = userData.plots || [];
  let recentActivity = userData.recentActivity || [];

  // XP logic
  let newXP = (userData.totalXP || 0) + 1;
  if (newXP > 300) newXP = 300;
  let newLevel = userData.playerLevel || 1;
  while (newLevel < levelThresholds.length && newXP >= levelThresholds[newLevel]) {
    newLevel++;
  }
  if (newLevel > 7) newLevel = 7;

  // Prevent duplicate activity for the same txHash
  if (!recentActivity.length || recentActivity[0].txHash !== txHash) {
    recentActivity = [
      {
        icon: '✂️',
        action: `Harvested Plot #${plotId}`,
        time: new Date().toISOString(),
        reward: `+${yieldAmount} RT`,
        color: 'yellow',
        txHash,
      },
      ...recentActivity,
    ].slice(0, 20);
  }

  // Update the correct plot to locked state
  const now = Math.floor(Date.now() / 1000);
  const updatedPlots = plots.map((plot: any) =>
    plot.id === plotId
      ? {
          ...plot,
          needsFertilizer: true,
          harvestedAt: now,
          state: 4, // Locked
          status: 'withering',
        }
      : plot
  );
  await setDoc(userRef, {
    plots: updatedPlots,
    totalXP: newXP,
    playerLevel: newLevel,
    recentActivity,
  }, { merge: true });
}

export async function updateAfterRevive(walletAddress: string, plotId: number, txHash?: string) {
  const userRef = doc(db, 'users', walletAddress);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  const plots = userData.plots || [];
  let recentActivity = userData.recentActivity || [];

  // Add revive activity
  if (!recentActivity.length || recentActivity[0].txHash !== txHash) {
    recentActivity = [
      {
        icon: '♻️',
        action: `Revived Plot #${plotId}`,
        time: new Date().toISOString(),
        reward: '+0 RT',
        color: 'purple',
        txHash,
      },
      ...recentActivity,
    ].slice(0, 20);
  }

  // Overwrite all fields for the revived plot
  const updatedPlots = plots.map((plot: any) =>
    plot.id === plotId
      ? {
          id: plotId,
          cropType: '',
          expectedYield: 0,
          plantedAt: 0,
          readyAt: 0,
          harvestedAt: 0,
          progress: 0,
          quality: 'poor',
          timeRemaining: 0,
          txHash: '',
          state: 0,
          status: 'empty',
          needsFertilizer: false,
          waterLevel: 0,
          lastWatered: 0
        }
      : plot
  );
  await setDoc(userRef, { plots: updatedPlots, recentActivity }, { merge: true });
} 
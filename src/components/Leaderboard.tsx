import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp, Users, Calendar, Star } from 'lucide-react';
import { db, CURRENT_CHAIN, getChainCollection } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface LeaderboardPlayer {
  rank: number;
  name: string;
  tokens: number;
  level: number;
  avatar: string | JSX.Element;
  change: string;
  walletAddress: string;
}

function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');
  const [leaderboardData, setLeaderboardData] = useState<{ weekly: LeaderboardPlayer[]; monthly: LeaderboardPlayer[]; allTime: LeaderboardPlayer[] }>({ weekly: [], monthly: [], allTime: [] });
  const [userRank, setUserRank] = useState<LeaderboardPlayer | null>(null);
  const [activeFarmers, setActiveFarmers] = useState(0);
  const [totalHarvests, setTotalHarvests] = useState(0);
  const [currentUser, setCurrentUser] = useState<LeaderboardPlayer | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      const usersSnap = await getDocs(getChainCollection('users'));
      const users = usersSnap.docs.map(doc => doc.data());
      // Sort by totalHarvests, then by riceTokens
      const sorted = [...users].sort((a, b) => {
        if ((b.totalHarvests || 0) !== (a.totalHarvests || 0)) {
          return (b.totalHarvests || 0) - (a.totalHarvests || 0);
        }
        return (b.riceTokens || 0) - (a.riceTokens || 0);
      });
      // Map to leaderboard format
      const mapped = sorted.map((u, i) => ({
        rank: i + 1,
        name: u.walletAddress?.slice(0, 8) + '...' || 'Unknown',
        tokens: Math.round(u.riceTokens || 0),
        level: u.playerLevel || 1,
        avatar: u.pfp ? <img src={u.pfp} alt="avatar" className="w-6 h-6 rounded-full inline" /> : '🌾',
        change: '0',
        walletAddress: u.walletAddress,
      }));
      setLeaderboardData({ weekly: mapped, monthly: mapped, allTime: mapped });
      setActiveFarmers(users.length);
      setTotalHarvests(users.reduce((sum, u) => sum + (u.totalHarvests || 0), 0));
      // Find current user (assume wallet in localStorage)
      const myWallet = localStorage.getItem('walletAddress');
      const myRank = mapped.find((u) => u.walletAddress?.toLowerCase() === myWallet?.toLowerCase()) || null;
      setUserRank(myRank);
      setCurrentUser(myRank);
    }
    fetchLeaderboard();
  }, []);

  const currentData = leaderboardData[activeTab];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-yellow-600';
      default:
        return 'bg-gradient-to-r from-emerald-500 to-green-600';
    }
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-emerald-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-3xl p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
            <p className="text-purple-100">Compete with farmers worldwide</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Trophy className="w-10 h-10 text-yellow-300" />
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{activeFarmers}</div>
              <div className="text-gray-600">Active Farmers</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{totalHarvests.toLocaleString()}</div>
              <div className="text-gray-600">Total Harvests</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">#{userRank?.rank || '-'}</div>
              <div className="text-gray-600">Your Rank</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Time Period Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-emerald-100"
      >
        <div className="flex space-x-2">
          {[
            { id: 'weekly', label: 'This Week', icon: Calendar },
            { id: 'monthly', label: 'This Month', icon: TrendingUp },
            { id: 'allTime', label: 'All Time', icon: Trophy }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Top 3 Podium */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-emerald-100"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Top Farmers</h3>
        <div className="flex items-end justify-center space-x-4">
          {/* 2nd Place */}
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center text-2xl mb-3">
              {currentData[1]?.avatar}
            </div>
            <div className="bg-gray-100 rounded-xl p-4 h-24 flex flex-col justify-center">
              <div className="font-bold text-gray-800">{currentData[1]?.name}</div>
              <div className="text-sm text-gray-600">{currentData[1]?.tokens.toLocaleString()} RT</div>
              <div className="text-xs text-gray-500">Level {currentData[1]?.level}</div>
            </div>
            <div className="mt-2">
              <Medal className="w-8 h-8 text-gray-400 mx-auto" />
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-lg">
              {currentData[0]?.avatar}
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 h-28 flex flex-col justify-center border-2 border-yellow-300">
              <div className="font-bold text-gray-800">{currentData[0]?.name}</div>
              <div className="text-sm text-gray-600">{currentData[0]?.tokens.toLocaleString()} RT</div>
              <div className="text-xs text-gray-500">Level {currentData[0]?.level}</div>
            </div>
            <div className="mt-2">
              <Crown className="w-10 h-10 text-yellow-500 mx-auto" />
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center text-2xl mb-3">
              {currentData[2]?.avatar}
            </div>
            <div className="bg-amber-50 rounded-xl p-4 h-24 flex flex-col justify-center">
              <div className="font-bold text-gray-800">{currentData[2]?.name}</div>
              <div className="text-sm text-gray-600">{currentData[2]?.tokens.toLocaleString()} RT</div>
              <div className="text-xs text-gray-500">Level {currentData[2]?.level}</div>
            </div>
            <div className="mt-2">
              <Medal className="w-8 h-8 text-amber-600 mx-auto" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Full Leaderboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Full Rankings</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {currentData.map((player, index) => (
            <motion.div
              key={player.walletAddress || player.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                player.name === 'You' ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(player.rank)}
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center text-xl">
                    {player.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 flex items-center space-x-2">
                      <span>{player.name}</span>
                      {player.name === 'You' && (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Level {player.level}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">{player.tokens.toLocaleString()} RT</div>
                  <div className={`text-sm font-medium ${getChangeColor(player.change)}`}>
                    {player.change !== '0' && (player.change.startsWith('+') ? '↗' : '↘')} {player.change}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default Leaderboard;
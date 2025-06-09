import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {ShoppingCart, Trophy, User, BookOpen, Bell, Box, Sprout, Globe } from 'lucide-react';
import HomeScreen from './components/HomeScreen';
import Marketplace from './components/Marketplace';
import Tutorial from './components/Tutorial';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import NotificationCenter from './components/NotificationCenter';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import type { Notification } from './components/NotificationCenter';
import Inventory from './components/Inventory';
import { useNavigate, useLocation } from 'react-router-dom';
import { createUserIfNotExists } from './lib/firebaseUser';
import GlobalFarm from './components/GlobalFarm';
import WalletModal from './components/WalletModal';
import { auth } from './lib/firebase';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

function App() {
  const [activeTab, setActiveTab] = useState('farm');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [totalXP, setTotalXP] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: 'harvest', message: 'Plot #3 is ready to harvest!', time: '2m ago' },
    { id: 2, type: 'achievement', message: 'Achievement unlocked: Rice Master!', time: '1h ago' },
    { id: 3, type: 'market', message: 'New premium seeds available in marketplace', time: '3h ago' }
  ]);

  // Use wagmi for wallet state
  const { address, isConnected } = useAccount();
  const { signMessage, data: signature, isPending, isSuccess, error, reset } = useSignMessage();
  const [isSigned, setIsSigned] = useState(false);

  // Set riceTokens to 0 for now if connected
  const riceTokens = isConnected ? 0 : 0;

  const currentLevelXP = totalXP % 1000;
  const xpProgress = (currentLevelXP / 1000) * 100;

  const navigate = useNavigate();
  const location = useLocation();

  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync activeTab with URL
  useEffect(() => {
    if (location.pathname.startsWith('/farm')) setActiveTab('farm');
    else if (location.pathname.startsWith('/marketplace')) setActiveTab('marketplace');
    else if (location.pathname.startsWith('/leaderboard')) setActiveTab('leaderboard');
    else if (location.pathname.startsWith('/inventory')) setActiveTab('inventory');
    else if (location.pathname.startsWith('/profile')) setActiveTab('profile');
  }, [location.pathname]);

  useEffect(() => {
    if (isConnected && address && firebaseAuthReady) {
      createUserIfNotExists(address);
    }
  }, [isConnected, address, firebaseAuthReady]);

  useEffect(() => {
    if (isSuccess && signature && address && !firebaseAuthReady) {
      // Authenticate with backend
      fetch(import.meta.env.VITE_AUTH_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      })
        .then(res => res.json())
        .then(async (data) => {
          if (data.token) {
            
            signInWithCustomToken(auth, data.token)
              .then((userCredential) => {
                
                createUserIfNotExists(userCredential.user.uid);
                setFirebaseAuthReady(true);
                setIsSigned(true);
                setAuthError(null);
              })
              .catch((error) => {
                console.error('Error signing in:', error, error.code, error.message);
                setAuthError(error.message);
              });
          } else {
            setAuthError(data.error || 'Auth failed');
          }
        })
        .catch((err) => {
          setAuthError('Auth error: ' + err.message);
        });
    }
  }, [isSuccess, signature, address, firebaseAuthReady]);

  useEffect(() => {
    if (!isConnected) {
      setIsSigned(false);
      reset();
    }
  }, [isConnected, reset]);

  // Listen for Firebase Auth state changes and sync with wallet connection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isConnected) {
        setIsSigned(true);
        setFirebaseAuthReady(true);
      } else {
        setIsSigned(false);
        setFirebaseAuthReady(false);
      }
    });
    return () => unsubscribe();
  }, [isConnected]);

  if (!isConnected) {
    // Enhanced connect overlay
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-100 via-emerald-50 to-yellow-100 flex flex-col items-center justify-center z-50">
        <div className="bg-white/90 rounded-3xl shadow-2xl p-10 max-w-md w-full flex flex-col items-center border-2 border-emerald-100">
          {/* Logo and App Name */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-green-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">RiceRise</h1>
              <p className="text-xs text-gray-500">Blockchain Farming</p>
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-emerald-700 mb-2 mt-2">Welcome to RiceRise</h2>
          <p className="text-gray-700 text-center mb-6">
            Grow, harvest, and trade digital crops. Compete with friends, earn rewards, and build your dream farm on the blockchain!
          </p>
          <ConnectButton />
          <p className="text-xs text-gray-500 text-center mt-4">
            By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
          </p>
          <div className="mt-8 text-sm text-gray-500 text-center">
            <strong>Why RiceRise?</strong>
            <ul className="list-disc list-inside mt-2 text-left">
              <li>🌾 Play-to-earn: Grow crops, earn tokens, and trade with others.</li>
              <li>🌱 On-chain gameplay: Your farm is truly yours, secured by blockchain.</li>
              <li>🏆 Compete globally: Climb the leaderboards and win rewards.</li>
              <li>🤝 Community-driven: New features and crops added by player votes!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!isSigned || !firebaseAuthReady) {
    // Enhanced sign-in overlay
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-100 via-emerald-50 to-yellow-100 flex flex-col items-center justify-center z-50">
        <div className="bg-white/90 rounded-3xl shadow-2xl p-10 max-w-md w-full flex flex-col items-center border-2 border-emerald-100">
          {/* Logo and App Name */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-green-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">RiceRise</h1>
              <p className="text-xs text-gray-500">Blockchain Farming</p>
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-emerald-700 mb-2 mt-2">Sign In to Continue</h2>
          <p className="text-gray-700 text-center mb-6">
            Please sign a message to prove you own your wallet. No transactions or fees required.
          </p>
          <button
            onClick={() => signMessage({ message: 'Sign in to RiceRise' })}
            disabled={isPending || (isSigned && !firebaseAuthReady)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-lg disabled:opacity-60 shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-2"
          >
            {isPending ? (
              'Waiting for signature...'
            ) : isSigned && !firebaseAuthReady ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Preparing your plots of land...
              </>
            ) : (
              'Sign In with Wallet'
            )}
          </button>
          {error && <div className="text-red-600 mt-2">{error.message}</div>}
          {authError && <div className="text-red-600 mt-2">{authError}</div>}
          <div className="mt-8 text-sm text-gray-500 text-center">
            <strong>Why RiceRise?</strong>
            <ul className="list-disc list-inside mt-2 text-left">
              <li>🌾 Play-to-earn: Grow crops, earn tokens, and trade with others.</li>
              <li>🌱 On-chain gameplay: Your farm is truly yours, secured by blockchain.</li>
              <li>🏆 Compete globally: Climb the leaderboards and win rewards.</li>
              <li>🤝 Community-driven: New features and crops added by player votes!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50">
      {/* Enhanced Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/90 backdrop-blur-md border-b border-emerald-200 px-4 py-4 shadow-lg"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-green-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
              <div className="w-5 h-5 bg-white rounded-md"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                RiceRise
              </h1>
              <p className="text-xs text-gray-500">Blockchain Farming</p>
            </div>
          </motion.div>
          
          <div className="flex items-center space-x-6">
            {/* XP Progress */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-bold text-gray-800">Level {playerLevel}</div>
                <div className="text-xs text-gray-500">{currentLevelXP}/1000 XP</div>
              </div>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </motion.button>

            {/* Tutorial Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTutorial(true)}
              className="p-2 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
            </motion.button>

            {/* RainbowKit Connect Button styled as before */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg px-1 py-1">
              <ConnectButton
                showBalance={false}
                chainStatus="icon"
                accountStatus="address"
                label="Connect Wallet"
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'farm' && (
            <motion.div
              key="farm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <HomeScreen 
                isWalletConnected={isConnected}
                riceTokens={riceTokens}
                setRiceTokens={() => {}}
                setPlayerLevel={setPlayerLevel}
                setTotalXP={setTotalXP}
              />
            </motion.div>
          )}
          {activeTab === 'marketplace' && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Marketplace isWalletConnected={isConnected} />
            </motion.div>
          )}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Leaderboard />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Profile 
                isWalletConnected={isConnected}
                walletAddress={address || ''}
              />
            </motion.div>
          )}
          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Inventory />
            </motion.div>
          )}
          {activeTab === 'globalfarm' && (
            <motion.div
              key="globalfarm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlobalFarm />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Enhanced Bottom Navigation */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-200 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around py-4">
            {[
              { id: 'farm', icon: Sprout, label: 'My Farm', route: '/farm' },
              { id: 'marketplace', icon: ShoppingCart, label: 'Marketplace', route: '/marketplace' },
              { id: 'leaderboard', icon: Trophy, label: 'Leaderboard', route: '/leaderboard' },
              { id: 'globalfarm', icon: Globe, label: 'Global Farm', route: '/globalfarm' },
              { id: 'inventory', icon: Box, label: 'Inventory', route: '/inventory' },
              { id: 'profile', icon: User, label: 'Profile', route: '/profile' }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(tab.route);
                }}
                className={`flex flex-col items-center space-y-1 px-6 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'text-emerald-600 bg-emerald-50 shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.nav>

      <Tutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        setNotifications={setNotifications}
      />
    </div>
  );
}

export default App;
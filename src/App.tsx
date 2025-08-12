import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {ShoppingCart, Trophy, User, BookOpen, Bell, Box, Sprout, Globe, AlertTriangle, X } from 'lucide-react';
import HomeScreen from './components/HomeScreen';
import Marketplace from './components/Marketplace';
import Tutorial from './components/Tutorial';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import NotificationCenter from './components/NotificationCenter';
import { useAccount, useSignMessage } from 'wagmi';
import type { Notification } from './components/NotificationCenter';
import Inventory from './components/Inventory';
import { useNavigate, useLocation } from 'react-router-dom';
import { createUserIfNotExists, decreaseWaterLevels } from './lib/firebaseUser';
import GlobalFarm from './components/GlobalFarm';
import WalletModal from './components/WalletModal';
import { auth } from './lib/firebase';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { walletService } from './services/walletService';
import { useWallet } from './hooks/useWallet';
import { setDoc } from 'firebase/firestore';
import { getUserDoc } from './lib/firebase';
import { ethers } from 'ethers';
import { shredsService } from './services/shredsService';

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

  const currentLevelXP = totalXP % 300;
  const xpProgress = (currentLevelXP / 300) * 100;

  const navigate = useNavigate();
  const location = useLocation();

  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [showNavOnboarding, setShowNavOnboarding] = useState(false);
  const [navOnboardingStep, setNavOnboardingStep] = useState(0);
  const navButtonRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const [showWalletFundingToast, setShowWalletFundingToast] = useState(false);
  const [hasShownWalletToast, setHasShownWalletToast] = useState(() => {
    // Check if user has already seen the wallet funding toast
    return localStorage.getItem('hasShownWalletFundingToast') === 'true';
  });
  const [shredsStatus, setShredsStatus] = useState<any>(null);
  const [useReown, setUseReown] = useState(false);
  const [showSomniaEnergyWarning, setShowSomniaEnergyWarning] = useState(false);

  // Onboarding steps for nav bar
  const navSteps = [
    { key: 'farm', label: 'My Farm', description: 'Manage your personal farm, plant crops, and harvest rewards.' },
    { key: 'globalfarm', label: 'Global Farm', description: 'See the global farm and interact with the community.' },
    { key: 'marketplace', label: 'Marketplace', description: 'Buy farming equipment and seeds.' },
    { key: 'inventory', label: 'Inventory', description: 'View and manage your collected items.' },
    { key: 'leaderboard', label: 'Leaderboard', description: 'See the top players and your ranking.' },
    { key: 'profile', label: 'Profile', description: 'Manage your account and settings.' },
  ];

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

  const { initGameWallet, wallet: gameWallet } = useWallet();
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);

  // Persistent wallet funding warning state
  const [walletUnfunded, setWalletUnfunded] = useState(false);

  // Check wallet balance every 10 seconds if unfunded
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const checkWalletBalance = async () => {
      if (gameWallet && isConnected) {
        try {
          const rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL || import.meta.env.VITE_RPC_URL;
          const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          const balance = await provider.getBalance(gameWallet.address);
          const balanceEth = ethers.utils.formatEther(balance);
          setWalletUnfunded(parseFloat(balanceEth) < 0.001);
        } catch (error) {
          setWalletUnfunded(true); // If error, be safe and show warning
        }
      } else {
        setWalletUnfunded(false);
      }
    };
    checkWalletBalance();
    if (gameWallet && isConnected) {
      interval = setInterval(checkWalletBalance, 10000); // 10 seconds
    }
    return () => { if (interval) clearInterval(interval); };
  }, [gameWallet, isConnected]);

  useEffect(() => {
    if (isSuccess && signature && address && !firebaseAuthReady) {
      setIsGeneratingWallet(true); // Set immediately after signature is received
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
              .then(async (userCredential) => {
                await createUserIfNotExists(userCredential.user.uid);
                setFirebaseAuthReady(true);
                setIsSigned(true);
                setAuthError(null);

                // Generate in-game wallet using the same signature
                try {
                  // setIsGeneratingWallet(true); // Already set above
                  // Store the signature first for future wallet regeneration
                  await walletService.storeSignature(userCredential.user.uid, signature);
                  const gameWallet = await initGameWallet(signature);
                  // Store the game wallet info
                  if (gameWallet && gameWallet.address) {
                    await walletService.storeWalletInfo(userCredential.user.uid, gameWallet);
                    // Always update Firestore with the in-game wallet address
                    await setDoc(getUserDoc(userCredential.user.uid), {
                      inGameWalletAddress: gameWallet.address
                    }, { merge: true });
                  } else {
                    setAuthError('Failed to generate game wallet');
                  }
                } catch (error) {
                  setAuthError('Failed to generate game wallet');
                } finally {
                  setIsGeneratingWallet(false);
                }
              })
              .catch((error) => {
                setAuthError(error.message);
                setIsGeneratingWallet(false);
              });
          } else {
            setAuthError(data.error || 'Auth failed');
            setIsGeneratingWallet(false);
          }
        })
        .catch((err) => {
          setAuthError('Auth error: ' + err.message);
          setIsGeneratingWallet(false);
        });
    }
  }, [isSuccess, signature, address, firebaseAuthReady, initGameWallet]);

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

  useEffect(() => {
    if (!localStorage.getItem('navOnboardingComplete')) {
      setShowNavOnboarding(true);
    }
  }, []);

  const handleNavOnboardingNext = () => {
    if (navOnboardingStep < navSteps.length - 1) {
      setNavOnboardingStep(navOnboardingStep + 1);
    } else {
      localStorage.setItem('navOnboardingComplete', 'true');
      setShowNavOnboarding(false);
    }
  };
  const handleNavOnboardingSkip = () => {
    localStorage.setItem('navOnboardingComplete', 'true');
    setShowNavOnboarding(false);
  };

  // Add water level decrease interval
  useEffect(() => {
    if (address && isSigned && firebaseAuthReady) {
      // Initial call
      decreaseWaterLevels(address);
      
      // Set up interval for every 2 minutes
      const interval = setInterval(() => {
        decreaseWaterLevels(address);
      }, 2 * 60 * 1000); // 2 minutes in milliseconds
      
      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }
  }, [address, isSigned, firebaseAuthReady]);

  useEffect(() => {
    if (gameWallet && gameWallet.address && address) {
      setDoc(getUserDoc(address), {
        inGameWalletAddress: gameWallet.address
      }, { merge: true });
    }
  }, [gameWallet, address]);

  // Show wallet funding toast when user has in-game wallet
  useEffect(() => {
    if (gameWallet && isConnected && !hasShownWalletToast) {
      // Check if wallet has any balance
      const checkWalletBalance = async () => {
        try {
          const rpcUrl = import.meta.env.VITE_RISE_RPC_URL || import.meta.env.RISE_RPC_URL || import.meta.env.VITE_RPC_URL;
          const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          const balance = await provider.getBalance(gameWallet.address);
          const balanceEth = ethers.utils.formatEther(balance);
          
          // Show toast if wallet has very low balance (less than 0.001 ETH)
          if (parseFloat(balanceEth) < 0.001) {
            setShowWalletFundingToast(true);
            setHasShownWalletToast(true);
            localStorage.setItem('hasShownWalletFundingToast', 'true');
          }
        } catch (error) {
          console.log('Could not check wallet balance:', error);
        }
      };
      
      // Delay the toast to let the UI settle
      const timer = setTimeout(() => {
        checkWalletBalance();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [gameWallet, isConnected, hasShownWalletToast]);

  // Hide wallet funding toast after 5 seconds
  useEffect(() => {
    if (showWalletFundingToast) {
      const timer = setTimeout(() => {
        setShowWalletFundingToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showWalletFundingToast]);

  // Initialize Shreds status
  useEffect(() => {
    const checkShredsStatus = () => {
      const status = shredsService.getStatus();
      setShredsStatus(status);
    };
    
    // Check immediately
    checkShredsStatus();
    
    // Check again after a delay to allow for initialization
    const timer = setTimeout(checkShredsStatus, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Check if user is on Somnia chain and show energy warning
  useEffect(() => {
    const isSomnia = import.meta.env.VITE_CURRENT_CHAIN === 'SOMNIA';
    if (isSomnia) {
      // Show warning on every page refresh for Somnia users
      setShowSomniaEnergyWarning(true);
    }
  }, []);

  const [showDevNote, setShowDevNote] = useState(true);

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
          <h2 className="text-xl font-extrabold text-emerald-700 mb-2 mt-2">Welcome to Rice Farming</h2>
          <p className="text-gray-700 text-center mb-6">
            Grow, harvest, and trade digital crops. Compete with friends, earn rewards, and build your dream farm on the blockchain!
          </p>
          <button
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
            onClick={() => window.AppKit && window.AppKit.open && window.AppKit.open()}
          >
            Connect Wallet
          </button>
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
            disabled={isPending || (isSigned && !firebaseAuthReady) || isGeneratingWallet}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-lg disabled:opacity-60 shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Waiting for signature...
              </>
            ) : isGeneratingWallet ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              'Sign In with Wallet'
            )}
          </button>
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

  return (
    <>
      {showDevNote && (
        <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-center py-2 px-4 flex items-center justify-center gap-2 z-50">
          <span className="font-semibold">⚠️ RiceRise is in active development.</span>
          <span>Please rate and review as an early-access app. Bugs and issues will be fixed soon!</span>
          <button onClick={() => setShowDevNote(false)} className="ml-4 text-yellow-700 hover:text-yellow-900 font-bold">✕</button>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50">
        {/* Persistent Wallet Funding Warning */}
        {walletUnfunded && (
          <div className="w-full bg-yellow-200 border-b-2 border-yellow-400 text-yellow-900 text-center py-3 font-semibold text-sm z-50 fixed top-0 left-0 right-0 shadow-lg animate-fade-in">
            ⚠️ Your in-game wallet has insufficient funds. Please fund your wallet to enable transactions.<br />
            <span className="font-normal text-yellow-900">You can find your in-game wallet address under the <b>Profile</b> tab.</span>
          </div>
        )}
        {/* Enhanced Header */}
        <motion.header 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-white/95 backdrop-blur-md border-b border-emerald-200 shadow-lg sticky top-0 z-40"
          style={{ marginTop: walletUnfunded ? '48px' : '0' }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">Blockchain Farming</p>
                  {/* Shreds Status Indicator */}
                  {shredsStatus?.isRise && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-full">
                      <span className="animate-pulse">⚡</span>
                      <span>Shreds</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-6">
              {/* XP Progress */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-800">Level {playerLevel}</div>
                  <div className="text-xs text-gray-500">{currentLevelXP}/300 XP</div>
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
                whileHover={{ scale: 1.0 }}
                whileTap={{ scale: 1.0 }}
                disabled
                className="relative p-2 text-gray-400 cursor-not-allowed opacity-50"
                title="Notifications are disabled in development"
              >
                <Bell className="w-5 h-5" />
              </motion.button>

              {/* Tutorial Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTutorial(true)}
                className="flex items-center space-x-1 p-2 text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-xs">Guide</span>
              </motion.button>
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

        {/* Somnia Energy Warning Toast - Shows on every refresh for Somnia users */}
        {showSomniaEnergyWarning && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
          >
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 mb-2">⚠️ Energy Management Warning</h3>
                  <p className="text-amber-700 text-sm mb-3">
                    <strong>IMPORTANT:</strong> Do not use all your energy planting seeds! If you run out of energy, you will be <strong>LOCKED OUT</strong> and unable to harvest your crops.
                  </p>
                  <p className="text-amber-700 text-sm mb-3">
                    <strong>Strategy:</strong> Plant a few seeds, save energy for harvesting, and read the complete game guide to understand the energy system.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-800 text-sm font-medium">
                      📖 Read the guide
                    </span>
                    <button 
                      onClick={() => setShowSomniaEnergyWarning(false)}
                      className="text-amber-600 hover:text-amber-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
                { id: 'globalfarm', icon: Globe, label: 'Global Farm', route: '/globalfarm' },
                { id: 'marketplace', icon: ShoppingCart, label: 'Marketplace', route: '/marketplace' },
                { id: 'inventory', icon: Box, label: 'Inventory', route: '/inventory' },
                { id: 'leaderboard', icon: Trophy, label: 'Leaderboard', route: '/leaderboard' },
                { id: 'profile', icon: User, label: 'Profile', route: '/profile' }
              ].map((tab, idx) => (
                <motion.button
                  key={tab.id}
                  ref={navButtonRefs[idx]}
                  data-nav={tab.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    navigate(tab.route);
                    // Hide wallet funding toast when user clicks on profile
                    if (tab.id === 'profile') {
                      setShowWalletFundingToast(false);
                    }
                  }}
                  className={`flex flex-col items-center space-y-1 px-6 py-2 rounded-xl transition-all duration-200 relative ${
                    activeTab === tab.id 
                      ? 'text-emerald-600 bg-emerald-50 shadow-lg' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  } ${showNavOnboarding && navOnboardingStep === idx ? 'ring-4 ring-emerald-300 z-50' : ''}`}
                >
                  <tab.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"
                    />
                  )}
                  {/* Wallet Funding Toast - Show near Profile icon */}
                  {showWalletFundingToast && tab.id === 'profile' && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-blue-100 border border-blue-300 text-blue-900 px-4 py-2 rounded-xl shadow-lg z-50 font-medium text-sm whitespace-nowrap animate-fade-in">
                      💰 Fund your in-game wallet for transactions!
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-300"></div>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.nav>

        {/* Nav Onboarding Overlay */}
        {showNavOnboarding && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={handleNavOnboardingSkip}></div>
            <div className="relative mb-32 max-w-xs w-full pointer-events-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center animate-fadeIn">
                <h3 className="text-lg font-bold mb-2 text-emerald-700">{navSteps[navOnboardingStep].label}</h3>
                <p className="text-gray-600 mb-4 text-center">{navSteps[navOnboardingStep].description}</p>
                <div className="flex gap-2 w-full">
                  <button onClick={handleNavOnboardingSkip} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition">Skip</button>
                  <button onClick={handleNavOnboardingNext} className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition">{navOnboardingStep === navSteps.length - 1 ? 'Finish' : 'Next'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

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
    </>
  );
}

export default App;
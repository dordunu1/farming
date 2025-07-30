import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Wallet, Plus, Droplets, Scissors, Star, Zap } from 'lucide-react';

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

function Tutorial({ isOpen, onClose }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tutorialSteps = [
    {
      title: "Welcome to RiceRise!",
      description: "Learn how to become a master rice farmer on the blockchain",
      icon: <Star className="w-12 h-12 text-yellow-500" />,
      content: (
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mx-auto flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-lg"></div>
          </div>
          <p className="text-gray-600">
            RiceRise is a blockchain-based farming game where you can plant, grow, and harvest rice to earn real tokens!
          </p>
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-emerald-700 font-medium">🌾 Grow rice, earn tokens, level up!</p>
          </div>
        </div>
      )
    },
    {
      title: "Connect Your Wallet",
      description: "First, you'll need to connect your crypto wallet",
      icon: <Wallet className="w-12 h-12 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-6 text-center">
            <Wallet className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-800 mb-2">Why Connect a Wallet?</h4>
            <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
              <li>• Secure your rice tokens on-chain</li>
              <li>• Trade with other players</li>
              <li>• Participate in governance</li>
              <li>• Unlock premium features</li>
            </ul>
            <div className="mt-6 bg-emerald-50 rounded-lg p-4 text-emerald-700 text-sm text-left max-w-md mx-auto">
              <b>How it works:</b><br />
              When you connect and sign a message for the first time, RiceRise will securely generate a special in-game wallet just for you. This wallet is used for all your in-game actions and is created safely from your signature—no need to remember a new password or key!<br /><br />
              <span className="text-emerald-600">You stay in control, and your in-game wallet is always ready whenever you log in.</span>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-yellow-700 text-sm">
              💡 <strong>Tip:</strong> We support MetaMask and WalletConnect for easy connection!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Understanding Your Farm",
      description: "Your farm has 16 plots arranged in a 4x4 grid",
      icon: <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center"><div className="w-6 h-6 bg-white rounded-sm"></div></div>,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="aspect-square bg-emerald-100 rounded-lg border-2 border-emerald-300 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-600">{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Plot States:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded border-dashed border-2"></div>
                <span>Empty</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-400 rounded"></div>
                <span>Growing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <span>Watered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>Ready</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Planting Seeds",
      description: "Start your farming journey by planting rice seeds",
      icon: <Plus className="w-12 h-12 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-xl p-6">
            <Plus className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-800 mb-3 text-center">How to Plant</h4>
            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. Click on an empty plot (dashed border)</li>
              <li>2. Choose your seed type</li>
              <li>3. Confirm the transaction</li>
              <li>4. Wait for blockchain confirmation</li>
            </ol>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
              <div className="w-6 h-6 bg-green-400 rounded-full mx-auto mb-2"></div>
              <div className="text-xs font-medium">Basic Rice</div>
              <div className="text-xs text-gray-500">60 min growth</div>
              <div className="text-xs text-emerald-700">15 RT (Single)</div>
              <div className="text-xs text-yellow-700">21 RT (Bundle, 4.8h)</div>
              <div className="text-xs text-blue-500 mt-1">Min. Energy: 5</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
              <div className="w-6 h-6 bg-yellow-400 rounded-full mx-auto mb-2"></div>
              <div className="text-xs font-medium">Premium Rice</div>
              <div className="text-xs text-gray-500">40 min growth</div>
              <div className="text-xs text-emerald-700">50 RT (Single)</div>
              <div className="text-xs text-yellow-700">60 RT (Bundle, 4.8h)</div>
              <div className="text-xs text-blue-500 mt-1">Min. Energy: 10</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
              <div className="w-6 h-6 bg-purple-400 rounded-full mx-auto mb-2"></div>
              <div className="text-xs font-medium">Hybrid Rice</div>
              <div className="text-xs text-gray-500">20 min growth</div>
              <div className="text-xs text-emerald-700">70 RT (Single)</div>
              <div className="text-xs text-yellow-700">84 RT (Bundle, 3.14h)</div>
              <div className="text-xs text-blue-500 mt-1">Min. Energy: 20</div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 text-center mt-2">
            You must have at least the minimum energy shown above to plant each seed, but only <b>1 energy</b> will actually be deducted per planting.
          </div>
        </div>
      )
    },
    {
      title: "Watering Your Crops",
      description: "Keep your rice healthy with regular watering",
      icon: <Droplets className="w-12 h-12 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-6">
            <Droplets className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-800 mb-3 text-center">Watering System</h4>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Water Level:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div className="w-3/4 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <span className="text-xs">75%</span>
                </div>
              </div>
              <p>• Water decreases 2% per hour</p>
              <p>• Low water = slower growth</p>
              <p>• High water = better quality</p>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-yellow-700 text-sm">
              💧 <strong>Pro Tip:</strong> Water when levels drop below 40% for optimal growth!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Harvesting & Rewards",
      description: "Collect your rice and earn tokens when crops are ready",
      icon: <Scissors className="w-12 h-12 text-yellow-500" />,
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 rounded-xl p-6">
            <Scissors className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-800 mb-3 text-center">Harvest Rewards</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Basic Rice (Single):</span>
                <span className="font-bold text-emerald-600">15 RT</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Basic Rice (Bundle):</span>
                <span className="font-bold text-yellow-700">21 RT</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Premium Rice (Single):</span>
                <span className="font-bold text-emerald-600">50 RT</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Premium Rice (Bundle):</span>
                <span className="font-bold text-yellow-700">60 RT</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hybrid Rice (Single):</span>
                <span className="font-bold text-emerald-600">70 RT</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hybrid Rice (Bundle):</span>
                <span className="font-bold text-yellow-700">84 RT</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="w-8 h-8 bg-red-100 rounded-lg mx-auto mb-1 flex items-center justify-center">
                <span className="text-red-600 font-bold">Poor</span>
              </div>
              <span className="text-red-600">50% yield</span>
            </div>
            <div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-1 flex items-center justify-center">
                <span className="text-blue-600 font-bold">Good</span>
              </div>
              <span className="text-blue-600">75% yield</span>
            </div>
            <div>
              <div className="w-8 h-8 bg-emerald-100 rounded-lg mx-auto mb-1 flex items-center justify-center">
                <span className="text-emerald-600 font-bold">Exc.</span>
              </div>
              <span className="text-emerald-600">100% yield</span>
            </div>
            <div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-1 flex items-center justify-center">
                <span className="text-purple-600 font-bold">Perf.</span>
              </div>
              <span className="text-purple-600">125% yield</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Energy & Strategy",
      description: "Manage your energy wisely for maximum efficiency",
      icon: <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center"><Droplets className="w-6 h-6 text-white" /></div>,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-800 mb-3">Energy Costs</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span>Planting</span>
                </span>
                <span className="font-bold">1 Energy <span className="text-xs text-gray-500">(Min. 5/10/20 to plant)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span>Watering</span>
                </span>
                <span className="font-bold">1 Energy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Scissors className="w-4 h-4 text-yellow-500" />
                  <span>Harvesting</span>
                </span>
                <span className="font-bold">1 Energy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  <span>Reviving</span>
                </span>
                <span className="font-bold">1 Energy</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700 text-center">
            You only spend 1 energy per action, but planting requires you to have a minimum energy depending on the seed type (5 for Basic, 10 for Premium, 20 for Hybrid).
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-blue-700 text-sm">
              ⚡ <strong>Energy Tips:</strong> Energy regenerates 1 point per minute. Plan your actions carefully!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Farm!",
      description: "You're all set to start your rice farming journey",
      icon: <Star className="w-12 h-12 text-emerald-500" />,
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mx-auto flex items-center justify-center">
            <Star className="w-12 h-12 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">Congratulations!</h4>
            <p className="text-gray-600">
              You now know the basics of RiceRise farming. Start planting, growing, and earning!
            </p>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6">
            <h5 className="font-semibold text-gray-800 mb-3">Quick Reminders:</h5>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• Connect your wallet first</li>
              <li>• Water regularly for best quality</li>
              <li>• Higher quality = more tokens</li>
              <li>• Complete daily quests for bonuses</li>
              <li>• Check the marketplace for upgrades</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <motion.div
              key={currentStep}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center"
            >
              {currentTutorial.icon}
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{currentTutorial.title}</h2>
              <p className="text-gray-600">{currentTutorial.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {tutorialSteps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            {currentTutorial.content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex space-x-2">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep === tutorialSteps.length - 1 ? (
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-700 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Start Farming!</span>
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-700 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Tutorial;
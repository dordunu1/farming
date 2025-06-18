import { X } from 'lucide-react';
import React, { useState } from 'react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function WalletModal({ isOpen, onClose }: WalletModalProps) {
  if (!isOpen) return null;

  // Handler to open Reown modal
  const handleReownConnect = () => {
    if (window.AppKit && typeof window.AppKit.open === 'function') {
      window.AppKit.open();
    } else {
      alert('Reown AppKit modal is not available.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 text-center">
          <button
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
            onClick={handleReownConnect}
          >
            Connect with Reown (Wallets & Social)
          </button>
          <p className="text-xs text-gray-500 text-center mt-4">
            By connecting your wallet, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WalletModal;

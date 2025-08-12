import React from 'react';
import { Wrench, AlertTriangle, Code } from 'lucide-react';

interface MaintenanceModeProps {
  isMaintenanceMode: boolean;
}

export default function MaintenanceMode({ isMaintenanceMode }: MaintenanceModeProps) {
  if (!isMaintenanceMode) return null;

  const maintenanceTitle = import.meta.env.VITE_MAINTENANCE_TITLE || 'Maintenance in Progress';
  const maintenanceMessage = import.meta.env.VITE_MAINTENANCE_MESSAGE || 'We are currently fixing API issues and network connectivity. Please check back later.';

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center border border-emerald-200/30 shadow-2xl">
        {/* Maintenance Icon */}
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-400/40">
          <Wrench className="w-12 h-12 text-emerald-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
          {maintenanceTitle}
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-200 mb-6 leading-relaxed">
          {maintenanceMessage}
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full border border-emerald-400/40 mb-6">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Network Maintenance</span>
        </div>

        {/* What We're Fixing */}
        <div className="bg-emerald-500/10 rounded-2xl p-4 mb-6 border border-emerald-400/30">
          <div className="flex items-center justify-center gap-2 text-emerald-300 mb-2">
            <Code className="w-5 h-5" />
            <span className="font-semibold">Currently Fixing</span>
          </div>
          <div className="text-white text-sm space-y-1">
            <p>• API connectivity issues</p>
            <p>• Network performance</p>
            <p>• System stability</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-sm text-emerald-200">
          <p>We're working hard to resolve these issues and bring you back online.</p>
          <p className="mt-2">Thank you for your patience!</p>
        </div>
      </div>
    </div>
  );
}

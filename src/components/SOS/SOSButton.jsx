import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SOSButton({ onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-32 h-32 rounded-full transition-all transform hover:scale-105 active:scale-95 ${
        active
          ? 'bg-red-600 animate-pulse'
          : 'bg-red-500 hover:bg-red-600'
      } disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <AlertTriangle className="w-16 h-16 text-white" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-lg">SOS</span>
      </div>
      {active && (
        <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75" />
      )}
    </button>
  );
}


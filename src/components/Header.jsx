import React from 'react';
import { Navigation } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">StormWatch</h1>
              <p className="text-sm text-slate-400">Giám sát bão lũ cộng đồng</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
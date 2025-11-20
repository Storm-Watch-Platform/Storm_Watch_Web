import React from 'react';
import { MapPin, AlertTriangle, Eye } from 'lucide-react';

export default function Sidebar({ selectedTab, setSelectedTab, reportCount }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedTab('map')}
            className={`px-6 py-3 font-medium transition-all ${
              selectedTab === 'map'
                ? 'bg-blue-500 text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Bản đồ
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('reports')}
            className={`px-6 py-3 font-medium transition-all ${
              selectedTab === 'reports'
                ? 'bg-blue-500 text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Báo cáo ({reportCount})
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('zones')}
            className={`px-6 py-3 font-medium transition-all ${
              selectedTab === 'zones'
                ? 'bg-blue-500 text-white border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Vùng nguy hiểm
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, Loader } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import MapView from './components/MapView';
import ReportCard from './components/ReportCard';
import { mockDangerZones, mockReports } from './data/mockReports';
function App() {
  const [selectedTab, setSelectedTab] = useState('map');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    // Load Google Maps
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setMapLoaded(true);
        setMapError(null);
      };
      
      script.onerror = () => {
        setMapError('Failed to load Google Maps. Please check your API key and internet connection.');
        setMapLoaded(false);
      };
      
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
      setMapError(null);
    }
  }, []);

  const filteredReports = filterSeverity === 'all' 
    ? mockReports 
    : mockReports.filter(r => r.severity === filterSeverity);

  const handleReportClick = (report) => {
    setSelectedReport(report);
    setSelectedTab('reports');
  };

  const handleViewOnMap = (report) => {
    setSelectedReport(report);
    setSelectedTab('map');
  };

  const getRiskColor = (level) => {
    return level === 'high' ? 'bg-red-500' : 
           level === 'medium' ? 'bg-orange-500' : 'bg-yellow-500';
  };

  const getRiskTextColor = (level) => {
    return level === 'high' ? 'text-red-600' : 
           level === 'medium' ? 'text-orange-600' : 'text-yellow-600';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'Vừa xong';
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      
      <Sidebar 
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        reportCount={mockReports.length}
      />

      <main className="container mx-auto px-4 py-6">
        {/* Error Alert */}
        {mapError && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-200">{mapError}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {selectedTab === 'map' && !mapLoaded && !mapError && (
          <div className="mb-6 p-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 flex items-center justify-center gap-3 h-[600px]">
            <Loader className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-slate-300">Đang tải bản đồ...</p>
          </div>
        )}

        {/* Map Tab */}
        {selectedTab === 'map' && mapLoaded && !mapError && (
          <MapView
            dangerZones={mockDangerZones}
            reports={mockReports}
            onReportClick={handleReportClick}
            mapLoaded={mapLoaded}
          />
        )}

        {selectedTab === 'reports' && (
          <div>
            <FilterBar 
              filterSeverity={filterSeverity}
              setFilterSeverity={setFilterSeverity}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredReports.map(report => (
                <ReportCard
                  key={report.id}
                  report={report}
                  selectedReport={selectedReport}
                  onViewOnMap={handleViewOnMap}
                />
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'zones' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockDangerZones.map(zone => (
              <div
                key={zone.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{zone.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${getRiskColor(zone.riskLevel)}`}></div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Mức độ rủi ro:</span>
                    <span className={`font-bold ${getRiskTextColor(zone.riskLevel)}`}>
                      {zone.riskLevel.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-bold text-white">{zone.score}/10</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Số báo cáo:</span>
                    <span className="font-bold text-blue-400">{zone.reportCount}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      Cập nhật: {formatTime(zone.lastUpdated)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-slate-900/80 backdrop-blur-md border-t border-slate-700 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-slate-400 text-sm">
            <p>© 2025 StormWatch Project | Dự án giám sát bão lũ cộng đồng</p>
            <p className="mt-2">Dữ liệu được cập nhật thời gian thực từ cộng đồng</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import Header from './components/Header';
import MapView from './components/MapView';
import ReportsPanel from './components/ReportsPanel';
import SearchLocation from './components/SearchLocation';
import ReportModal from './components/ReportModal';
import { queryZoneByCoordinates } from './services/api';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const DEFAULT_LOCATION = {
  lat: 16.4637,
  lng: 107.5909,
  address: 'Thành phố Huế, Việt Nam',
};

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function App() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [zoneInfo, setZoneInfo] = useState(null);
  const [centerLocation, setCenterLocation] = useState(DEFAULT_LOCATION);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [highlightedReport, setHighlightedReport] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setMapLoaded(true);
        setMapError(null);
      };

      script.onerror = () => {
        setMapError('Không thể tải Google Maps. Vui lòng kiểm tra API key và kết nối mạng.');
        setMapLoaded(false);
      };

      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
      setMapError(null);
    }
  }, []);

  const applyReportFilters = (rawReports = [], center = DEFAULT_LOCATION) => {
    const now = Date.now();
    return rawReports
      .filter((report) => now - new Date(report.timestamp).getTime() <= THREE_DAYS_MS)
      .filter((report) => {
        if (!report.location) return false;
        const km = calculateDistanceKm(
          center.lat,
          center.lng,
          report.location.lat,
          report.location.lng,
        );
        return km <= 5;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const handleLocationSelect = async (location) => {
    if (!location) return;
    setIsSearching(true);
    setSelectedReport(null);
    setHighlightedReport(null);

    try {
      const response = await queryZoneByCoordinates(location);
      const center = response.zone?.center || { lat: location.lat, lng: location.lng };

      setZoneInfo(response.zone || null);
      setCenterLocation({
        lat: center.lat,
        lng: center.lng,
        address: location.address || response.zone?.address || DEFAULT_LOCATION.address,
      });

      const processed = applyReportFilters(response.reports || [], center);
      setReports(processed);
    } catch (error) {
      console.error('Error fetching zone data:', error);
      setMapError('Không thể truy vấn dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (mapLoaded && !bootstrapped) {
      handleLocationSelect(DEFAULT_LOCATION);
      setBootstrapped(true);
    }
  }, [mapLoaded, bootstrapped]);

  const zoneSummary = useMemo(() => {
    if (!zoneInfo) return null;
    return {
      riskLevel: zoneInfo.riskLevel || 'unknown',
      score: zoneInfo.score || 0,
      reportCount: reports.length,
      updatedAt: zoneInfo.lastUpdated,
    };
  }, [zoneInfo, reports.length]);

  const handleFocusReport = (report) => {
    setHighlightedReport(report);
  };

  const handleMarkerClick = (report) => {
    setSelectedReport(report);
    setHighlightedReport(report);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {mapError && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-200">{mapError}</p>
          </div>
        )}

        <SearchLocation onLocationSelect={handleLocationSelect} isDisabled={!mapLoaded || isSearching} />

        {zoneSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Mức độ rủi ro</p>
              <p
                className={`text-2xl font-bold ${
                  zoneSummary.riskLevel === 'high'
                    ? 'text-red-400'
                    : zoneSummary.riskLevel === 'medium'
                      ? 'text-orange-400'
                      : 'text-yellow-400'
                }`}
              >
                {zoneSummary.riskLevel.toUpperCase()}
              </p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Risk Score</p>
              <p className="text-2xl font-bold text-white">{zoneSummary.score}/10</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Báo cáo trong vùng</p>
              <p className="text-2xl font-bold text-blue-400">{zoneSummary.reportCount}</p>
            </div>
          </div>
        )}

        {!mapLoaded && !mapError && (
          <div className="p-8 bg-slate-800/60 rounded-2xl border border-slate-700 flex items-center justify-center gap-3 h-[600px]">
            <Loader className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-slate-300">Đang tải bản đồ...</p>
          </div>
        )}

        {mapLoaded && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-4 h-[700px]">
              <ReportsPanel
                reports={reports}
                onFocusReport={handleFocusReport}
                onOpenReport={(report) => setSelectedReport(report)}
                selectedReport={highlightedReport}
                centerAddress={centerLocation?.address}
              />
            </div>
            <div className="lg:col-span-8">
              <MapView
                mapLoaded={mapLoaded}
                centerLocation={centerLocation}
                reports={reports}
                onMarkerClick={handleMarkerClick}
                highlightedReport={highlightedReport}
              />
            </div>
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
      <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  );
}

export default App;
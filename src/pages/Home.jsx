import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import Header from '../components/Layout/Header';
import MapView from '../components/Map/MapView';
import ReportsPanel from '../components/Reports/ReportsPanel';
import SearchLocation from '../components/Location/SearchLocation';
import ReportModal from '../components/Reports/ReportModal';
import WeatherWidget from '../components/Weather/WeatherWidget';
import { queryZoneByCoordinates } from '../services/api';
import { getWeatherByCoordinates } from '../services/weatherService';
import { REGION_PRESETS } from '../data/regionMockData';
import { calculateDistanceKm } from '../utils/distance';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const DEFAULT_LOCATION = {
  lat: 16.4637,
  lng: 107.5909,
  address: 'Thành phố Huế, Việt Nam',
};

function Home() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [zoneInfo, setZoneInfo] = useState(null);
  const [centerLocation, setCenterLocation] = useState(DEFAULT_LOCATION);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [highlightedReport, setHighlightedReport] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const userSelectedRef = useRef(false);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
    }
  }, []);

  const applyReportFilters = useCallback((rawReports = [], center = DEFAULT_LOCATION) => {
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
  }, []);

  const handleLocationSelect = useCallback(async (location, { fromUser = false } = {}) => {
    if (fromUser) {
      userSelectedRef.current = true;
    }
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

      // Fetch weather data for the location
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const weather = await getWeatherByCoordinates(center);
        setWeatherData(weather);
      } catch (weatherErr) {
        console.error('Error fetching weather:', weatherErr);
        setWeatherError('Không thể tải thông tin thời tiết');
      } finally {
        setWeatherLoading(false);
      }
    } catch (error) {
      console.error('Error fetching zone data:', error);
      setMapError('Không thể truy vấn dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsSearching(false);
    }
  }, [applyReportFilters]);

  const requestUserLocation = useCallback(
    (options = { silent: false }) =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          const errorMsg = 'Trình duyệt không hỗ trợ xác định vị trí.';
          console.error('Geolocation not supported');
          if (options.silent) {
            handleLocationSelect(DEFAULT_LOCATION, { fromUser: false }).finally(resolve);
          } else {
            reject(new Error(errorMsg));
          }
          return;
        }

        console.log('Requesting user location...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('Geolocation success:', pos.coords);
            if (options.silent && userSelectedRef.current) {
              resolve();
              return;
            }
            handleLocationSelect(
              {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                address: 'Vị trí hiện tại của bạn',
              },
              { fromUser: !options.silent },
            )
              .then(resolve)
              .catch(reject);
          },
          (err) => {
            console.error('Geolocation error:', err);
            let errorMsg = 'Không thể lấy vị trí hiện tại.';

            switch (err.code) {
              case err.PERMISSION_DENIED:
                errorMsg = 'Quyền truy cập vị trí bị từ chối. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.';
                console.error('User denied geolocation permission');
                break;
              case err.POSITION_UNAVAILABLE:
                errorMsg = 'Không thể xác định vị trí. Vui lòng kiểm tra GPS/WiFi và thử lại.';
                console.error('Position unavailable');
                break;
              case err.TIMEOUT:
                errorMsg = 'Hết thời gian chờ. Vui lòng thử lại.';
                console.error('Geolocation timeout');
                break;
              default:
                errorMsg = `Lỗi không xác định: ${err.message}`;
                console.error('Unknown geolocation error:', err);
            }

            if (options.silent) {
              handleLocationSelect(DEFAULT_LOCATION, { fromUser: false }).finally(resolve);
            } else {
              reject(new Error(errorMsg));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          },
        );
      }),
    [handleLocationSelect],
  );

  useEffect(() => {
    if (mapLoaded && !bootstrapped) {
      requestUserLocation({ silent: true }).catch(() => { });
      setBootstrapped(true);
    }
  }, [mapLoaded, bootstrapped, requestUserLocation]);

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

        <div className="w-full">
          <SearchLocation
            onLocationSelect={(location) => handleLocationSelect(location, { fromUser: true })}
            isDisabled={isSearching}
            regions={REGION_PRESETS}
            mapsReady={mapLoaded}
            onUseCurrentLocation={() => requestUserLocation({ silent: false })}
          />
        </div>

        {zoneSummary && (
          <div className="space-y-4">
            {/* Weather Widget - Full Width Top Row */}
            <WeatherWidget
              weatherData={weatherData}
              isLoading={weatherLoading}
              error={weatherError}
            />

            {/* Summary Cards - 3 Column Grid Below */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Mức độ rủi ro</p>
                <p
                  className={`text-2xl font-bold ${zoneSummary.riskLevel === 'high'
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

export default Home;


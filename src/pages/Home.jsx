import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { AlertCircle, Loader } from "lucide-react";
import Header from "../components/Layout/Header";
import MapView from "../components/Map/MapView";
import ReportsPanel from "../components/Reports/ReportsPanel";
import SearchLocation from "../components/Location/SearchLocation";
import ReportModal from "../components/Reports/ReportModal";
import WeatherWidget from "../components/Weather/WeatherWidget";
import { queryZoneByCoordinates } from "../services/api";
import { getWeatherByCoordinates } from "../services/weatherService";
import { REGION_PRESETS } from "../data/regionMockData";
import { calculateDistanceKm } from "../utils/distance";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const DEFAULT_LOCATION = {
  lat: 16.4637,
  lng: 107.5909,
  address: "Thành phố Huế, Việt Nam",
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
  const mapsScriptLoadedRef = useRef(false);

  // Load Google Maps API dynamically
  useEffect(() => {
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY) {
      setMapError(
        "VITE_GOOGLE_MAPS_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env"
      );
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (mapsScriptLoadedRef.current) {
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      mapsScriptLoadedRef.current = true;
      // Wait for it to load
      existingScript.addEventListener("load", () => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
        }
      });
      return;
    }

    mapsScriptLoadedRef.current = true;

    // Define global callback function BEFORE creating script
    // This ensures it's available when Google Maps API tries to call it
    const callbackName = `initGoogleMaps_${Date.now()}`;
    window[callbackName] = () => {
      try {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
        } else {
          setMapError("Google Maps API đã tải nhưng không khả dụng.");
          mapsScriptLoadedRef.current = false;
        }
      } catch (error) {
        console.error("Error in Google Maps callback:", error);
        setMapError("Lỗi khi khởi tạo Google Maps API.");
        mapsScriptLoadedRef.current = false;
      } finally {
        // Cleanup callback after use
        if (window[callbackName]) {
          delete window[callbackName];
        }
      }
    };

    // Create script tag
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    // Fallback: Check if Maps API loaded even if callback fails
    script.onload = () => {
      // Wait a bit for callback, but also check directly
      setTimeout(() => {
        if (window.google && window.google.maps) {
          console.log("Google Maps API loaded via onload fallback");
          setMapLoaded(true);
        }
      }, 1000);
    };

    script.onerror = () => {
      setMapError(
        "Không thể tải Google Maps API. Vui lòng kiểm tra API key và kết nối mạng."
      );
      mapsScriptLoadedRef.current = false;
      // Cleanup callback on error
      if (window[callbackName]) {
        delete window[callbackName];
      }
    };

    // Add error handler for Google Maps errors
    window.gm_authFailure = () => {
      setMapError(
        "Lỗi xác thực Google Maps API. Vui lòng kiểm tra:\n" +
          "1. API key có đúng không?\n" +
          "2. Billing đã được enable trong Google Cloud Console?\n" +
          '3. Application restrictions: Đảm bảo "HTTP referrers (web sites)" được chọn và domain đã được thêm\n' +
          "4. Maps JavaScript API đã được enable?"
      );
      mapsScriptLoadedRef.current = false;
    };

    // Listen for Google Maps errors in console
    const originalError = console.error;
    const errorListener = (message) => {
      if (
        typeof message === "string" &&
        message.includes("BillingNotEnabledMapError")
      ) {
        setMapError(
          "Lỗi: Billing chưa được enable cho Google Maps API.\n\n" +
            "Vui lòng:\n" +
            "1. Vào Google Cloud Console → Billing\n" +
            "2. Enable billing cho project của bạn\n" +
            "3. Đảm bảo có payment method được thêm\n" +
            "4. Đợi vài phút để cấu hình có hiệu lực\n\n" +
            "Lưu ý: Google Maps Platform yêu cầu billing được enable, nhưng có $200 credit miễn phí mỗi tháng."
        );
        mapsScriptLoadedRef.current = false;
      } else if (
        typeof message === "string" &&
        message.includes("Google Maps JavaScript API error")
      ) {
        // Catch other Google Maps errors
        setMapError(
          "Lỗi Google Maps API. Vui lòng kiểm tra console để xem chi tiết lỗi."
        );
      }
    };

    // Override console.error temporarily to catch Google Maps errors
    console.error = (...args) => {
      originalError.apply(console, args);
      args.forEach(errorListener);
    };

    // Cleanup console override after 10 seconds
    const cleanupConsole = setTimeout(() => {
      console.error = originalError;
    }, 10000);

    // Append script to head
    document.head.appendChild(script);

    // Cleanup
    return () => {
      // Cleanup callback
      if (window[callbackName]) {
        delete window[callbackName];
      }
      if (cleanupConsole) {
        clearTimeout(cleanupConsole);
      }
      console.error = originalError;
      // Remove script if component unmounts before it loads
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const applyReportFilters = useCallback(
    (rawReports = [], center = DEFAULT_LOCATION) => {
      const now = Date.now();
      return rawReports
        .filter(
          (report) =>
            now - new Date(report.timestamp).getTime() <= THREE_DAYS_MS
        )
        .filter((report) => {
          if (!report.location) return false;
          const km = calculateDistanceKm(
            center.lat,
            center.lng,
            report.location.lat,
            report.location.lng
          );
          return km <= 5;
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    []
  );

  const handleLocationSelect = useCallback(
    async (location, { fromUser = false } = {}) => {
      if (fromUser) {
        userSelectedRef.current = true;
      }
      if (!location) return;
      setIsSearching(true);
      setSelectedReport(null);
      setHighlightedReport(null);

      try {
        const response = await queryZoneByCoordinates(location);
        const center = response.zone?.center || {
          lat: location.lat,
          lng: location.lng,
        };

        setZoneInfo(response.zone || null);
        setCenterLocation({
          lat: center.lat,
          lng: center.lng,
          address:
            location.address ||
            response.zone?.address ||
            DEFAULT_LOCATION.address,
        });

        const processed = applyReportFilters(response.reports || [], center);
        setReports(processed);

        // Fetch weather data for the location
        setWeatherLoading(true);
        setWeatherError(null);
        try {
          console.log("🌤️ Fetching weather for center:", center);
          const weather = await getWeatherByCoordinates({
            lat: center.lat,
            lng: center.lng,
          });
          console.log("✅ Weather data received:", weather);
          if (weather.isMock) {
            console.warn(
              "⚠️ WARNING: Using MOCK data! Check VITE_WEATHER_API_KEY in .env"
            );
          } else {
            console.log("✅ Real weather data from Google API!");
          }
          setWeatherData(weather);
        } catch (weatherErr) {
          console.error("❌ Error fetching weather:", weatherErr);
          // Show detailed error message
          const errorMsg =
            weatherErr.message || "Không thể tải thông tin thời tiết";
          setWeatherError(errorMsg);
          // Don't set mock data - let user know there's an error
          setWeatherData(null);
        } finally {
          setWeatherLoading(false);
        }
      } catch (error) {
        console.error("Error fetching zone data:", error);
        setMapError("Không thể truy vấn dữ liệu. Vui lòng thử lại.");
      } finally {
        setIsSearching(false);
      }
    },
    [applyReportFilters]
  );

  const requestUserLocation = useCallback(
    (options = { silent: false }) =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          const errorMsg = "Trình duyệt không hỗ trợ xác định vị trí.";
          console.error("Geolocation not supported");
          if (options.silent) {
            handleLocationSelect(DEFAULT_LOCATION, { fromUser: false }).finally(
              resolve
            );
          } else {
            reject(new Error(errorMsg));
          }
          return;
        }

        console.log("Requesting user location...");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log("Geolocation success:", pos.coords);
            if (options.silent && userSelectedRef.current) {
              resolve();
              return;
            }
            handleLocationSelect(
              {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                address: "Vị trí hiện tại của bạn",
              },
              { fromUser: !options.silent }
            )
              .then(resolve)
              .catch(reject);
          },
          (err) => {
            console.error("Geolocation error:", err);
            let errorMsg = "Không thể lấy vị trí hiện tại.";

            switch (err.code) {
              case err.PERMISSION_DENIED:
                errorMsg =
                  "Quyền truy cập vị trí bị từ chối. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.";
                console.error("User denied geolocation permission");
                break;
              case err.POSITION_UNAVAILABLE:
                errorMsg =
                  "Không thể xác định vị trí. Vui lòng kiểm tra GPS/WiFi và thử lại.";
                console.error("Position unavailable");
                break;
              case err.TIMEOUT:
                errorMsg = "Hết thời gian chờ. Vui lòng thử lại.";
                console.error("Geolocation timeout");
                break;
              default:
                errorMsg = `Lỗi không xác định: ${err.message}`;
                console.error("Unknown geolocation error:", err);
            }

            if (options.silent) {
              handleLocationSelect(DEFAULT_LOCATION, {
                fromUser: false,
              }).finally(resolve);
            } else {
              reject(new Error(errorMsg));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      }),
    [handleLocationSelect]
  );

  useEffect(() => {
    if (mapLoaded && !bootstrapped) {
      requestUserLocation({ silent: true }).catch(() => {});
      setBootstrapped(true);
    }
  }, [mapLoaded, bootstrapped, requestUserLocation]);

  const zoneSummary = useMemo(() => {
    if (!zoneInfo) return null;
    return {
      riskLevel: zoneInfo.riskLevel || "unknown",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {mapError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 font-semibold mb-2">
                  Lỗi Google Maps API
                </p>
                <details className="text-sm text-red-600">
                  <summary className="cursor-pointer hover:text-red-700 mb-2 font-medium">
                    Chi tiết lỗi và hướng dẫn khắc phục
                  </summary>
                  <pre className="mt-2 p-3 bg-red-50 rounded text-xs whitespace-pre-wrap break-words text-red-800 border border-red-200">
                    {mapError}
                  </pre>
                  <div className="mt-3 text-xs text-red-700 space-y-1">
                    <p className="font-semibold">Các bước khắc phục:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        Vào{" "}
                        <a
                          href="https://console.cloud.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-red-800 text-blue-600"
                        >
                          Google Cloud Console
                        </a>
                      </li>
                      <li>Chọn project → APIs & Services → Credentials</li>
                      <li>Click vào API key của bạn</li>
                      <li>
                        Application restrictions: Chọn "HTTP referrers (web
                        sites)" và thêm{" "}
                        <code className="bg-slate-800 px-1 rounded">
                          http://localhost:*
                        </code>
                      </li>
                      <li>
                        API restrictions: Đảm bảo "Maps JavaScript API" và
                        "Places API" được enable
                      </li>
                      <li>
                        Kiểm tra Billing đã được enable trong Google Cloud
                        Console
                      </li>
                      <li>Đợi 5 phút sau khi thay đổi cấu hình</li>
                    </ol>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        <div className="w-full">
          <SearchLocation
            onLocationSelect={(location) =>
              handleLocationSelect(location, { fromUser: true })
            }
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
              <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:bg-white transition-all">
                <p className="text-xs text-blue-600 uppercase tracking-wide mb-2 font-semibold">
                  Mức độ rủi ro
                </p>
                <p
                  className={`text-3xl font-bold ${
                    zoneSummary.riskLevel === "high"
                      ? "text-red-500"
                      : zoneSummary.riskLevel === "medium"
                      ? "text-orange-500"
                      : "text-yellow-500"
                  }`}
                >
                  {zoneSummary.riskLevel.toUpperCase()}
                </p>
              </div>
              <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:bg-white transition-all">
                <p className="text-xs text-blue-600 uppercase tracking-wide mb-2 font-semibold">
                  Risk Score
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {zoneSummary.score}/10
                </p>
              </div>
              <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:bg-white transition-all">
                <p className="text-xs text-blue-600 uppercase tracking-wide mb-2 font-semibold">
                  Báo cáo trong vùng
                </p>
                <p className="text-3xl font-bold text-blue-500">
                  {zoneSummary.reportCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {!mapLoaded && !mapError && (
          <div className="p-8 bg-white/90 backdrop-blur-md rounded-2xl border border-blue-200 flex items-center justify-center gap-3 h-[600px] shadow-lg">
            <Loader className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-blue-700 font-medium">Đang tải bản đồ...</p>
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

      <footer className="bg-blue-600/10 backdrop-blur-md border-t border-blue-200/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-blue-700 text-sm">
            <p className="font-semibold">
              © 2025 StormWatch Project | Dự án giám sát bão lũ cộng đồng
            </p>
            <p className="mt-2 text-blue-600/80">
              Dữ liệu được cập nhật thời gian thực từ cộng đồng
            </p>
          </div>
        </div>
      </footer>
      <ReportModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
}

export default Home;

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { AlertCircle, Loader, AlertTriangle } from "lucide-react";
import Header from "../components/Layout/Header";
import MapView from "../components/Map/MapView";
import ReportsPanel from "../components/Reports/ReportsPanel";
import SearchLocation from "../components/Location/SearchLocation";
import ReportModal from "../components/Reports/ReportModal";
import SOSDetailModal from "../components/SOS/SOSDetailModal";
import WeatherWidget from "../components/Weather/WeatherWidget";
import StatusSelector from "../components/Status/StatusSelector";
import { queryZoneByCoordinates, getNearbySOS, getZonesByBounds } from "../services/api";
import { getWeatherByCoordinates } from "../services/weatherService";
import { calculateDistanceKm } from "../utils/distance";
import {
  getCurrentPosition as getCurrentPositionWithFake,
  getFakeLocation,
} from "../utils/fakeLocation";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const DEFAULT_LOCATION = {
  lat: 16.4637,
  lng: 107.5909,
  address: "Thành phố Huế, Việt Nam",
};

function Home() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [zoneInfo, setZoneInfo] = useState(null);
  
  // Load saved location from localStorage or use default
  const [centerLocation, setCenterLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('last_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng) {
          console.log('📍 [Home] Loaded saved location from localStorage:', parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved location:', e);
    }
    return DEFAULT_LOCATION;
  });
  const [userLocation, setUserLocation] = useState(null); // User's actual GPS location
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [highlightedReport, setHighlightedReport] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [nearbySOS, setNearbySOS] = useState([]);
  const [sosLoading, setSosLoading] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [userStatus, setUserStatus] = useState("UNKNOWN"); // User's safety status
  const userSelectedRef = useRef(false);
  const mapsScriptLoadedRef = useRef(false);
  const hasInitializedLocationRef = useRef(false); // Track if location has been initialized

  // Load Google Maps API dynamically
  useEffect(() => {
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Only show error if API key is missing AND map fails to load
    // Don't show error if map loads successfully (even with billing watermark)
    if (!GOOGLE_MAPS_API_KEY) {
      // Don't set error immediately - wait to see if map loads
      console.warn("⚠️ [Home] VITE_GOOGLE_MAPS_API_KEY not configured");
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
          // Clear any previous errors if map loads successfully
          setMapError(null);
        } else {
          // Only set error if map truly fails to load
          if (!GOOGLE_MAPS_API_KEY) {
            setMapError(
              "VITE_GOOGLE_MAPS_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env"
            );
          } else {
            setMapError("Google Maps API đã tải nhưng không khả dụng.");
          }
          mapsScriptLoadedRef.current = false;
        }
      } catch (error) {
        console.error("Error in Google Maps callback:", error);
        // Only set error if API key is missing or there's a real error
        if (!GOOGLE_MAPS_API_KEY) {
          setMapError(
            "VITE_GOOGLE_MAPS_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env"
          );
        } else {
          setMapError("Lỗi khi khởi tạo Google Maps API.");
        }
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
          // Clear any previous errors if map loads successfully
          setMapError(null);
        } else if (!GOOGLE_MAPS_API_KEY) {
          // Only set error if API key is missing and map fails to load
          setMapError(
            "VITE_GOOGLE_MAPS_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env"
          );
        }
      }, 1000);
    };

    script.onerror = () => {
      // Only set error if script truly fails to load
      if (!GOOGLE_MAPS_API_KEY) {
        setMapError(
          "VITE_GOOGLE_MAPS_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env"
        );
      } else {
        setMapError(
          "Không thể tải Google Maps API. Vui lòng kiểm tra API key và kết nối mạng."
        );
      }
      mapsScriptLoadedRef.current = false;
      // Cleanup callback on error
      if (window[callbackName]) {
        delete window[callbackName];
      }
    };

    // Add error handler for Google Maps errors
    // Note: This is called when there's an authentication error, but if map still loads
    // (with watermark), we shouldn't show error banner
    window.gm_authFailure = () => {
      // Don't set error immediately - check if map actually loads
      console.warn("⚠️ [Google Maps] Authentication warning (may still work with watermark)");
      // Only set error if map truly fails to load (checked in callback/onload)
    };
    
    // Handle Google Maps loading errors
    // Only show errors if map truly fails to load, not just billing warnings
    const handleMapsError = (error) => {
      console.warn("⚠️ [Google Maps] Warning:", error);
      // Don't set error immediately - billing errors may still allow map to load with watermark
      // Only set error if map actually fails to load (checked in callback/onload)
      if (error && error.message) {
        if (error.message.includes("BillingNotEnabledMapError") || error.message.includes("billing")) {
          // Billing error - map may still work with watermark, so don't show error banner
          console.warn("⚠️ [Google Maps] Billing not enabled - map may show watermark but still work");
        } else if (error.message.includes("RefererNotAllowedMapError") || error.message.includes("referer")) {
          // Referer error - this is more serious, but still check if map loads
          console.warn("⚠️ [Google Maps] Referer not allowed - check if map loads");
        }
      }
    };
    
    // Listen for unhandled errors
    const errorHandler = (event) => {
      if (event.message && (event.message.includes('maps.googleapis.com') || event.message.includes('Google Maps'))) {
        handleMapsError({ message: event.message });
      }
    };
    
    window.addEventListener('error', errorHandler);

    // Listen for Google Maps errors in console
    // Don't show error banner for billing warnings if map still loads
    const originalError = console.error;
    const errorListener = (message) => {
      if (
        typeof message === "string" &&
        message.includes("BillingNotEnabledMapError")
      ) {
        // Billing error - map may still work with watermark, so don't show error banner
        console.warn("⚠️ [Google Maps] Billing not enabled - map may show watermark but still work");
        // Don't set error - let callback/onload check if map actually loads
      } else if (
        typeof message === "string" &&
        message.includes("Google Maps JavaScript API error")
      ) {
        // Only set error if map truly fails to load (checked in callback/onload)
        console.warn("⚠️ [Google Maps] API error - check if map loads");
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
      // Remove error handler
      window.removeEventListener('error', errorHandler);
      // Remove script if component unmounts before it loads
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  /**
   * Calculate bounds from center location with a radius (in km)
   * @param {Object} center - { lat: number, lng: number }
   * @param {number} radiusKm - Radius in kilometers (default: 10km)
   * @returns {Object} Bounds object { minLat, minLon, maxLat, maxLon }
   */
  const calculateBoundsFromCenter = useCallback((center, radiusKm = 10) => {
    // Approximate: 1 degree latitude ≈ 111 km
    // Longitude varies by latitude, but we'll use an approximation
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
    
    return {
      minLat: center.lat - latDelta,
      minLon: center.lng - lngDelta,
      maxLat: center.lat + latDelta,
      maxLon: center.lng + lngDelta,
    };
  }, []);

  /**
   * Find the zone closest to center location or highest risk zone
   * @param {Array} zones - Array of zone objects
   * @param {Object} center - { lat: number, lng: number }
   * @returns {Object|null} Selected zone or null
   */
  const selectZoneFromZones = useCallback((zones, center) => {
    if (!zones || zones.length === 0) return null;
    
    // Find zone with highest riskScore first
    const sortedByRisk = [...zones].sort((a, b) => {
      const riskA = parseFloat(a.riskScore) || 0;
      const riskB = parseFloat(b.riskScore) || 0;
      return riskB - riskA;
    });
    
    // If there's a high-risk zone (>= 0.7), prefer it
    const highRiskZone = sortedByRisk.find(z => {
      const risk = parseFloat(z.riskScore) || 0;
      return risk >= 0.7;
    });
    
    if (highRiskZone) return highRiskZone;
    
    // Otherwise, find the closest zone to center
    let closestZone = null;
    let minDistance = Infinity;
    
    zones.forEach(zone => {
      if (!zone.center || !zone.center.lat || !zone.center.lng) return;
      
      const distance = calculateDistanceKm(
        center.lat,
        center.lng,
        zone.center.lat,
        zone.center.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestZone = zone;
      }
    });
    
    return closestZone || sortedByRisk[0]; // Fallback to highest risk if no close zone
  }, []);

  /**
   * Determine risk level from riskScore (0-1.0 scale)
   * @param {number} riskScore - Risk score from 0 to 1.0
   * @returns {string} Risk level: "high", "medium", "low", "unknown"
   */
  const getRiskLevelFromScore = useCallback((riskScore) => {
    if (riskScore === null || riskScore === undefined || isNaN(riskScore)) {
      return "unknown";
    }
    
    const score = parseFloat(riskScore);
    if (score >= 0.7) return "high";
    if (score >= 0.4) return "medium";
    if (score >= 0) return "low";
    return "unknown";
  }, []);

  const applyReportFilters = useCallback(
    (rawReports = [], center = DEFAULT_LOCATION) => {
      const now = Date.now();
      console.log(
        "🔍 [Filter] Starting filter with",
        rawReports.length,
        "reports"
      );
      console.log("🔍 [Filter] Center:", center);
      console.log("🔍 [Filter] Current time:", new Date(now).toISOString());
      console.log(
        "🔍 [Filter] Three days ago:",
        new Date(now - THREE_DAYS_MS).toISOString()
      );

      const timeFiltered = rawReports.filter((report) => {
        if (!report.timestamp) {
          console.warn("⚠️ [Filter] Report missing timestamp:", report.id);
          return false;
        }
        const reportTime = new Date(report.timestamp).getTime();
        const timeDiff = now - reportTime;
        const isValid = timeDiff <= THREE_DAYS_MS;

        if (!isValid) {
          console.log(`  ❌ [Filter] Report ${report.id} too old:`, {
            reportTime: new Date(reportTime).toISOString(),
            ageHours: (timeDiff / (1000 * 60 * 60)).toFixed(2),
          });
        }

        return isValid;
      });

      console.log(
        "⏰ [Filter] After time filter:",
        timeFiltered.length,
        "reports"
      );

      const distanceFiltered = timeFiltered.filter((report) => {
        if (!report.location) {
          console.warn("⚠️ [Filter] Report missing location:", report.id);
          return false;
        }

        if (!report.location.lat || !report.location.lng) {
          console.warn(
            "⚠️ [Filter] Report location missing lat/lng:",
            report.id,
            report.location
          );
          return false;
        }

        const km = calculateDistanceKm(
          center.lat,
          center.lng,
          report.location.lat,
          report.location.lng
        );

        const isValid = km <= 10;

        if (!isValid) {
          console.log(`  ❌ [Filter] Report ${report.id} too far:`, {
            distance: km.toFixed(2),
            location: report.location,
          });
        } else {
          console.log(`  ✅ [Filter] Report ${report.id} within range:`, {
            distance: km.toFixed(2),
            location: report.location,
          });
        }

        return isValid;
      });

      console.log(
        "📏 [Filter] After distance filter:",
        distanceFiltered.length,
        "reports"
      );

      const sorted = distanceFiltered.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      console.log(
        "✅ [Filter] Final filtered and sorted reports:",
        sorted.length
      );

      return sorted;
    },
    []
  );

  const handleLocationSelect = useCallback(
    async (location, { fromUser = false } = {}) => {
      if (fromUser) {
        userSelectedRef.current = true;
      }
      if (!location) return;
      setSelectedReport(null);
      setHighlightedReport(null);

      try {
        console.log("📍 [Home] Fetching reports for location:", location);
        const response = await queryZoneByCoordinates(location);
        console.log("✅ [Home] API response received:", response);

        const center = response.zone?.center || {
          lat: location.lat,
          lng: location.lng,
        };

        // Fetch zones data using bounds API
        try {
          const bounds = calculateBoundsFromCenter(center, 10); // 10km radius
          console.log("🗺️ [Home] Fetching zones for bounds:", bounds);
          const zones = await getZonesByBounds(bounds);
          console.log("✅ [Home] Zones fetched:", zones.length);
          
          // Select the most relevant zone (highest risk or closest to center)
          const selectedZone = selectZoneFromZones(zones, center);
          
          if (selectedZone) {
            console.log("✅ [Home] Selected zone:", selectedZone);
            // Transform zone to match expected format
            setZoneInfo({
              ...selectedZone,
              center: selectedZone.center,
              riskScore: selectedZone.riskScore,
              label: selectedZone.label,
              updatedAt: selectedZone.updatedAt,
            });
          } else {
            // Fallback to old zone info if no zones found
            setZoneInfo(response.zone || null);
          }
        } catch (zonesError) {
          console.warn("⚠️ [Home] Failed to fetch zones, using fallback:", zonesError);
          // Fallback to old zone info if zones API fails
          setZoneInfo(response.zone || null);
        }
        const newLocation = {
          lat: center.lat,
          lng: center.lng,
          address:
            location.address ||
            response.zone?.address ||
            centerLocation.address ||
            DEFAULT_LOCATION.address,
        };
        setCenterLocation(newLocation);
        
        // Save to localStorage to persist across reloads
        try {
          localStorage.setItem('last_location', JSON.stringify(newLocation));
          console.log('📍 [Home] Saved location to localStorage:', newLocation);
        } catch (e) {
          console.warn('Failed to save location:', e);
        }

        console.log(
          "🔍 [Home] Raw reports before filtering:",
          response.reports?.length || 0
        );
        console.log("🔍 [Home] Filtering reports for center:", center);
        const processed = applyReportFilters(response.reports || [], center);
        console.log("✅ [Home] Filtered reports:", processed.length);
        console.log("📋 [Home] Processed reports:", processed);
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
          
          // Only set weather data if it's real data (not mock)
          if (weather.isMock) {
            console.warn(
              "⚠️ WARNING: Received MOCK data! Check VITE_WEATHER_API_KEY in .env"
            );
            // Don't show mock data - set to null instead
            setWeatherData(null);
            setWeatherError("VITE_WEATHER_API_KEY chưa được cấu hình. Weather widget sẽ không hiển thị.");
          } else {
            console.log("✅ Real weather data from OpenWeatherMap API!");
            setWeatherData(weather);
          }
        } catch (weatherErr) {
          console.error("❌ Error fetching weather:", weatherErr);
          // Don't use fallback - just set error and null data
          const errorMsg =
            weatherErr.message || "Không thể tải thông tin thời tiết";
          setWeatherError(errorMsg);
          setWeatherData(null);
        } finally {
          setWeatherLoading(false);
        }
      } catch (error) {
        console.error("Error fetching zone data:", error);
        // Even if zone API fails, still try to fetch weather for the location
        const fallbackCenter = location || centerLocation || DEFAULT_LOCATION;
        if (fallbackCenter && fallbackCenter.lat && fallbackCenter.lng) {
          setWeatherLoading(true);
          setWeatherError(null);
          try {
            console.log("🌤️ Fetching weather after zone API error for:", fallbackCenter);
            const weather = await getWeatherByCoordinates({
              lat: fallbackCenter.lat,
              lng: fallbackCenter.lng,
            });
            // Only set weather data if it's real data (not mock)
            if (weather.isMock) {
              console.warn("⚠️ Received MOCK weather data - not displaying");
              setWeatherData(null);
              setWeatherError("VITE_WEATHER_API_KEY chưa được cấu hình.");
            } else {
              setWeatherData(weather);
            }
          } catch (weatherErr) {
            console.error("❌ Error fetching weather after zone error:", weatherErr);
            setWeatherData(null);
            setWeatherError(weatherErr.message || "Không thể tải thông tin thời tiết");
          } finally {
            setWeatherLoading(false);
          }
        }
      }
    },
    [applyReportFilters, calculateBoundsFromCenter, selectZoneFromZones]
  );

  const requestUserLocation = useCallback(
    (options = { silent: false }) =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          const errorMsg = "Trình duyệt không hỗ trợ xác định vị trí.";
          console.error("Geolocation not supported");
          if (options.silent) {
            // Only fallback to DEFAULT_LOCATION if no location has been set yet
            if (!hasInitializedLocationRef.current && centerLocation.lat === DEFAULT_LOCATION.lat && centerLocation.lng === DEFAULT_LOCATION.lng) {
              handleLocationSelect(DEFAULT_LOCATION, { fromUser: false }).finally(
                resolve
              );
            } else {
              // Use existing location, don't change it
              console.log('📍 [Home] Keeping existing location, not falling back to default');
              resolve();
            }
          } else {
            reject(new Error(errorMsg));
          }
          return;
        }

        console.log("Requesting user location...");

        // Sử dụng getCurrentPosition từ fakeLocation utils
        // Tự động dùng fake location nếu là test account
        getCurrentPositionWithFake(
          (pos) => {
            console.log("Geolocation success:", pos.coords);
            if (options.silent && userSelectedRef.current) {
              resolve();
              return;
            }

            // Nếu là fake location, dùng address từ config
            // Nếu không, dùng "Vị trí hiện tại của bạn" (không dùng reverse geocoding)
            const fakeLoc = getFakeLocation();
            const isFakeLocation =
              fakeLoc &&
              Math.abs(fakeLoc.lat - pos.coords.latitude) < 0.0001 &&
              Math.abs(fakeLoc.lng - pos.coords.longitude) < 0.0001;

            const address = isFakeLocation
              ? fakeLoc.address || "Vị trí hiện tại của bạn"
              : "Vị trí hiện tại của bạn";

            const location = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              address: address,
            };

            // Save user's actual location for map marker
            setUserLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });

            handleLocationSelect(location, { fromUser: !options.silent })
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
              // Only fallback to DEFAULT_LOCATION if no location has been set yet
              if (!hasInitializedLocationRef.current && centerLocation.lat === DEFAULT_LOCATION.lat && centerLocation.lng === DEFAULT_LOCATION.lng) {
                handleLocationSelect(DEFAULT_LOCATION, {
                  fromUser: false,
                }).finally(resolve);
              } else {
                // Use existing location, don't change it
                console.log('📍 [Home] Geolocation failed, keeping existing location');
                resolve();
              }
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
      // Mark as initialized
      hasInitializedLocationRef.current = true;
      
      // Only request user location if we're still at default location
      // Otherwise, use the saved location from localStorage
      if (centerLocation.lat === DEFAULT_LOCATION.lat && centerLocation.lng === DEFAULT_LOCATION.lng) {
        console.log('📍 [Home] At default location, requesting user location...');
        requestUserLocation({ silent: true }).catch(() => {
          console.log('📍 [Home] Failed to get user location, keeping default');
        });
      } else {
        console.log('📍 [Home] Using saved location, not requesting new one');
        // Use saved location, fetch data for it
        handleLocationSelect(centerLocation, { fromUser: false }).catch(() => {
          console.error('Failed to load data for saved location');
        });
      }
      setBootstrapped(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, bootstrapped]);

  const zoneSummary = useMemo(() => {
    if (!zoneInfo) return null;
    
    const riskScore = zoneInfo.riskScore !== undefined && zoneInfo.riskScore !== null
      ? parseFloat(zoneInfo.riskScore)
      : null;
    
    const riskLevel = riskScore !== null && !isNaN(riskScore)
      ? getRiskLevelFromScore(riskScore)
      : (zoneInfo.riskLevel || zoneInfo.label?.toLowerCase() || "unknown");
    
    return {
      riskLevel: riskLevel,
      score: riskScore !== null && !isNaN(riskScore) ? riskScore : 0,
      reportCount: reports.length,
      updatedAt: zoneInfo.updatedAt || zoneInfo.lastUpdated,
    };
  }, [zoneInfo, reports.length, getRiskLevelFromScore]);

  const handleFocusReport = (report) => {
    setHighlightedReport(report);
  };

  const handleMarkerClick = (report) => {
    setSelectedReport(report);
    setHighlightedReport(report);
  };

  const fetchNearbySOS = useCallback(async (coordinates) => {
    if (!coordinates || !coordinates.lat || !coordinates.lng) return;

    setSosLoading(true);
    try {
      console.log("🔔 [Home] Fetching nearby SOS for:", coordinates);
      const sosList = await getNearbySOS(coordinates, 10); // 10km radius

      // Filter out RESOLVED/SOLVED SOS - only show active/RAISED SOS
      const activeSOS = (sosList || []).filter((sos) => {
        const status = sos.Status || sos.status || "";
        return status !== "SOLVED" && status !== "RESOLVED";
      });

      console.log("✅ [Home] Nearby SOS fetched:", sosList.length, "signals");
      console.log(
        "✅ [Home] Active SOS (filtered):",
        activeSOS.length,
        "signals"
      );
      setNearbySOS(activeSOS);
    } catch (error) {
      console.error("❌ [Home] Error fetching nearby SOS:", error);
      setNearbySOS([]);
    } finally {
      setSosLoading(false);
    }
  }, []);

  // Auto-fetch SOS when location changes
  useEffect(() => {
    if (centerLocation && centerLocation.lat && centerLocation.lng) {
      fetchNearbySOS(centerLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLocation?.lat, centerLocation?.lng]);

  const handleBellClick = () => {
    if (centerLocation) {
      fetchNearbySOS(centerLocation);
    }
    setShowSOSModal(true);
  };

  const handleSOSMarkerClick = (sos) => {
    setSelectedSOS(sos);
  };

  const handleSOSStatusUpdate = (alertId, newStatus) => {
    // Update local state and filter out RESOLVED/SOLVED SOS
    setNearbySOS((prev) => {
      const updated = prev.map((sos) =>
        sos.alertId === alertId || sos.id === alertId
          ? { ...sos, Status: newStatus }
          : sos
      );
      // Filter out RESOLVED/SOLVED SOS - they should not appear anymore
      return updated.filter((sos) => {
        const status = sos.Status || sos.status || "";
        return status !== "SOLVED" && status !== "RESOLVED";
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <Header
        sosBellProps={{
          nearbySOS,
          sosLoading,
          showSOSModal,
          setShowSOSModal,
          handleBellClick,
          handleLocationSelect,
        }}
      />

      <main className="container mx-auto px-4 py-8 space-y-6">

        {/* <div className="w-full">
            <SearchLocation
              onLocationSelect={(location) =>
                handleLocationSelect(location, { fromUser: true })
              }
              isDisabled={isSearching}
              regions={REGION_PRESETS}
              mapsReady={mapLoaded}
              onUseCurrentLocation={() => requestUserLocation({ silent: false })}
            />
          </div> */}

        {/* Weather Widget and Status Selector - Only show weather if real data available */}
        <div className="space-y-4">
          {/* Weather Widget and Status Selector - Top Row */}
          <div className={`grid grid-cols-1 gap-4 ${weatherData && !weatherData.isMock ? 'lg:grid-cols-4' : 'lg:grid-cols-1'}`}>
            {/* Weather Widget - Only show if real data (not mock, not null) */}
            {weatherData && !weatherData.isMock && (
              <div className="lg:col-span-3">
                <WeatherWidget
                  weatherData={weatherData}
                  isLoading={weatherLoading}
                  error={weatherError}
                />
              </div>
            )}
            
            {/* Status Selector - Always show, takes full width if no weather */}
            <div className={weatherData && !weatherData.isMock ? "lg:col-span-1" : "lg:col-span-1"}>
              <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-4 shadow-lg h-full flex items-center justify-center">
                <div className="w-full">
                  <p className="text-xs text-blue-600 uppercase tracking-wide mb-3 font-semibold text-center">
                    Trạng thái của bạn
                  </p>
                  <StatusSelector onStatusChange={setUserStatus} />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards - 3 Column Grid Below - Only show if zoneSummary exists */}
          {zoneSummary && (
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
                  {zoneSummary.score.toFixed(2)}/1.0
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
          )}
        </div>

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
                userLocation={userLocation}
                reports={reports}
                nearbySOS={nearbySOS}
                onMarkerClick={handleMarkerClick}
                onSOSMarkerClick={handleSOSMarkerClick}
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
      {selectedSOS && (
        <SOSDetailModal
          sos={selectedSOS}
          onClose={() => setSelectedSOS(null)}
          onStatusUpdate={handleSOSStatusUpdate}
        />
      )}
    </div>
  );
}

export default Home;

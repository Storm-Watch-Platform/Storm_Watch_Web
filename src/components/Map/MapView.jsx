import React, { useEffect, useRef, useCallback, useState } from 'react';
import { getZonesByBounds } from '../../services/api';
import { calculateDistanceKm } from '../../utils/distance';

const mapStyles = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
];

const severityColor = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#facc15',
};

export default function MapView({
  mapLoaded,
  centerLocation,
  userLocation, // User's actual GPS location
  reports,
  nearbySOS = [], // SOS signals
  onMarkerClick,
  onSOSMarkerClick,
  highlightedReport,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const sosMarkersRef = useRef([]);
  const zonesRef = useRef([]); // Store zone circles
  const infoWindowRef = useRef(null);
  const boundsChangeTimeoutRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const [zonesLoading, setZonesLoading] = useState(false);

  const initMap = () => {
    if (!window.google || !mapRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: centerLocation || { lat: 16.4637, lng: 107.5909 }, // Huế default
      zoom: 13,
      styles: mapStyles,
      disableDefaultUI: false,
    });
  };

  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstanceRef.current && window.google) {
      initMap();
    }
  }, [mapLoaded]);

  /**
   * Calculate distance between two coordinates in meters using Haversine formula
   */
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  /**
   * Filter overlapping zones - keep only the zone with highest riskScore in each overlapping group
   */
  const filterOverlappingZones = useCallback((zones) => {
    if (!zones || zones.length === 0) return [];

    const validZones = zones.filter(
      (z) => z.center && z.center.lat && z.center.lng
    );

    if (validZones.length === 0) return [];

    // Sort zones by riskScore (descending) and radius (descending)
    const sortedZones = [...validZones].sort((a, b) => {
      const riskScoreA = parseFloat(a.riskScore) || 0;
      const riskScoreB = parseFloat(b.riskScore) || 0;
      
      if (Math.abs(riskScoreA - riskScoreB) > 0.01) {
        return riskScoreB - riskScoreA;
      }
      
      const radiusA = a.radius || 0;
      const radiusB = b.radius || 0;
      return radiusB - radiusA;
    });

    const filteredZones = [];
    const processedIndices = new Set();

    for (let i = 0; i < sortedZones.length; i++) {
      if (processedIndices.has(i)) continue;

      const currentZone = sortedZones[i];
      const currentRadius = currentZone.radius || 500;
      const currentLat = currentZone.center.lat;
      const currentLng = currentZone.center.lng;

      let isOverlapping = false;
      for (const filteredZone of filteredZones) {
        const filteredRadius = filteredZone.radius || 500;
        const filteredLat = filteredZone.center.lat;
        const filteredLng = filteredZone.center.lng;

        const distance = calculateDistance(
          currentLat,
          currentLng,
          filteredLat,
          filteredLng
        );

        const overlapThreshold = 0.7;
        const maxDistance = (currentRadius + filteredRadius) * overlapThreshold;

        if (distance < maxDistance) {
          isOverlapping = true;
          break;
        }
      }

      if (!isOverlapping) {
        filteredZones.push(currentZone);
      }

      processedIndices.add(i);
    }

    console.log(
      `🔍 [MapView] Filtered ${validZones.length} zones → ${filteredZones.length} zones (removed ${validZones.length - filteredZones.length} overlapping)`
    );

    return filteredZones;
  }, [calculateDistance]);

  /**
   * Calculate bounds from center location with a radius (in km)
   */
  const calculateBoundsFromCenter = useCallback((center, radiusKm = 10) => {
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
   * Fetch and render zones for current map bounds
   */
  const fetchZonesForBounds = useCallback(async (bounds) => {
    if (!mapInstanceRef.current || !window.google) return;

    setZonesLoading(true);
    try {
      const zones = await getZonesByBounds(bounds);
      console.log('✅ [MapView] Zones fetched:', zones.length);

      // Clear previous zones
      zonesRef.current.forEach((zoneCircle) => {
        if (zoneCircle && zoneCircle.setMap) {
          zoneCircle.setMap(null);
        }
      });
      zonesRef.current = [];

      // Filter overlapping zones
      const filteredZones = filterOverlappingZones(zones);
      console.log('✅ [MapView] Zones after filtering:', filteredZones.length);

      // Render filtered zones as circles on map
      filteredZones.forEach((zone) => {
        if (!zone.center || !zone.center.lat || !zone.center.lng) return;

        // Determine color based on riskScore (0-1.0 scale)
        let fillColor = '#3b82f6'; // Default blue
        let strokeColor = '#2563eb';
        let fillOpacity = 0.15;
        let strokeOpacity = 0.6;

        const riskScore = zone.riskScore !== undefined && zone.riskScore !== null 
          ? parseFloat(zone.riskScore) 
          : null;

        if (riskScore !== null && !isNaN(riskScore)) {
          // Use riskScore to determine color (0-1.0 scale)
          if (riskScore >= 0.7) {
            fillColor = '#ef4444'; // Red - High risk
            strokeColor = '#dc2626';
            fillOpacity = 0.2;
          } else if (riskScore >= 0.4) {
            fillColor = '#f59e0b'; // Orange - Medium risk
            strokeColor = '#d97706';
            fillOpacity = 0.18;
          } else {
            fillColor = '#10b981'; // Green - Low risk
            strokeColor = '#059669';
            fillOpacity = 0.12;
          }
        } else if (zone.label) {
          // Fallback to label if riskScore not available
          const label = zone.label.toUpperCase();
          if (label === 'HIGH' || label === 'DANGER') {
            fillColor = '#ef4444';
            strokeColor = '#dc2626';
            fillOpacity = 0.2;
          } else if (label === 'MEDIUM' || label === 'WARNING') {
            fillColor = '#f59e0b';
            strokeColor = '#d97706';
            fillOpacity = 0.18;
          } else if (label === 'LOW' || label === 'SAFE') {
            fillColor = '#10b981';
            strokeColor = '#059669';
            fillOpacity = 0.12;
          }
        }

        // Create circle for zone
        const circle = new window.google.maps.Circle({
          strokeColor: strokeColor,
          strokeOpacity: strokeOpacity,
          strokeWeight: 2,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          map: mapInstanceRef.current,
          center: {
            lat: zone.center.lat,
            lng: zone.center.lng,
          },
          radius: (zone.radius || 500) * 1, // Convert to meters
          zIndex: 1, // Below markers
        });

        // Add click listener to show zone info
        const zoneRiskScore = riskScore;
        circle.addListener('click', () => {
          const infoContent = `
            <div style="padding: 12px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af;">
                Vùng rủi ro
              </h3>
              <div style="font-size: 12px; color: #4b5563;">
                <div style="margin-bottom: 4px;">
                  <strong>Mức độ:</strong> 
                  <span style="color: ${strokeColor};">${zone.label || 'N/A'}</span>
                </div>
                ${zoneRiskScore !== null && !isNaN(zoneRiskScore) ? `<div style="margin-bottom: 4px;"><strong>Risk Score:</strong> ${zoneRiskScore.toFixed(2)}/1.0</div>` : ''}
                <div style="margin-bottom: 4px;">
                  <strong>Bán kính:</strong> ${(zone.radius || 500) / 1000} km
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #6b7280;">
                  ${zone.center.lat.toFixed(6)}, ${zone.center.lng.toFixed(6)}
                </div>
              </div>
            </div>
          `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: infoContent,
            position: {
              lat: zone.center.lat,
              lng: zone.center.lng,
            },
          });

          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
          infoWindowRef.current = infoWindow;
          infoWindow.open(mapInstanceRef.current);
        });

        zonesRef.current.push(circle);
      });
    } catch (error) {
      console.error('❌ [MapView] Error fetching zones:', error);
    } finally {
      setZonesLoading(false);
    }
  }, [filterOverlappingZones]);

  // Update map center and fetch zones when location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !centerLocation || !window.google) return;
    const map = mapInstanceRef.current;

    map.panTo(centerLocation);
    if (map.getZoom() < 13) {
      map.setZoom(13);
    }

    // Fetch zones for current view
    const bounds = calculateBoundsFromCenter(centerLocation, 10); // 10km radius
    fetchZonesForBounds(bounds);

    // Add bounds_changed listener to fetch zones when map view changes
    const boundsChangedListener = map.addListener('bounds_changed', () => {
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current);
      }

      boundsChangeTimeoutRef.current = setTimeout(() => {
        if (!mapInstanceRef.current) return;

        const currentBounds = mapInstanceRef.current.getBounds();
        if (!currentBounds) return;

        const ne = currentBounds.getNorthEast();
        const sw = currentBounds.getSouthWest();

        const boundsParams = {
          minLat: sw.lat(),
          minLon: sw.lng(),
          maxLat: ne.lat(),
          maxLon: ne.lng(),
        };

        console.log('🗺️ [MapView] Map bounds changed:', boundsParams);
        fetchZonesForBounds(boundsParams);
      }, 500); // 500ms debounce
    });

    // Initial fetch when map is ready
    setTimeout(() => {
      if (mapInstanceRef.current) {
        const currentBounds = mapInstanceRef.current.getBounds();
        if (currentBounds) {
          const ne = currentBounds.getNorthEast();
          const sw = currentBounds.getSouthWest();
          fetchZonesForBounds({
            minLat: sw.lat(),
            minLon: sw.lng(),
            maxLat: ne.lat(),
            maxLon: ne.lng(),
          });
        }
      }
    }, 1000);

    return () => {
      if (boundsChangedListener) {
        window.google.maps.event.removeListener(boundsChangedListener);
      }
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current);
      }
    };
  }, [centerLocation, mapLoaded, calculateBoundsFromCenter, fetchZonesForBounds]);

  // Render user location marker (with special pin icon)
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !window.google) {
      // Remove user marker if no location
      if (userLocationMarkerRef.current) {
        if (userLocationMarkerRef.current.marker) {
          userLocationMarkerRef.current.marker.setMap(null);
        }
        if (userLocationMarkerRef.current.circle) {
          userLocationMarkerRef.current.circle.setMap(null);
        }
        userLocationMarkerRef.current = null;
      }
      return;
    }

    // Remove old user marker
    if (userLocationMarkerRef.current) {
      if (userLocationMarkerRef.current.marker) {
        userLocationMarkerRef.current.marker.setMap(null);
      }
      if (userLocationMarkerRef.current.circle) {
        userLocationMarkerRef.current.circle.setMap(null);
      }
    }

    // Create custom pin icon for user location
    const userPinIcon = {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 14,
      fillColor: '#10b981', // Green color
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 3,
    };

    // Add outer circle for better visibility
    const userLocationMarker = new window.google.maps.Marker({
      position: userLocation,
      map: mapInstanceRef.current,
      icon: userPinIcon,
      title: 'Vị trí của bạn',
      zIndex: 1000, // Highest z-index to always show on top
      animation: window.google.maps.Animation.DROP,
    });

    // Add label/pulse effect with circle
    const userLocationCircle = new window.google.maps.Circle({
      strokeColor: '#10b981',
      strokeOpacity: 0.4,
      strokeWeight: 2,
      fillColor: '#10b981',
      fillOpacity: 0.1,
      map: mapInstanceRef.current,
      center: userLocation,
      radius: 50, // 50 meters radius for visibility
    });

    userLocationMarkerRef.current = {
      marker: userLocationMarker,
      circle: userLocationCircle,
    };
  }, [userLocation]);

  // Helper function to create custom marker with text label
  const createLabeledMarker = (text, color, size = 12) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = size * 2 + 20;
    canvas.height = size * 2 + 20;

    // Draw circle background
    context.beginPath();
    context.arc(size + 10, size + 10, size, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    context.stroke();

    // Draw text
    context.fillStyle = '#fff';
    context.font = 'bold 10px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, size + 10, size + 10);

    return {
      url: canvas.toDataURL(),
      scaledSize: new window.google.maps.Size(size * 2 + 20, size * 2 + 20),
      anchor: new window.google.maps.Point(size + 10, size + 10),
    };
  };

  // Render report markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    (reports || []).forEach((report) => {
      // Skip if report location is same as user location
      const isUserLocation = userLocation &&
        report.location &&
        Math.abs(report.location.lat - userLocation.lat) < 0.0001 &&
        Math.abs(report.location.lng - userLocation.lng) < 0.0001;

      if (isUserLocation) {
        return; // Skip rendering report marker at user location
      }

      const marker = new window.google.maps.Marker({
        position: report.location,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: severityColor[report.severity] || severityColor.low,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        title: `Báo cáo: ${report.type || report.detail || 'N/A'}`,
        zIndex: 3,
      });

      marker.addListener('click', () => onMarkerClick(report));
      markersRef.current.push(marker);
    });
  }, [reports, onMarkerClick, userLocation]);

  // Render SOS markers with "SOS" label
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Cleanup previous SOS markers and circles
    sosMarkersRef.current.forEach((item) => {
      if (item.marker && item.marker.setMap) {
        item.marker.setMap(null);
      }
      if (item.circle && item.circle.setMap) {
        item.circle.setMap(null);
      }
    });
    sosMarkersRef.current = [];

    // Filter out RESOLVED/SOLVED SOS - only render active/RAISED SOS
    const activeSOS = (nearbySOS || []).filter((sos) => {
      const status = sos.Status || sos.status || "";
      return status !== "SOLVED" && status !== "RESOLVED";
    });

    activeSOS.forEach((sos) => {
      if (!sos.location || !sos.location.lat || !sos.location.lng) return;

      // Skip if SOS location is same as user location
      const isUserLocation = userLocation &&
        Math.abs(sos.location.lat - userLocation.lat) < 0.0001 &&
        Math.abs(sos.location.lng - userLocation.lng) < 0.0001;

      if (isUserLocation) {
        return; // Skip rendering SOS marker at user location
      }

      // Create custom icon with "SOS" text
      const sosIcon = createLabeledMarker('SOS', '#ef4444', 12);

      const marker = new window.google.maps.Marker({
        position: sos.location,
        map: mapInstanceRef.current,
        icon: sosIcon,
        title: `SOS: ${sos.body || sos.message || 'Cần cứu hộ khẩn cấp'}`,
        zIndex: 5, // Higher z-index than reports to show on top
        animation: window.google.maps.Animation.DROP,
      });

      // Add pulsing circle effect for SOS
      const sosCircle = new window.google.maps.Circle({
        strokeColor: '#ef4444',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        map: mapInstanceRef.current,
        center: sos.location,
        radius: 100, // 100 meters radius
      });

      // Add click listener for SOS marker
      if (onSOSMarkerClick) {
        marker.addListener("click", () => {
          onSOSMarkerClick(sos);
        });
      }

      sosMarkersRef.current.push({ marker, circle: sosCircle });
    });
  }, [nearbySOS, userLocation, onSOSMarkerClick]);

  // Focus on highlighted report
  useEffect(() => {
    if (!mapInstanceRef.current || !highlightedReport) return;
    mapInstanceRef.current.panTo(highlightedReport.location);
    if (mapInstanceRef.current.getZoom() < 15) {
      mapInstanceRef.current.setZoom(15);
    }
  }, [highlightedReport]);

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-3xl overflow-hidden h-full">
      <div ref={mapRef} className="w-full h-[650px]" />
      <div className="p-4 bg-slate-950/70 border-t border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-slate-400">
            Nhấn vào điểm trên bản đồ để mở báo cáo chi tiết • Nhấn vào vùng rủi ro để xem chi tiết
            {zonesLoading && <span className="ml-2">• Đang tải vùng rủi ro...</span>}
          </p>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
              <span>Vị trí của bạn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white opacity-70"></div>
              <span>Vùng rủi ro: Cao</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white opacity-70"></div>
              <span>Vùng rủi ro: Trung bình</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white opacity-70"></div>
              <span>Vùng rủi ro: Thấp</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 rounded bg-red-500 border-2 border-white flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">SOS</span>
              </div>
              <span>SOS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Báo cáo: Cao</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>Báo cáo: Trung bình</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>Báo cáo: Thấp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
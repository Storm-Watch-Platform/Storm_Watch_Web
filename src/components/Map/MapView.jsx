import React, { useEffect, useRef } from 'react';

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
  onMarkerClick,
  highlightedReport,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const centerMarkerRef = useRef(null);
  const userLocationMarkerRef = useRef(null);

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

  // Draw 5km circle + center marker
  useEffect(() => {
    if (!mapInstanceRef.current || !centerLocation || !window.google) return;
    const map = mapInstanceRef.current;

    map.panTo(centerLocation);
    if (map.getZoom() < 13) {
      map.setZoom(13);
    }

    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    circleRef.current = new window.google.maps.Circle({
      strokeColor: '#3b82f6',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      map,
      center: centerLocation,
      radius: 10000, // 10km radius
    });

    if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null);
    }

    // Only show center marker if it's different from user location
    const isUserAtCenter = userLocation &&
      Math.abs(centerLocation.lat - userLocation.lat) < 0.0001 &&
      Math.abs(centerLocation.lng - userLocation.lng) < 0.0001;

    if (!isUserAtCenter) {
      centerMarkerRef.current = new window.google.maps.Marker({
        position: centerLocation,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3b82f6',
          fillOpacity: 0.7,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        title: 'Tâm vùng tìm kiếm',
        zIndex: 2,
      });
    } else {
      // Remove center marker if user is at center
      if (centerMarkerRef.current) {
        centerMarkerRef.current.setMap(null);
        centerMarkerRef.current = null;
      }
    }
  }, [centerLocation, userLocation]);

  // Render user location marker (with special pin icon)
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !window.google) {
      // Remove user marker if no location
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setMap(null);
        userLocationMarkerRef.current = null;
      }
      return;
    }

    // Remove old user marker
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null);
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
            Nhấn vào điểm trên bản đồ để mở báo cáo chi tiết • Vùng hiển thị bán kính 10km
          </p>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
              <span>Vị trí của bạn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white opacity-70"></div>
              <span>Tâm vùng tìm kiếm</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Cao</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>Trung bình</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>Thấp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
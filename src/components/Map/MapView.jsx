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
  reports,
  onMarkerClick,
  highlightedReport,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const centerMarkerRef = useRef(null);

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
      radius: 5000,
    });

    if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null);
    }

    centerMarkerRef.current = new window.google.maps.Marker({
      position: centerLocation,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
      title: 'Tâm vùng tìm kiếm',
    });
  }, [centerLocation]);

  // Render report markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    (reports || []).forEach((report) => {
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
      });

      marker.addListener('click', () => onMarkerClick(report));
      markersRef.current.push(marker);
    });
  }, [reports, onMarkerClick]);

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
        <p className="text-sm text-slate-400">
          Nhấn vào điểm trên bản đồ để mở báo cáo chi tiết • Vùng hiển thị bán kính 5km
        </p>
      </div>
    </div>
  );
}
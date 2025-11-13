import React, { useEffect, useRef } from 'react';

export default function MapView({ 
  dangerZones, 
  reports, 
  onReportClick,
  mapLoaded,
  regionBounds
}) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);

  const initMap = () => {
    if (!window.google || !mapRef.current) return;
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 10.8, lng: 106.68 },
      zoom: 13,
      styles: [
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#a2daf2" }]
        }
      ]
    });

    googleMapRef.current = map;
    const infoWindow = new window.google.maps.InfoWindow();

    // Add danger zones
    dangerZones.forEach(zone => {
      const color = zone.riskLevel === 'high' ? '#ef4444' : 
                    zone.riskLevel === 'medium' ? '#f97316' : '#fbbf24';
      
      const polygon = new window.google.maps.Polygon({
        paths: zone.coordinates,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.35,
        map: map
      });

      polygon.addListener('click', (e) => {
        infoWindow.setContent(`
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${zone.name}</h3>
            <p style="margin: 2px 0;">Mức độ: <span style="color: ${color}; font-weight: bold;">${zone.riskLevel.toUpperCase()}</span></p>
            <p style="margin: 2px 0;">Risk Score: ${zone.score}/10</p>
            <p style="margin: 2px 0;">Báo cáo: ${zone.reportCount}</p>
          </div>
        `);
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
      });
    });

    // Add report markers
    reports.forEach(report => {
      const marker = new window.google.maps.Marker({
        position: report.location,
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: report.severity === 'high' ? '#ef4444' : 
                     report.severity === 'medium' ? '#f97316' : '#fbbf24',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        }
      });

      marker.addListener('click', () => {
        onReportClick(report);
      });
    });
  };

  useEffect(() => {
    if (mapLoaded && mapRef.current && !googleMapRef.current && window.google) {
      initMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, dangerZones, reports]);

  // Handle region change - zoom to region
  useEffect(() => {
    if (googleMapRef.current && regionBounds) {
      const map = googleMapRef.current;
      
      if (regionBounds.zoom) {
        // Simple region with coordinates and zoom
        map.setCenter(regionBounds.coordinates);
        map.setZoom(regionBounds.zoom);
      } else if (regionBounds.bounds) {
        // Region with bounds
        const bounds = new window.google.maps.LatLngBounds(
          { lat: regionBounds.bounds.south, lng: regionBounds.bounds.west },
          { lat: regionBounds.bounds.north, lng: regionBounds.bounds.east }
        );
        map.fitBounds(bounds);
      }
    }
  }, [regionBounds]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      <div ref={mapRef} className="w-full h-[600px]"></div>
      <div className="p-4 bg-slate-900/50 border-t border-slate-700">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-slate-300">Nguy hiểm cao</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-slate-300">Trung bình</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-slate-300">Thấp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
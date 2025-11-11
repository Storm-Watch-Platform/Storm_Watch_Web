import React, { useEffect, useRef, useCallback } from 'react';

export default function MapView({ 
  dangerZones, 
  reports, 
  onReportClick,
  mapLoaded 
}) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const polygonsRef = useRef([]);
  const markersRef = useRef([]);

  // Initialize map only once when mapLoaded becomes true
  useEffect(() => {
    if (mapLoaded && mapRef.current && !googleMapRef.current) {
      initMap();
    }
  }, [mapLoaded]);

  const clearMapObjects = useCallback(() => {
    // Remove all polygons
    polygonsRef.current.forEach(polygon => {
      polygon.setMap(null);
    });
    polygonsRef.current = [];

    // Remove all markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Close infoWindow
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  }, []);

  const addDangerZones = useCallback(() => {
    const map = googleMapRef.current;
    const infoWindow = infoWindowRef.current;

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

      polygonsRef.current.push(polygon);

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
  }, [dangerZones]);

  const addReportMarkers = useCallback(() => {
    const map = googleMapRef.current;

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

      markersRef.current.push(marker);

      marker.addListener('click', () => {
        onReportClick(report);
      });
    });
  }, [reports, onReportClick]);

  // Update markers and polygons when data changes
  useEffect(() => {
    if (googleMapRef.current) {
      clearMapObjects();
      addDangerZones();
      addReportMarkers();
    }
  }, [clearMapObjects, addDangerZones, addReportMarkers]);

  const initMap = () => {
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
    
    // Initialize a shared infoWindow for polygons
    infoWindowRef.current = new window.google.maps.InfoWindow();
  };

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
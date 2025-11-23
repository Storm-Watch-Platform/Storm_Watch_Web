import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { MapPin, Loader } from 'lucide-react';
import { getZonesByBounds } from '../../services/api';

const mapStyles = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
];

// Status colors for family members
const statusColors = {
  safe: '#10b981',    // Green
  warning: '#f59e0b', // Yellow/Orange
  danger: '#ef4444',  // Red
  unknown: '#6b7280', // Gray
};

const statusLabels = {
  safe: 'An toàn',
  warning: 'Cảnh báo',
  danger: 'Nguy hiểm',
  unknown: 'Không xác định',
};

export default function FamilyMapView({ 
  mapLoaded, 
  members = [], 
  currentUserId,
  onMemberClick 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const zonesRef = useRef([]); // Store zone circles
  const infoWindowRef = useRef(null);
  const boundsChangeTimeoutRef = useRef(null);
  const [zonesLoading, setZonesLoading] = useState(false);

  // Calculate center of all members
  const centerLocation = useMemo(() => {
    if (!members || members.length === 0) {
      return { lat: 16.4637, lng: 107.5909 }; // Default: Huế
    }

    const membersWithLocation = members.filter(
      (m) => m.location && m.location.lat && m.location.lng
    );

    if (membersWithLocation.length === 0) {
      return { lat: 16.4637, lng: 107.5909 };
    }

    // Calculate average center
    const sum = membersWithLocation.reduce(
      (acc, m) => ({
        lat: acc.lat + m.location.lat,
        lng: acc.lng + m.location.lng,
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / membersWithLocation.length,
      lng: sum.lng / membersWithLocation.length,
    };
  }, [members]);

  // Initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstanceRef.current && window.google) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: centerLocation,
        zoom: members.length > 1 ? 12 : 15,
        styles: mapStyles,
        disableDefaultUI: false,
      });

      // Add bounds_changed listener to fetch zones when map view changes
      const boundsChangedListener = mapInstanceRef.current.addListener('bounds_changed', () => {
        // Debounce: wait 500ms after user stops panning/zooming
        if (boundsChangeTimeoutRef.current) {
          clearTimeout(boundsChangeTimeoutRef.current);
        }

        boundsChangeTimeoutRef.current = setTimeout(() => {
          if (!mapInstanceRef.current) return;

          const bounds = mapInstanceRef.current.getBounds();
          if (!bounds) return;

          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();

          const boundsParams = {
            minLat: sw.lat(),
            minLon: sw.lng(),
            maxLat: ne.lat(),
            maxLon: ne.lng(),
          };

          console.log('🗺️ [FamilyMapView] Map bounds changed:', boundsParams);
          fetchZonesForBounds(boundsParams);
        }, 500); // 500ms debounce
      });

      // Initial fetch when map is ready
      setTimeout(() => {
        if (mapInstanceRef.current) {
          const bounds = mapInstanceRef.current.getBounds();
          if (bounds) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            fetchZonesForBounds({
              minLat: sw.lat(),
              minLon: sw.lng(),
              maxLat: ne.lat(),
              maxLon: ne.lng(),
            });
          }
        }
      }, 1000);

      // Cleanup listener
      return () => {
        if (boundsChangedListener) {
          window.google.maps.event.removeListener(boundsChangedListener);
        }
        if (boundsChangeTimeoutRef.current) {
          clearTimeout(boundsChangeTimeoutRef.current);
        }
      };
    }
  }, [mapLoaded, centerLocation, members.length]);

  /**
   * Calculate distance between two coordinates in meters using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lng1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lng2 - Longitude of second point
   * @returns {number} Distance in meters
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
   * @param {Array} zones - Array of zone objects
   * @returns {Array} Filtered array of zones
   */
  const filterOverlappingZones = useCallback((zones) => {
    if (!zones || zones.length === 0) return [];

    // Filter out zones without valid center
    const validZones = zones.filter(
      (z) => z.center && z.center.lat && z.center.lng
    );

    if (validZones.length === 0) return [];

    // Sort zones by riskScore (descending) and radius (descending) to prioritize high-risk, large zones
    const sortedZones = [...validZones].sort((a, b) => {
      const riskScoreA = parseFloat(a.riskScore) || 0;
      const riskScoreB = parseFloat(b.riskScore) || 0;
      
      if (Math.abs(riskScoreA - riskScoreB) > 0.01) {
        return riskScoreB - riskScoreA; // Higher riskScore first
      }
      
      // If riskScore is similar, prefer larger radius
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

      // Check if this zone overlaps with any already filtered zone
      let isOverlapping = false;
      for (const filteredZone of filteredZones) {
        const filteredRadius = filteredZone.radius || 500;
        const filteredLat = filteredZone.center.lat;
        const filteredLng = filteredZone.center.lng;

        // Calculate distance between centers
        const distance = calculateDistance(
          currentLat,
          currentLng,
          filteredLat,
          filteredLng
        );

        // Consider zones overlapping if distance < 70% of the sum of their radii
        // This threshold can be adjusted (0.7 = 70% overlap threshold)
        const overlapThreshold = 0.7;
        const maxDistance = (currentRadius + filteredRadius) * overlapThreshold;

        if (distance < maxDistance) {
          isOverlapping = true;
          break;
        }
      }

      // If not overlapping with any filtered zone, add it
      if (!isOverlapping) {
        filteredZones.push(currentZone);
      }

      processedIndices.add(i);
    }

    console.log(
      `🔍 [FamilyMapView] Filtered ${validZones.length} zones → ${filteredZones.length} zones (removed ${validZones.length - filteredZones.length} overlapping)`
    );

    return filteredZones;
  }, [calculateDistance]);

  // Fetch zones for current map bounds
  const fetchZonesForBounds = useCallback(async (bounds) => {
    if (!mapInstanceRef.current || !window.google) return;

    setZonesLoading(true);
    try {
      const zones = await getZonesByBounds(bounds);
      console.log('✅ [FamilyMapView] Zones fetched:', zones.length);

      // Filter overlapping zones before rendering
      const filteredZones = filterOverlappingZones(zones);
      console.log('✅ [FamilyMapView] Zones after filtering:', filteredZones.length);

      // Clear previous zones
      zonesRef.current.forEach((zoneCircle) => {
        if (zoneCircle && zoneCircle.setMap) {
          zoneCircle.setMap(null);
        }
      });
      zonesRef.current = [];

      // Render filtered zones as circles on map
      filteredZones.forEach((zone) => {
        if (!zone.center || !zone.center.lat || !zone.center.lng) return;

        // Determine color based on riskScore (priority) or label (fallback)
        // ⚠️ QUAN TRỌNG: Ưu tiên riskScore vì nó chính xác hơn label
        let fillColor = '#3b82f6'; // Default blue
        let strokeColor = '#2563eb';
        let fillOpacity = 0.15;
        let strokeOpacity = 0.6;

        // Priority 1: Use riskScore if available (more accurate)
        // Parse riskScore to number in case it's a string
        const riskScore = zone.riskScore !== undefined && zone.riskScore !== null 
          ? parseFloat(zone.riskScore) 
          : null;

        if (riskScore !== null && !isNaN(riskScore)) {
          // Use riskScore to determine color (0-1.0 scale)
          // riskScore >= 0.7: Red (High risk)
          // riskScore >= 0.4: Orange (Medium risk)
          // riskScore < 0.4: Green (Low risk)
          if (riskScore >= 0.7) {
            fillColor = '#ef4444'; // Red - High risk
            strokeColor = '#dc2626';
            fillOpacity = 0.2;
          } else if (riskScore >= 0.4) {
            fillColor = '#f59e0b'; // Orange - Medium risk
            strokeColor = '#d97706';
            fillOpacity = 0.18;
          } else {
            fillColor = '#10b981'; // Green - Low risk (riskScore < 0.4)
            strokeColor = '#059669';
            fillOpacity = 0.12;
          }
          
          console.log(`🎨 [FamilyMapView] Zone ${zone.id}: riskScore=${riskScore}/1.0 → color=${fillColor}`);
        } else if (zone.label) {
          // Priority 2: Fallback to label if riskScore not available
          const label = zone.label.toUpperCase();
          if (label === 'HIGH' || label === 'DANGER') {
            fillColor = '#ef4444'; // Red
            strokeColor = '#dc2626';
            fillOpacity = 0.2;
          } else if (label === 'MEDIUM' || label === 'WARNING') {
            fillColor = '#f59e0b'; // Orange/Yellow
            strokeColor = '#d97706';
            fillOpacity = 0.18;
          } else if (label === 'LOW' || label === 'SAFE') {
            fillColor = '#10b981'; // Green
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
          radius: (zone.radius || 500) * 1, // Convert to meters (radius is in meters)
          zIndex: 1, // Below markers
        });

        // Add click listener to show zone info
        // Store riskScore in closure for info window
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

          // Close previous info window
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
          infoWindowRef.current = infoWindow;
          infoWindow.open(mapInstanceRef.current);
        });

        zonesRef.current.push(circle);
      });
    } catch (error) {
      console.error('❌ [FamilyMapView] Error fetching zones:', error);
    } finally {
      setZonesLoading(false);
    }
  }, [filterOverlappingZones]);

  // Update map center when members change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    const membersWithLocation = members.filter(
      (m) => m.location && m.location.lat && m.location.lng
    );

    if (membersWithLocation.length > 0) {
      // Calculate bounds to fit all members
      const bounds = new window.google.maps.LatLngBounds();
      membersWithLocation.forEach((m) => {
        bounds.extend(new window.google.maps.LatLng(m.location.lat, m.location.lng));
      });

      mapInstanceRef.current.fitBounds(bounds);
      
      // Don't zoom in too much if only one member
      if (membersWithLocation.length === 1) {
        mapInstanceRef.current.setZoom(15);
      }
    } else {
      mapInstanceRef.current.setCenter(centerLocation);
      mapInstanceRef.current.setZoom(12);
    }
  }, [members, centerLocation]);

  // Helper function to create marker icon using ui-avatars
  const createMemberMarkerIcon = (member, isCurrentUser = false) => {
    const status = member.status || 'unknown';
    const color = statusColors[status] || statusColors.unknown;
    const name = member.name || 'Thành viên';
    
    // Remove # from color for URL
    const colorHex = color.replace('#', '');
    
    // Create ui-avatars URL
    // Format: https://ui-avatars.com/api/?name=Name&size=64&background=color&color=fff&bold=true
    const avatarSize = 64;
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${avatarSize}&background=${colorHex}&color=fff&bold=true&font-size=0.5`;
    
    // Create canvas to add border and pin shape
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const markerSize = 80;
    const pinHeight = 20;
    const totalHeight = markerSize + pinHeight;
    
    canvas.width = markerSize;
    canvas.height = totalHeight;

    // Draw pin shape at bottom
    context.beginPath();
    context.moveTo(markerSize / 2, markerSize);
    context.lineTo(markerSize / 2 - 12, markerSize + pinHeight - 8);
    context.lineTo(markerSize / 2, markerSize + pinHeight - 12);
    context.lineTo(markerSize / 2 + 12, markerSize + pinHeight - 8);
    context.closePath();
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    context.stroke();

    // Load avatar image and draw it
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Draw avatar circle with border
        const centerX = markerSize / 2;
        const centerY = markerSize / 2;
        const radius = markerSize / 2 - 4;

        // Draw shadow
        context.beginPath();
        context.arc(centerX, centerY + 2, radius + 2, 0, 2 * Math.PI);
        context.fillStyle = 'rgba(0, 0, 0, 0.2)';
        context.fill();

        // Draw border based on status
        const borderWidth = isCurrentUser ? 5 : 3;
        const borderColor = isCurrentUser ? '#10b981' : '#fff';
        
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        context.strokeStyle = borderColor;
        context.lineWidth = borderWidth;
        context.stroke();

        // Clip to circle and draw avatar
        context.save();
        context.beginPath();
        context.arc(centerX, centerY, radius - borderWidth / 2, 0, 2 * Math.PI);
        context.clip();
        context.drawImage(img, 4, 4, markerSize - 8, markerSize - 8);
        context.restore();

        // Add status indicator dot
        const dotSize = 8;
        const dotX = centerX + radius - dotSize;
        const dotY = centerY - radius + dotSize;
        context.beginPath();
        context.arc(dotX, dotY, dotSize, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
        context.strokeStyle = '#fff';
        context.lineWidth = 2;
        context.stroke();

        resolve({
          url: canvas.toDataURL(),
          scaledSize: new window.google.maps.Size(markerSize, totalHeight),
          anchor: new window.google.maps.Point(markerSize / 2, totalHeight),
        });
      };
      
      img.onerror = () => {
        // Fallback: create simple colored circle if avatar fails to load
        context.beginPath();
        context.arc(markerSize / 2, markerSize / 2, markerSize / 2 - 4, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
        context.strokeStyle = isCurrentUser ? '#10b981' : '#fff';
        context.lineWidth = isCurrentUser ? 5 : 3;
        context.stroke();
        
        // Draw first letter of name
        context.fillStyle = '#fff';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name.charAt(0).toUpperCase(), markerSize / 2, markerSize / 2);
        
        resolve({
          url: canvas.toDataURL(),
          scaledSize: new window.google.maps.Size(markerSize, totalHeight),
          anchor: new window.google.maps.Point(markerSize / 2, totalHeight),
        });
      };
      
      img.src = avatarUrl;
    });
  };

  // Render member markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear previous markers
    markersRef.current.forEach((item) => {
      if (item.marker) item.marker.setMap(null);
      if (item.infoWindow) item.infoWindow.close();
    });
    markersRef.current = [];

    // Filter members with valid location
    const membersWithLocation = members.filter(
      (m) => m.location && m.location.lat && m.location.lng
    );

    // Create markers asynchronously
    const createMarkers = async () => {
      for (const member of membersWithLocation) {
        const isCurrentUser = member.id === currentUserId;
        const status = member.status || 'unknown';
        const color = statusColors[status] || statusColors.unknown;

        try {
          // Create marker icon with ui-avatars
          const icon = await createMemberMarkerIcon(member, isCurrentUser);

          // Create marker
          const marker = new window.google.maps.Marker({
            position: {
              lat: member.location.lat,
              lng: member.location.lng,
            },
            map: mapInstanceRef.current,
            icon: icon,
            title: `${member.name} - ${statusLabels[status]}`,
            zIndex: isCurrentUser ? 1000 : 100,
            animation: window.google.maps.Animation.DROP,
          });

          // Create info window with avatar
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'Thành viên')}&size=64&background=${color.replace('#', '')}&color=fff&bold=true`;
          const infoContent = `
            <div style="padding: 12px; min-width: 220px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <img src="${avatarUrl}" alt="${member.name}" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid ${color};" />
                <div>
                  <h3 style="margin: 0; font-weight: bold; color: #1e40af; font-size: 16px;">
                    ${member.name || 'Thành viên'}
                    ${isCurrentUser ? '<span style="color: #10b981; font-size: 12px;">(Bạn)</span>' : ''}
                  </h3>
                  <div style="font-size: 12px; color: ${color}; margin-top: 4px;">
                    ${statusLabels[status]}
                  </div>
                </div>
              </div>
              <div style="font-size: 12px; color: #4b5563; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                ${member.phone ? `<div style="margin-bottom: 4px;"><strong>Điện thoại:</strong> ${member.phone}</div>` : ''}
                ${member.role === 'owner' ? '<div style="margin-bottom: 4px;"><strong>Vai trò:</strong> Chủ nhóm</div>' : ''}
                <div style="margin-top: 8px; font-size: 11px; color: #6b7280;">
                  ${member.location.lat.toFixed(6)}, ${member.location.lng.toFixed(6)}
                </div>
              </div>
            </div>
          `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: infoContent,
          });

          // Add click listener
          marker.addListener('click', () => {
            // Close previous info window
            if (infoWindowRef.current) {
              infoWindowRef.current.close();
            }
            infoWindowRef.current = infoWindow;
            infoWindow.open(mapInstanceRef.current, marker);
            
            // Call onMemberClick if provided
            if (onMemberClick) {
              onMemberClick(member);
            }
          });

          markersRef.current.push({ marker, infoWindow, member });
        } catch (error) {
          console.error(`Error creating marker for ${member.name}:`, error);
        }
      }
    };

    createMarkers();

    // Cleanup
    return () => {
      markersRef.current.forEach((item) => {
        if (item.marker) item.marker.setMap(null);
        if (item.infoWindow) item.infoWindow.close();
      });
    };
  }, [members, currentUserId, onMemberClick]);

  const membersWithLocation = members.filter(
    (m) => m.location && m.location.lat && m.location.lng
  );

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-3xl overflow-hidden h-full relative">
      {/* Loading indicator for zones */}
      {zonesLoading && (
        <div className="absolute top-4 right-4 z-10 bg-blue-600/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Đang tải vùng rủi ro...</span>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-[600px]" />
      <div className="p-4 bg-slate-950/70 border-t border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-slate-400">
            {membersWithLocation.length > 0
              ? `Hiển thị ${membersWithLocation.length} thành viên trên bản đồ`
              : 'Không có thành viên nào có vị trí'}
            {zonesRef.current.length > 0 && (
              <span className="ml-2">• {zonesRef.current.length} vùng rủi ro</span>
            )}
          </p>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
              <span>An toàn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white"></div>
              <span>Cảnh báo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
              <span>Nguy hiểm</span>
            </div>
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-600">
              <div className="w-4 h-4 rounded-full bg-blue-500/30 border border-blue-400"></div>
              <span>Vùng rủi ro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


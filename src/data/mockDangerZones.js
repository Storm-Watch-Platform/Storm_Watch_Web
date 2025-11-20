// Mock Danger Zones Data
export const mockDangerZones = [
  {
    id: 1,
    name: 'Khu vực Phú Nhuận',
    center: { lat: 10.7971, lng: 106.6768 },
    radius: 5000,
    riskLevel: 'high',
    score: 8.5,
    reportCount: 23,
    lastUpdated: new Date().toISOString(),
    coordinates: [
      { lat: 10.7971, lng: 106.6768 },
      { lat: 10.7971, lng: 106.6868 },
      { lat: 10.7871, lng: 106.6868 },
      { lat: 10.7871, lng: 106.6768 },
    ],
  },
  {
    id: 2,
    name: 'Khu vực Bình Thạnh',
    center: { lat: 10.8071, lng: 106.6968 },
    radius: 5000,
    riskLevel: 'medium',
    score: 5.2,
    reportCount: 12,
    lastUpdated: new Date().toISOString(),
    coordinates: [
      { lat: 10.8071, lng: 106.6968 },
      { lat: 10.8071, lng: 106.7068 },
      { lat: 10.7971, lng: 106.7068 },
      { lat: 10.7971, lng: 106.6968 },
    ],
  },
  {
    id: 3,
    name: 'Khu vực Gò Vấp',
    center: { lat: 10.8171, lng: 106.6668 },
    radius: 5000,
    riskLevel: 'low',
    score: 2.8,
    reportCount: 5,
    lastUpdated: new Date().toISOString(),
    coordinates: [
      { lat: 10.8171, lng: 106.6668 },
      { lat: 10.8171, lng: 106.6768 },
      { lat: 10.8071, lng: 106.6768 },
      { lat: 10.8071, lng: 106.6668 },
    ],
  },
];

export function getDangerZonesNearby(lat, lng, radius = 5000) {
  // Filter zones within radius
  return mockDangerZones.filter((zone) => {
    const distance = calculateDistance(lat, lng, zone.center.lat, zone.center.lng);
    return distance <= radius / 1000; // Convert to km
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
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


// API Service for Storm Watch Backend
import { REGION_PRESETS } from '../data/regionMockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Query zone by coordinates - Get 5km radius zone and related reports
 * @param {Object} coordinates - { lat: number, lng: number }
 * @returns {Promise<Object>} Zone data with reports
 */
export async function queryZoneByCoordinates(coordinates) {
  try {
    const response = await fetch(`${API_BASE_URL}/zones/query?lat=${coordinates.lat}&lng=${coordinates.lng}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error querying zone:', error);
    // Return mock data for development
    return getMockZoneData(coordinates);
  }
}

/**
 * Mock data for development when backend is not available
 */
function getMockZoneData(coordinates) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockReports = generateMockReportsForLocation(coordinates, 5);
      const severityScore =
        mockReports.reduce((acc, report) => {
          if (report.severity === 'high') return acc + 2;
          if (report.severity === 'medium') return acc + 1;
          return acc + 0.5;
        }, 0) / Math.max(mockReports.length, 1);

      resolve({
        zone: {
          center: coordinates,
          radius: 5,
          riskLevel: severityScore > 1.2 ? 'high' : severityScore > 0.8 ? 'medium' : 'low',
          score: Math.min(10, Math.round(severityScore * 6)),
          reportCount: mockReports.length,
          lastUpdated: new Date().toISOString(),
        },
        reports: mockReports,
      });
    }, 500);
  });
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findClosestRegion(center) {
  let nearest = null;
  let minDistance = Infinity;

  REGION_PRESETS.forEach((region) => {
    const distance = calculateDistanceKm(
      center.lat,
      center.lng,
      region.center.lat,
      region.center.lng,
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { region, distance };
    }
  });

  return nearest && nearest.distance <= 120 ? nearest.region : null;
}

function generateMockReportsForLocation(center, radiusKm) {
  const now = Date.now();
  const region = findClosestRegion(center);

  if (region) {
    const regionalReports = region.reports
      .filter((report) => calculateDistanceKm(center.lat, center.lng, report.location.lat, report.location.lng) <= radiusKm)
      .map((report, index) => ({
        id: report.id || `${region.id}_${index}`,
        userId: report.userId || `user_${region.id}_${index}`,
        userName: report.userName,
        location: report.location,
        address: report.address,
        severity: report.severity,
        description: report.description,
        images: report.images || [`https://picsum.photos/400/300?random=${region.id}_${index}`],
        timestamp: new Date(now - (report.hoursAgo || index + 1) * 3600 * 1000).toISOString(),
        visibility: 'public',
        observers: report.observers ?? Math.floor(Math.random() * 20 + 5),
      }));

    if (regionalReports.length) {
      return regionalReports;
    }
  }

  // fallback random
  return generateRandomReports(center, radiusKm);
}

function generateRandomReports(center, radiusKm) {
  const reports = [];
  const count = Math.floor(Math.random() * 5) + 3;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;
    const latOffset = (distance * Math.cos(angle)) / 111;
    const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos((center.lat * Math.PI) / 180));
    const severity = Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low';

    reports.push({
      id: `rand_${Date.now()}_${i}`,
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      userName: `Người dân ${i + 1}`,
      location: {
        lat: center.lat + latOffset,
        lng: center.lng + lngOffset,
      },
      address: `Khu dân cư gần (${(center.lat + latOffset).toFixed(4)}, ${(center.lng + lngOffset).toFixed(4)})`,
      severity,
      description: `Khu vực xuất hiện ${severity === 'high' ? 'ngập sâu' : severity === 'medium' ? 'nước dâng' : 'mưa lớn'} cần theo dõi.`,
      images: [`https://picsum.photos/400/300?random=${Date.now() + i}`],
      timestamp: new Date(Date.now() - Math.random() * 6 * 3600 * 1000).toISOString(),
      visibility: 'public',
      observers: Math.floor(Math.random() * 20),
    });
  }

  return reports;
}

/**
 * Get all reports
 */
export async function getAllReports(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.region) params.append('region', filters.region);
    
    const response = await fetch(`${API_BASE_URL}/reports?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
}

/**
 * Get danger zones
 */
export async function getDangerZones() {
  try {
    const response = await fetch(`${API_BASE_URL}/danger-zones`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching danger zones:', error);
    throw error;
  }
}


// API Service for Storm Watch Backend

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
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate mock reports within 5km radius
      const mockReports = generateMockReportsInRadius(coordinates, 5);
      
      resolve({
        zone: {
          center: coordinates,
          radius: 5, // km
          riskLevel: mockReports.length > 10 ? 'high' : mockReports.length > 5 ? 'medium' : 'low',
          score: Math.min(10, (mockReports.length * 0.8).toFixed(1)),
          reportCount: mockReports.length,
          lastUpdated: new Date().toISOString(),
        },
        reports: mockReports,
      });
    }, 500);
  });
}

/**
 * Generate mock reports within radius
 */
function generateMockReportsInRadius(center, radiusKm) {
  const reports = [];
  const count = Math.floor(Math.random() * 15) + 3; // 3-18 reports
  
  for (let i = 0; i < count; i++) {
    // Generate random point within radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm; // km
    
    // Convert km to degrees (approximate: 1 degree ≈ 111 km)
    const latOffset = (distance * Math.cos(angle)) / 111;
    const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(center.lat * Math.PI / 180));
    
    const severity = Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low';
    
    reports.push({
      id: `report_${Date.now()}_${i}`,
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      userName: `Người dùng ${i + 1}`,
      location: {
        lat: center.lat + latOffset,
        lng: center.lng + lngOffset,
      },
      address: `Địa chỉ ${i + 1} trong vùng ${radiusKm}km`,
      severity: severity,
      description: `Báo cáo ${i + 1}: Tình hình trong vùng bán kính ${radiusKm}km`,
      images: [`https://picsum.photos/400/300?random=${Date.now() + i}`],
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
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


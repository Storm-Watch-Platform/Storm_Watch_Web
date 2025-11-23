// Report Service - Mock API
import { mockReports } from '../data/mockReports';
import { calculateDistanceKm } from '../utils/distance';
import { analyzeImageWithGemini, isGeminiAvailable } from './geminiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Get reports nearby a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in meters (default: 5000)
 * @returns {Promise<Array>} Array of reports
 */
export async function getReportsNearby(lat, lng, radius = 5000) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/reports/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching reports nearby:', error);
    // Return mock data
    return getMockReportsNearby(lat, lng, radius);
  }
}

/**
 * Get mock reports nearby
 */
function getMockReportsNearby(lat, lng, radius) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const radiusKm = radius / 1000;
      const filtered = mockReports.filter((report) => {
        if (!report.location) return false;
        const distance = calculateDistanceKm(
          lat,
          lng,
          report.location.lat,
          report.location.lng
        );
        return distance <= radiusKm;
      });
      resolve(filtered);
    }, 300);
  });
}

/**
 * Analyze image - Try Gemini API first, fallback to backend API
 * @param {File} file - Image file
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeImage(file) {
  // Try Gemini API first if available
  if (isGeminiAvailable()) {
    try {
      console.log('🔍 [ReportService] Using Gemini API for image analysis');
      return await analyzeImageWithGemini(file);
    } catch (error) {
      console.warn('⚠️ [ReportService] Gemini API failed, falling back to backend:', error);
      // Continue to backend fallback
    }
  } else {
    console.log('⚠️ [ReportService] Gemini API key not found, using backend API');
  }

  // Fallback to backend API
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/vision/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    // Return mock analysis as last resort
    return getMockImageAnalysis(file);
  }
}

/**
 * Get mock image analysis
 */
function getMockImageAnalysis(file) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock categories: flood, wind, landslide, other
      const categories = ['flood', 'wind', 'landslide', 'other'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      const mockDetections = [
        {
          label: randomCategory === 'flood' ? 'Nước ngập' : randomCategory === 'wind' ? 'Gió mạnh' : 'Sạt lở',
          confidence: 0.85 + Math.random() * 0.15,
          category: randomCategory,
        },
      ];

      resolve({
        detected: mockDetections,
        suggested_category: randomCategory,
        confidence: 0.85 + Math.random() * 0.15,
      });
    }, 1000);
  });
}

/**
 * Create a new report
 * @param {Object} payload - Report data
 * @returns {Promise<Object>} Created report
 */
export async function createReport(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error creating report:', error);
    // Return mock created report
    return getMockCreateReport(payload);
  }
}

/**
 * Get mock created report
 */
function getMockCreateReport(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newReport = {
        id: `report_${Date.now()}`,
        userId: payload.userId || 'user_123',
        userName: payload.userName || 'Người dùng',
        location: payload.location,
        address: payload.address || 'Đang xác định...',
        severity: payload.severity || 'medium',
        category: payload.category || 'other',
        description: payload.description || '',
        images: payload.images || [],
        timestamp: new Date().toISOString(),
        visibility: payload.visibility || 'public',
        observers: 0,
      };
      resolve(newReport);
    }, 500);
  });
}

/**
 * Get report by ID
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Report object
 */
export async function getReportById(reportId) {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
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
    console.error('Error fetching report:', error);
    // Return mock report
    return mockReports.find((r) => r.id === reportId) || null;
  }
}


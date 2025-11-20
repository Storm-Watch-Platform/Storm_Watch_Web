// Danger Zones Service - Mock API
import { mockDangerZones, getDangerZonesNearby as getMockDangerZonesNearby } from '../data/mockDangerZones';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Get danger zones nearby a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in meters (default: 5000)
 * @returns {Promise<Array>} Array of danger zones
 */
export async function getDangerZonesNearby(lat, lng, radius = 5000) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/danger-zones/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
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
    console.error('Error fetching danger zones nearby:', error);
    // Return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getMockDangerZonesNearby(lat, lng, radius));
      }, 300);
    });
  }
}

/**
 * Get all danger zones
 * @returns {Promise<Array>} Array of danger zones
 */
export async function getAllDangerZones() {
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
    console.error('Error fetching all danger zones:', error);
    // Return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDangerZones);
      }, 300);
    });
  }
}

/**
 * Get danger zone by ID
 * @param {string} zoneId - Zone ID
 * @returns {Promise<Object>} Danger zone object
 */
export async function getDangerZoneById(zoneId) {
  try {
    const response = await fetch(`${API_BASE_URL}/danger-zones/${zoneId}`, {
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
    console.error('Error fetching danger zone:', error);
    // Return mock data
    return mockDangerZones.find((z) => z.id === zoneId) || null;
  }
}


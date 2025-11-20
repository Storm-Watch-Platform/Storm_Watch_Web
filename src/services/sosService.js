// SOS Service - Mock API
import { mockSOSSignals, createSOSSignal, getSOSSignalsNearby } from '../data/mockSOS';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Send SOS signal
 * @param {Object} location - { lat: number, lng: number }
 * @param {string} message - Optional message
 * @returns {Promise<Object>} Created SOS signal
 */
export async function sendSOS(location, message = '') {
  try {
    const userId = localStorage.getItem('userId') || 'user_123';
    const response = await fetch(`${API_BASE_URL}/sos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        location,
        message,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error sending SOS:', error);
    // Return mock SOS signal
    const userId = localStorage.getItem('userId') || 'user_123';
    return createSOSSignal(userId, location, message);
  }
}

/**
 * Get SOS signals nearby
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in meters (default: 10000)
 * @returns {Promise<Array>} Array of SOS signals
 */
export async function getSOSNearby(lat, lng, radius = 10000) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sos/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
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
    console.error('Error fetching SOS nearby:', error);
    // Return mock data
    return getSOSSignalsNearby(lat, lng, radius);
  }
}

/**
 * Get all active SOS signals
 * @returns {Promise<Array>} Array of active SOS signals
 */
export async function getActiveSOS() {
  try {
    const response = await fetch(`${API_BASE_URL}/sos/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching active SOS:', error);

    // Prevent spam requests by adding a small delay
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockSOSSignals.filter((sos) => sos.status === 'active'));
      }, 500); // thêm delay để tránh spam
    });
  }
}


/**
 * Cancel SOS signal
 * @param {string} sosId - SOS ID
 * @returns {Promise<Object>} Updated SOS signal
 */
export async function cancelSOS(sosId) {
  try {
    const response = await fetch(`${API_BASE_URL}/sos/${sosId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error canceling SOS:', error);
    // Return mock updated SOS
    return new Promise((resolve) => {
      setTimeout(() => {
        const sos = mockSOSSignals.find((s) => s.id === sosId);
        if (sos) {
          sos.status = 'cancelled';
          resolve(sos);
        } else {
          resolve(null);
        }
      }, 300);
    });
  }
}


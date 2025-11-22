// SOS Service - STOMP WebSocket only
// Backend automatically saves SOS to DB when receiving STOMP alert
import { mockSOSSignals, getSOSSignalsNearby } from "../data/mockSOS";
import { sendAlert, isSTOMPConnected } from "./stompService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * Send SOS signal via STOMP WebSocket only
 * Backend will automatically save to DB when receiving STOMP alert
 * @param {Object} location - { lat: number, lng: number }
 * @param {string} message - Optional message
 * @returns {Promise<Object>} Created SOS signal object (simulated, actual data from backend via STOMP response)
 */
export async function sendSOS(location, message = "") {
  // Check if STOMP is connected
  if (!isSTOMPConnected()) {
    throw new Error(
      "WebSocket STOMP not connected. Please wait for connection or refresh the page."
    );
  }

  try {
    const userId =
      localStorage.getItem("userId") ||
      localStorage.getItem("userID") ||
      "user_123";

    // 🚀 Send SOS alert via STOMP only - Backend will save to DB automatically
    await sendAlert({
      body: message || "SOS - Cần cứu trợ khẩn cấp!",
      lat: location.lat,
      lon: location.lng,
      radius_m: 10000,
      ttl_min: 5,
    });

    console.log(
      "✅ [SOS] Alert sent via STOMP WebSocket - Backend will save to DB"
    );

    // Return simulated SOS object for immediate UI update
    // Backend will broadcast the actual saved SOS via STOMP if needed
    return {
      id: `sos_${Date.now()}`,
      userId: userId,
      location: location,
      address:
        location.address ||
        `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
      message: message || "SOS - Cần cứu trợ khẩn cấp!",
      status: "active",
      timestamp: new Date().toISOString(),
      // Note: This is a temporary object, actual data comes from backend via STOMP
    };
  } catch (error) {
    console.error("❌ [SOS] Error sending SOS via STOMP:", error);
    throw new Error(`Không thể gửi tín hiệu SOS: ${error.message}`);
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
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching SOS nearby:", error);
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
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching active SOS:", error);

    // Prevent spam requests by adding a small delay
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockSOSSignals.filter((sos) => sos.status === "active"));
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error canceling SOS:", error);
    // Return mock updated SOS
    return new Promise((resolve) => {
      setTimeout(() => {
        const sos = mockSOSSignals.find((s) => s.id === sosId);
        if (sos) {
          sos.status = "cancelled";
          resolve(sos);
        } else {
          resolve(null);
        }
      }, 300);
    });
  }
}

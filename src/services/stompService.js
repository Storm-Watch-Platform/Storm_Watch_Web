// STOMP WebSocket Service
// Based on the demo HTML file from backend team

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  "wss://stormwatchbackend-production.up.railway.app/ws";

// NULL byte for STOMP frame termination
const STOMP_NULL = String.fromCharCode(0);

let ws = null;
let isConnected = false;
let userId = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize WebSocket connection with STOMP protocol
 * @param {string} userID - User ID from authentication
 * @returns {Promise<boolean>} Connection success
 */
export function connectSTOMP(userID) {
  return new Promise((resolve, reject) => {
    if (ws && isConnected) {
      resolve(true);
      return;
    }

    userId = userID;
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("[STOMP] WebSocket connected, sending CONNECT frame...");

      // Send STOMP CONNECT frame
      const frame =
        "CONNECT\n" +
        "accept-version:1.2\n" +
        `user-id:${userID}\n\n` +
        STOMP_NULL;

      ws.send(frame);
      console.log("[STOMP] >>> SENT CONNECT");
      isConnected = true;
      reconnectAttempts = 0;
      resolve(true);
    };

    ws.onmessage = (event) => {
      const data = event.data;
      // Replace NULL bytes for logging
      const nullChar = String.fromCharCode(0);
      const logData = data.split(nullChar).join("<NUL>");
      console.log("[STOMP] <<< RECEIVED:", logData);

      // Handle STOMP CONNECTED frame
      if (data.startsWith("CONNECTED")) {
        console.log("[STOMP] ✅ Connected successfully");
        isConnected = true;
      }

      // Handle errors
      if (data.startsWith("ERROR")) {
        console.error("[STOMP] ❌ Error:", data);
        isConnected = false;
      }
    };

    ws.onerror = (error) => {
      console.error("[STOMP] WebSocket error:", error);
      isConnected = false;
      reject(error);
    };

    ws.onclose = () => {
      console.log("[STOMP] WebSocket closed");
      isConnected = false;
      ws = null;

      // Auto-reconnect logic
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && userId) {
        reconnectAttempts++;
        console.log(
          `[STOMP] Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
        );
        setTimeout(() => {
          connectSTOMP(userId).catch(console.error);
        }, 2000 * reconnectAttempts); // Exponential backoff
      }
    };
  });
}

/**
 * Disconnect WebSocket
 */
export function disconnectSTOMP() {
  if (ws) {
    ws.close();
    ws = null;
    isConnected = false;
    userId = null;
    reconnectAttempts = 0;
  }
}

/**
 * Send location update via STOMP
 * @param {Object} locationData - { lat, lon, accuracy, status }
 * @returns {Promise<boolean>} Send success
 */
export function sendLocation(locationData) {
  return new Promise((resolve, reject) => {
    if (!ws || !isConnected) {
      reject(new Error("WebSocket not connected"));
      return;
    }

    const { lat, lon, accuracy = 0, status = "UNKNOWN" } = locationData;

    const location = {
      Lat: lat,
      Lon: lon,
      AccuracyM: accuracy,
      Status: status,
      UpdatedAt: Date.now(),
    };

    const frame =
      "SEND\n" +
      "type:location\n" +
      "content-type:application/json\n\n" +
      JSON.stringify(location) +
      STOMP_NULL;

    try {
      ws.send(frame);
      console.log("[STOMP] >>> SENT Location:", location);
      resolve(true);
    } catch (error) {
      console.error("[STOMP] Error sending location:", error);
      reject(error);
    }
  });
}

/**
 * Send report via STOMP
 * @param {Object} reportData - Report data
 * @returns {Promise<boolean>} Send success
 */
export function sendReport(reportData) {
  return new Promise((resolve, reject) => {
    if (!ws || !isConnected) {
      reject(new Error("WebSocket not connected"));
      return;
    }

    const { type, detail, description, image, lat, lon } = reportData;

    // Validate required fields
    if (
      !type ||
      !detail ||
      !description ||
      lat === undefined ||
      lon === undefined
    ) {
      reject(new Error("Missing required report fields"));
      return;
    }

    const report = {
      type: type, // Category (e.g., "FLOOD", "FIRE", etc.)
      detail: detail, // Sub-category (e.g., "Mưa lớn", "Đường ngập nước")
      description: description, // Full description
      image: image || "", // Base64 encoded image
      lat: lat, // Latitude
      lon: lon, // Longitude
      timestamp: Date.now(), // Timestamp
    };

    const frame =
      "SEND\n" +
      "type:report\n" +
      "content-type:application/json\n\n" +
      JSON.stringify(report) +
      STOMP_NULL;

    try {
      ws.send(frame);
      console.log("[STOMP] >>> SENT Report:", report);
      resolve(true);
    } catch (error) {
      console.error("[STOMP] Error sending report:", error);
      reject(error);
    }
  });
}

/**
 * Subscribe to user updates
 * @param {string} targetUserId - User ID to subscribe to
 */
export function subscribeToUser(targetUserId) {
  if (!ws || !isConnected) {
    console.warn("[STOMP] Cannot subscribe: WebSocket not connected");
    return;
  }

  const frame = "SUBSCRIBE\n" + `target-user:${targetUserId}\n\n` + STOMP_NULL;

  ws.send(frame);
  console.log("[STOMP] >>> SENT SUBSCRIBE to:", targetUserId);
}

/**
 * Unsubscribe from user updates
 * @param {string} targetUserId - User ID to unsubscribe from
 */
export function unsubscribeFromUser(targetUserId) {
  if (!ws || !isConnected) {
    console.warn("[STOMP] Cannot unsubscribe: WebSocket not connected");
    return;
  }

  const frame =
    "UNSUBSCRIBE\n" + `target-user:${targetUserId}\n\n` + STOMP_NULL;

  ws.send(frame);
  console.log("[STOMP] >>> SENT UNSUBSCRIBE from:", targetUserId);
}

/**
 * Send emergency alert (SOS) via STOMP
 * @param {Object} alertData - { body, lat, lon, radius_m, ttl_min }
 * @returns {Promise<boolean>} Send success
 */
export function sendAlert(alertData) {
  return new Promise((resolve, reject) => {
    if (!ws || !isConnected) {
      reject(new Error("WebSocket not connected"));
      return;
    }

    const { body, lat, lon, radius_m = 10000, ttl_min = 5 } = alertData;

    if (!body || lat === undefined || lon === undefined) {
      reject(new Error("Missing required alert fields"));
      return;
    }

    const alert = {
      action: "raise",
      body: body,
      lat: lat,
      lon: lon,
      radius_m: radius_m,
      ttl_min: ttl_min,
    };

    const frame =
      "SEND\n" +
      "type:alert\n" +
      "content-type:application/json\n\n" +
      JSON.stringify(alert) +
      STOMP_NULL;

    try {
      ws.send(frame);
      console.log("[STOMP] >>> SENT Alert:", alert);
      resolve(true);
    } catch (error) {
      console.error("[STOMP] Error sending alert:", error);
      reject(error);
    }
  });
}

/**
 * Check if WebSocket is connected
 * @returns {boolean}
 */
export function isSTOMPConnected() {
  return isConnected && ws && ws.readyState === WebSocket.OPEN;
}

/**
 * Get current user ID
 * @returns {string|null}
 */
export function getCurrentUserId() {
  return userId;
}

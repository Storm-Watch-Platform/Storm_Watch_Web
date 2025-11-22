// STOMP WebSocket Service
// Based on the demo HTML file from backend team
import { getCurrentPosition as getCurrentPositionWithFake } from "../utils/fakeLocation";

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

// Location tracking variables
let locationWatchId = null;
let locationIntervalId = null;
let isLocationTrackingActive = false;
let autoStartLocationTracking = true; // Auto-start location tracking after connection

/**
 * Initialize WebSocket connection with STOMP protocol
 * @param {string} userID - User ID from authentication
 * @returns {Promise<boolean>} Connection success
 */
export function connectSTOMP(userID) {
  return new Promise((resolve, reject) => {
    // Get caller info for debugging
    const stack = new Error().stack;
    const caller = stack?.split("\n")[2]?.trim() || "unknown";
    console.log("[STOMP] connectSTOMP called with userID:", userID);
    console.log("[STOMP] Called from:", caller);
    console.log("[STOMP] Current state - ws:", ws, "isConnected:", isConnected);

    if (ws && isConnected) {
      console.log("[STOMP] Already connected, resolving immediately");
      resolve(true);
      return;
    }

    userId = userID;
    ws = new WebSocket(WS_URL);

    // Store resolve/reject to use in onmessage
    const connectionResolve = resolve;
    const connectionReject = reject;

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
      reconnectAttempts = 0;
      // Don't resolve yet - wait for CONNECTED frame
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
        console.log("[STOMP] Resolving promise...");
        isConnected = true;
        // Resolve promise only after receiving CONNECTED frame
        if (connectionResolve) {
          console.log("[STOMP] Calling connectionResolve...");
          try {
            connectionResolve(true);
            console.log("[STOMP] Promise resolved!");
          } catch (error) {
            console.error("[STOMP] Error in connectionResolve:", error);
          }
        } else {
          console.warn("[STOMP] ⚠️ connectionResolve is null!");
        }

        // Auto-start location tracking after successful connection
        if (autoStartLocationTracking && !isLocationTrackingActive) {
          console.log("[STOMP] 🚀 Auto-starting location tracking...");
          startLocationTracking({ interval: 5000 })
            .then(() => {
              console.log(
                "[STOMP] ✅ Auto-started location tracking successfully"
              );
            })
            .catch((error) => {
              console.error(
                "[STOMP] ❌ Failed to auto-start location tracking:",
                error
              );
            });
        }
      }

      // Handle errors
      if (data.startsWith("ERROR")) {
        console.error("[STOMP] ❌ Error:", data);
        isConnected = false;
        if (connectionReject) {
          connectionReject(new Error("STOMP connection error: " + data));
        }
      }
    };

    ws.onerror = (error) => {
      console.error("[STOMP] WebSocket error:", error);
      isConnected = false;
      connectionReject(error);
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
  // Stop location tracking before disconnecting
  stopLocationTracking();

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
      console.log(
        "📍 [STOMP LOCATION] >>> SENT Location Update:",
        `lat: ${lat}, lon: ${lon}, accuracy: ${accuracy}m, status: ${status}`
      );
      console.log("📍 [STOMP LOCATION] Full payload:", location);
      resolve(true);
    } catch (error) {
      console.error("❌ [STOMP LOCATION] Error sending location:", error);
      reject(error);
    }
  });
}

/**
 * Start continuous location tracking and sending
 * @param {Object} options - { interval: 5000, enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
 * @returns {Promise<boolean>} Start success
 */
export function startLocationTracking(options = {}) {
  return new Promise((resolve, reject) => {
    console.log("📍 [STOMP LOCATION] startLocationTracking called");
    console.log(
      "📍 [STOMP LOCATION] isLocationTrackingActive:",
      isLocationTrackingActive
    );
    console.log("📍 [STOMP LOCATION] ws:", ws);
    console.log("📍 [STOMP LOCATION] isConnected:", isConnected);

    if (isLocationTrackingActive) {
      console.log("📍 [STOMP LOCATION] Location tracking already active");
      resolve(true);
      return;
    }

    if (!ws || !isConnected) {
      const error = new Error("WebSocket not connected");
      console.error(
        "❌ [STOMP LOCATION] Cannot start tracking:",
        error.message
      );
      reject(error);
      return;
    }

    const {
      interval = 5000, // Send location every 5 seconds
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 0,
    } = options;

    console.log(
      `📍 [STOMP LOCATION] 🚀 Starting continuous location tracking (interval: ${interval}ms)`
    );

    // Use watchPosition for continuous updates
    if (navigator.geolocation) {
      // Set up interval to send location periodically
      // Use getCurrentPositionWithFake to support fake location for test accounts
      locationIntervalId = setInterval(() => {
        getCurrentPositionWithFake(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            sendLocation({
              lat: latitude,
              lon: longitude,
              accuracy: accuracy || 0,
              status: "ACTIVE",
            }).catch((error) => {
              console.error(
                "❌ [STOMP LOCATION] Failed to send interval location:",
                error
              );
            });
          },
          (error) => {
            console.error("❌ [STOMP LOCATION] Geolocation error:", error);
          },
          {
            enableHighAccuracy,
            timeout,
            maximumAge,
          }
        );
      }, interval);

      // Also use watchPosition for immediate updates when location changes significantly
      // Note: watchPosition doesn't support fake location wrapper, so use navigator.geolocation directly
      // For test accounts, interval will handle sending location
      if (navigator.geolocation.watchPosition) {
        locationWatchId = navigator.geolocation.watchPosition(
          () => {
            // Location is being tracked, will be sent via interval
            // This watchPosition helps get more frequent updates from GPS
          },
          (error) => {
            console.error(
              "❌ [STOMP LOCATION] Geolocation watch error:",
              error
            );
          },
          {
            enableHighAccuracy,
            timeout,
            maximumAge,
          }
        );
      }

      isLocationTrackingActive = true;
      console.log("✅ [STOMP LOCATION] Location tracking started successfully");
      resolve(true);
    } else {
      const error = new Error("Geolocation not supported");
      console.error("❌ [STOMP LOCATION]", error);
      reject(error);
    }
  });
}

/**
 * Stop continuous location tracking
 */
export function stopLocationTracking() {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
    console.log(
      "📍 [STOMP LOCATION] 🛑 Stopped location tracking (watchPosition cleared)"
    );
  }

  if (locationIntervalId !== null) {
    clearInterval(locationIntervalId);
    locationIntervalId = null;
    console.log(
      "📍 [STOMP LOCATION] 🛑 Stopped location tracking (interval cleared)"
    );
  }

  isLocationTrackingActive = false;
  console.log("✅ [STOMP LOCATION] Location tracking stopped completely");
}

/**
 * Check if location tracking is active
 * @returns {boolean}
 */
export function getLocationTrackingStatus() {
  return isLocationTrackingActive;
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
      console.log(
        "📝 [STOMP REPORT] >>> SENT Report:",
        `type: ${type}, detail: ${detail}, lat: ${lat}, lon: ${lon}`
      );
      console.log("📝 [STOMP REPORT] Full payload:", {
        ...report,
        image: image ? `[Base64 image, ${image.length} chars]` : "No image",
      });
      resolve(true);
    } catch (error) {
      console.error("❌ [STOMP REPORT] Error sending report:", error);
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
      console.log(
        "🚨 [STOMP SOS/ALERT] >>> SENT Emergency Alert:",
        `lat: ${lat}, lon: ${lon}, radius: ${radius_m}m, TTL: ${ttl_min}min`
      );
      console.log("🚨 [STOMP SOS/ALERT] Alert body:", body);
      console.log("🚨 [STOMP SOS/ALERT] Full payload:", alert);
      resolve(true);
    } catch (error) {
      console.error("❌ [STOMP SOS/ALERT] Error sending alert:", error);
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

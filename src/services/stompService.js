// STOMP WebSocket Service
// Based on the demo HTML file from backend team
import { getCurrentPosition as getCurrentPositionWithFake } from "../utils/fakeLocation";
import { analyzeWithAI } from "./api";

// Auto-detect WebSocket URL based on environment
// Local: ws:// (no SSL), Production: wss:// (with SSL)
const getWebSocketURL = () => {
  // If explicitly set in .env, use it
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // Auto-detect: if running on localhost, use ws://, otherwise use wss://
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "";

  if (isLocalhost) {
    // Local development - use ws:// (no SSL)
    return "ws://localhost:8080/ws";
  } else {
    // Production - use wss:// (with SSL)
    return "wss://stormwatchbackend-production.up.railway.app/ws";
  }
};

const WS_URL = getWebSocketURL();

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
    console.log(
      "[STOMP] 🔌 WebSocket URL:",
      WS_URL,
      `(${WS_URL.startsWith("wss://") ? "WSS - Secure" : "WS - Local"})`
    );

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
      
      // Log ALL received messages for debugging
      console.log("[STOMP] <<< RECEIVED RAW DATA:", logData.substring(0, 500)); // First 500 chars
      console.log("[STOMP] <<< RECEIVED DATA TYPE:", typeof data);
      console.log("[STOMP] <<< RECEIVED DATA LENGTH:", data.length);
      console.log("[STOMP] <<< STARTS WITH:", data.substring(0, 20));

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

        // Try to subscribe to alerts and reports after connection
        // This may be needed to receive broadcast messages from backend
        setTimeout(() => {
          console.log("[STOMP] 🔔 Attempting to subscribe to alerts and reports...");
          subscribeToAlertsAndReports();
        }, 1000);

        return; // Don't process further for CONNECTED frame
      }

      // Handle errors
      if (data.startsWith("ERROR")) {
        console.error("[STOMP] ❌ Error:", data);
        isConnected = false;
        if (connectionReject) {
          connectionReject(new Error("STOMP connection error: " + data));
        }
        return; // Don't process further for ERROR frame
      }

      // Handle MESSAGE frames (alerts and reports)
      if (data.startsWith("MESSAGE")) {
        console.log("🔔 [STOMP] ========================================");
        console.log("🔔 [STOMP] MESSAGE FRAME DETECTED!");
        console.log("🔔 [STOMP] Full message:", logData);
        console.log("🔔 [STOMP] ========================================");
        
        try {
          // Parse STOMP MESSAGE frame
          // Format: MESSAGE\nheader1:value1\nheader2:value2\n\n{body}\0
          const lines = data.split("\n");
          const headers = {};
          let bodyStartIndex = -1;

          console.log("🔔 [STOMP] Parsing MESSAGE frame...");
          console.log("🔔 [STOMP] Total lines:", lines.length);

          // Parse headers (skip first line "MESSAGE")
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line === "") {
              // Empty line indicates start of body
              bodyStartIndex = i + 1;
              console.log("🔔 [STOMP] Found body start at line:", bodyStartIndex);
              break;
            }
            const colonIndex = line.indexOf(":");
            if (colonIndex > 0) {
              const key = line.substring(0, colonIndex).trim();
              const value = line.substring(colonIndex + 1).trim();
              headers[key] = value;
              console.log(`🔔 [STOMP] Header: ${key} = ${value}`);
            }
          }

          console.log("🔔 [STOMP] Parsed headers:", headers);

          // Extract body (everything after empty line, remove NULL byte at end)
          if (bodyStartIndex >= 0) {
            const bodyLines = lines.slice(bodyStartIndex);
            let bodyText = bodyLines.join("\n");
            // Remove NULL byte at the end
            if (bodyText.endsWith(String.fromCharCode(0))) {
              bodyText = bodyText.slice(0, -1);
            }

            console.log("🔔 [STOMP] Body text (first 500 chars):", bodyText.substring(0, 500));

            // Parse JSON body
            let messageBody;
            try {
              messageBody = JSON.parse(bodyText);
              console.log("🔔 [STOMP] Parsed message body:", messageBody);
            } catch (parseError) {
              console.error("❌ [STOMP] Failed to parse message body as JSON:", parseError);
              console.error("❌ [STOMP] Body text that failed:", bodyText);
              return;
            }

            // Check message type from headers or body
            const messageType = headers["type"] || headers["message-type"] || messageBody.type;
            console.log("🔔 [STOMP] ========================================");
            console.log("🔔 [STOMP] 📨 Received MESSAGE frame");
            console.log("🔔 [STOMP] Message type:", messageType);
            console.log("🔔 [STOMP] Headers:", headers);
            console.log("🔔 [STOMP] Body keys:", Object.keys(messageBody));
            console.log("🔔 [STOMP] Full body:", JSON.stringify(messageBody, null, 2));
            console.log("🔔 [STOMP] ========================================");

            // Handle alert messages
            if (messageType === "alert" || messageBody.alertId || messageBody.alert_id || messageBody.AlertId) {
              console.log("🚨 [STOMP] ✅ Identified as ALERT message - Processing...");
              handleIncomingAlert(messageBody);
            }
            // Handle report messages
            else if (messageType === "report" || messageBody.reportId || messageBody.report_id || messageBody.id) {
              console.log("📝 [STOMP] ✅ Identified as REPORT message - Processing...");
              handleIncomingReport(messageBody);
            }
            else {
              console.warn("⚠️ [STOMP] Unknown message type. Headers:", headers);
              console.warn("⚠️ [STOMP] Message body:", messageBody);
              console.warn("⚠️ [STOMP] Not processing as alert or report");
            }
          } else {
            console.warn("⚠️ [STOMP] No body found in MESSAGE frame");
          }
        } catch (error) {
          console.error("❌ [STOMP] ========================================");
          console.error("❌ [STOMP] Error processing MESSAGE frame");
          console.error("❌ [STOMP] Error:", error);
          console.error("❌ [STOMP] Stack:", error.stack);
          console.error("❌ [STOMP] ========================================");
        }
      } else {
        // Log other frame types for debugging
        const frameType = data.split("\n")[0] || data.substring(0, 20);
        if (frameType !== "CONNECTED" && frameType !== "ERROR") {
          console.log("ℹ️ [STOMP] Received non-MESSAGE frame:", frameType);
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

    // Get status from locationData, or from localStorage, or default to UNKNOWN
    const { lat, lon, accuracy = 0, status: statusFromData } = locationData;
    const statusFromStorage = localStorage.getItem("user_status") || "UNKNOWN";
    const status = statusFromData || statusFromStorage || "UNKNOWN";

    // Get cached phone, name, and userId from localStorage
    const userName = localStorage.getItem("userName") || "";
    const userPhone = localStorage.getItem("userPhone") || "";
    const userId = localStorage.getItem("userId") || "";

    // ⚠️ Format chính xác theo backend test file (test_stomp_raw.html)
    // Backend lấy userId từ STOMP CONNECT frame (user-id header), không cần gửi trong location object
    // Format phải match 100% với test file:
    //   Lat, Lon, AccuracyM, Status, UpdatedAt, Username, Phone
    const location = {
      Lat: lat,
      Lon: lon,
      AccuracyM: accuracy,
      Status: status,
      UpdatedAt: Date.now(),
      Username: userName, // ⚠️ "Username" với U hoa, s thường (không phải "Name" hay "username")
      Phone: userPhone,
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

      // Log STOMP frame để debug (chỉ log một phần để không spam)
      const framePreview = frame.substring(0, 300).replace(/\0/g, "<NUL>");
      console.log("📍 [STOMP LOCATION] STOMP frame preview:", framePreview);

      // Note: Backend lấy userId từ STOMP CONNECT frame (user-id header), không cần trong location object
      if (!userId) {
        console.warn(
          "⚠️ [STOMP LOCATION] WARNING: userId is missing in localStorage! Backend uses user-id from CONNECT frame."
        );
      }

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
            // Get status from localStorage (set by StatusSelector component)
            const userStatus = localStorage.getItem("user_status") || "UNKNOWN";
            sendLocation({
              lat: latitude,
              lon: longitude,
              accuracy: accuracy || 0,
              status: userStatus, // Use user-selected status
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

    // Get cached phone and name from localStorage
    const userName = localStorage.getItem("userName") || "";
    const userPhone = localStorage.getItem("userPhone") || "";

    const report = {
      type: type, // Category (e.g., "FLOOD", "FIRE", etc.)
      detail: detail, // Sub-category (e.g., "Mưa lớn", "Đường ngập nước")
      description: description, // Full description
      image: image || "", // Base64 encoded image
      lat: lat, // Latitude
      lon: lon, // Longitude
      user_name: userName, // User name from cached profile
      phone_number: userPhone, // Phone number from cached profile
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
 * Subscribe to alerts and reports (broadcast messages)
 * This may be needed to receive alert/report messages from backend
 */
export function subscribeToAlertsAndReports() {
  if (!ws || !isConnected) {
    console.warn("[STOMP] Cannot subscribe: WebSocket not connected");
    return;
  }

  // Try different subscription patterns based on backend implementation
  // Pattern 1: Subscribe to all alerts
  const alertFrame = "SUBSCRIBE\n" + `destination:/topic/alerts\n\n` + STOMP_NULL;
  ws.send(alertFrame);
  console.log("[STOMP] >>> SENT SUBSCRIBE to /topic/alerts");

  // Pattern 2: Subscribe to all reports
  const reportFrame = "SUBSCRIBE\n" + `destination:/topic/reports\n\n` + STOMP_NULL;
  ws.send(reportFrame);
  console.log("[STOMP] >>> SENT SUBSCRIBE to /topic/reports");

  // Pattern 3: Subscribe to user-specific messages
  const userId = localStorage.getItem("userId");
  if (userId) {
    const userFrame = "SUBSCRIBE\n" + `destination:/user/${userId}/messages\n\n` + STOMP_NULL;
    ws.send(userFrame);
    console.log("[STOMP] >>> SENT SUBSCRIBE to /user/" + userId + "/messages");
  }
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

    // Get cached phone and name from localStorage
    const userName = localStorage.getItem("userName") || "";
    const userPhone = localStorage.getItem("userPhone") || "";

    const alert = {
      action: "raise",
      body: body,
      lat: lat,
      lon: lon,
      radius_m: radius_m,
      ttl_min: ttl_min,
      user_name: userName, // snake_case (giống report)
      phone_number: userPhone, // snake_case (giống report)
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
 * Resolve alert via STOMP (change status from RAISED to SOLVED)
 * @param {string} alertId - Alert ID
 * @returns {Promise<boolean>} Send success
 */
export function sendAlertStatusUpdate(alertId) {
  return new Promise((resolve, reject) => {
    if (!ws || !isConnected) {
      reject(new Error("WebSocket not connected"));
      return;
    }

    if (!alertId) {
      reject(new Error("Missing required field: alertId"));
      return;
    }

    const alert = {
      action: "resolve",
      alertId: alertId,
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
        "🔄 [STOMP ALERT] >>> SENT Resolve Alert:",
        `alertId: ${alertId}`
      );
      console.log("🔄 [STOMP ALERT] Full payload:", alert);
      resolve(true);
    } catch (error) {
      console.error("❌ [STOMP ALERT] Error sending resolve alert:", error);
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

/**
 * Handle incoming alert message from STOMP
 * @param {Object} alertData - Alert data from STOMP message
 */
async function handleIncomingAlert(alertData) {
  try {
    console.log("🚨 [STOMP] ========================================");
    console.log("🚨 [STOMP] Processing incoming alert for AI analysis");
    console.log("🚨 [STOMP] Alert data:", JSON.stringify(alertData, null, 2));
    console.log("🚨 [STOMP] ========================================");

    // Transform alert data to match API format
    // Based on the image provided, API expects: { alerts: [...] }
    const alertForAPI = {
      alertId: alertData.alertId || alertData.alert_id || alertData.id,
      UserID: alertData.UserID || alertData.userID || alertData.user_id || userId,
      location: alertData.location || {
        type: "Point",
        coordinates: [alertData.lon || alertData.lng || 0, alertData.lat || 0],
      },
      Body: alertData.Body || alertData.body || alertData.message || "",
      RadiusM: alertData.RadiusM || alertData.radius_m || alertData.radiusM || 10000,
      TTLMin: alertData.TTLMin || alertData.ttl_min || alertData.ttlMin || 5,
      ExpiresAt: alertData.ExpiresAt || alertData.expires_at || alertData.expiresAt,
      Visibility: alertData.Visibility || alertData.visibility || "PUBLIC",
      Status: alertData.Status || alertData.status || "RAISED",
      UserName: alertData.UserName || alertData.user_name || alertData.userName || "",
      PhoneNumber: alertData.PhoneNumber || alertData.phone_number || alertData.phoneNumber || "",
    };

    // Call AI analyze API
    console.log("🚨 [STOMP] Calling AI analyze API with alert data...");
    const analysisResult = await analyzeWithAI({ alerts: [alertForAPI] });
    
    // Store result in localStorage and dispatch event
    if (analysisResult) {
      const resultWithMetadata = {
        ...analysisResult,
        timestamp: new Date().toISOString(),
        source: "alert",
        sourceId: alertForAPI.alertId,
      };
      localStorage.setItem("ai_analysis_result", JSON.stringify(resultWithMetadata));
      window.dispatchEvent(new Event("ai-analysis-updated"));
      console.log("✅ [STOMP] ========================================");
      console.log("✅ [STOMP] AI analysis result stored successfully");
      console.log("✅ [STOMP] Result:", JSON.stringify(resultWithMetadata, null, 2));
      console.log("✅ [STOMP] ========================================");
    }
  } catch (error) {
    console.error("❌ [STOMP] ========================================");
    console.error("❌ [STOMP] Error analyzing alert with AI");
    console.error("❌ [STOMP] Error:", error.message);
    console.error("❌ [STOMP] Stack:", error.stack);
    console.error("❌ [STOMP] ========================================");
  }
}

/**
 * Handle incoming report message from STOMP
 * @param {Object} reportData - Report data from STOMP message
 */
async function handleIncomingReport(reportData) {
  try {
    console.log("📝 [STOMP] ========================================");
    console.log("📝 [STOMP] Processing incoming report for AI analysis");
    console.log("📝 [STOMP] Report data:", JSON.stringify(reportData, null, 2));
    console.log("📝 [STOMP] ========================================");

    // Transform report data to match API format
    // Based on the image provided, API expects: { reports: [...] }
    const reportForAPI = {
      id: reportData.id || reportData.reportId || reportData.report_id,
      user_id: reportData.user_id || reportData.userId || reportData.UserID || userId,
      type: reportData.type || reportData.category || "OTHER",
      detail: reportData.detail || reportData.subCategory || "",
      description: reportData.description || reportData.body || "",
      image: reportData.image || reportData.images?.[0] || "",
      location: reportData.location || {
        type: "Point",
        coordinates: [reportData.lon || reportData.lng || 0, reportData.lat || 0],
      },
      timestamp: reportData.timestamp || Date.now(),
      status: reportData.status || "",
      phone_number: reportData.phone_number || reportData.phoneNumber || reportData.PhoneNumber || "",
      user_name: reportData.user_name || reportData.userName || reportData.UserName || "",
      enrichment: reportData.enrichment || {},
    };

    // Call AI analyze API
    console.log("📝 [STOMP] Calling AI analyze API with report data...");
    const analysisResult = await analyzeWithAI({ reports: [reportForAPI] });
    
    // Store result in localStorage and dispatch event
    if (analysisResult) {
      const resultWithMetadata = {
        ...analysisResult,
        timestamp: new Date().toISOString(),
        source: "report",
        sourceId: reportForAPI.id,
      };
      localStorage.setItem("ai_analysis_result", JSON.stringify(resultWithMetadata));
      window.dispatchEvent(new Event("ai-analysis-updated"));
      console.log("✅ [STOMP] ========================================");
      console.log("✅ [STOMP] AI analysis result stored successfully");
      console.log("✅ [STOMP] Result:", JSON.stringify(resultWithMetadata, null, 2));
      console.log("✅ [STOMP] ========================================");
    }
  } catch (error) {
    console.error("❌ [STOMP] ========================================");
    console.error("❌ [STOMP] Error analyzing report with AI");
    console.error("❌ [STOMP] Error:", error.message);
    console.error("❌ [STOMP] Stack:", error.stack);
    console.error("❌ [STOMP] ========================================");
  }
}

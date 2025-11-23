// API Service for Storm Watch Backend
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * Query zone by coordinates - Get 10km radius zone and related reports
 * @param {Object} coordinates - { lat: number, lng: number }
 * @returns {Promise<Object>} Zone data with reports
 */
export async function queryZoneByCoordinates(coordinates) {
  const apiUrl = `${API_BASE_URL}/nearby/report?lat=${coordinates.lat}&lon=${coordinates.lng}&km=10`;
  console.log("🔍 [API] Calling nearby/report API:", apiUrl);
  console.log("🔍 [API] Coordinates:", coordinates);

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(
      "📡 [API] Response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [API] HTTP error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ [API] Raw response data:", data);
    console.log("📊 [API] Reports count:", data.reports?.length || 0);
    console.log("🌐 [API] ✅ Using REAL API (not mock data)");
    console.log("🌐 [API] API URL:", apiUrl);

    if (data.reports && Array.isArray(data.reports)) {
      const transformedReports = data.reports.map((report, index) => {
        // Transform location from GeoJSON Point to { lat, lng }
        let location = report.location;
        if (location && location.type === "Point" && location.coordinates) {
          location = {
            lat: location.coordinates[1], // coordinates[1] is latitude
            lng: location.coordinates[0], // coordinates[0] is longitude
          };
        }

        // Handle timestamp - backend may send Unix timestamp (seconds) or ISO string
        let timestamp = report.timestamp;
        if (typeof timestamp === "number") {
          // Unix timestamps in seconds are typically < 1e12 (year 2001)
          // Unix timestamps in milliseconds are typically > 1e12 (year 2001+)
          // If timestamp is in seconds, convert to milliseconds
          if (timestamp < 1e12) {
            timestamp = timestamp * 1000;
          }
          // If timestamp is already in milliseconds, use as is
        }

        const transformed = {
          ...report,
          location,
          timestamp: new Date(timestamp).toISOString(),
          // Map backend fields to frontend format
          userId: report.user_id || report.userId,
          userName: report.user_name || report.userName || "Người dùng",
          severity:
            report.enrichment?.urgency?.toLowerCase() ||
            report.severity ||
            "medium",
          address:
            report.address ||
            `${location?.lat?.toFixed(6) || "N/A"}, ${
              location?.lng?.toFixed(6) || "N/A"
            }`,
          images: report.images || (report.image ? [report.image] : []),
        };

        console.log(`  📝 [API] Report ${index + 1}:`, {
          id: transformed.id,
          location: transformed.location,
          timestamp: transformed.timestamp,
          severity: transformed.severity,
        });

        return transformed;
      });

      console.log("🔄 [API] Transformed reports:", transformedReports.length);
      console.log(
        "📦 [API] Returning data with",
        transformedReports.length,
        "reports"
      );

      return {
        reports: transformedReports,
        zone: {
          center: coordinates,
          radius: 10,
          riskLevel: "medium", // Can be calculated from reports if needed
          score: 0,
          reportCount: transformedReports.length,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    console.warn("⚠️ [API] No reports array in response, returning raw data");
    return data;
  } catch (error) {
    console.error("❌ [API] Error querying zone:", error);
    console.error("❌ [API] Error details:", {
      message: error.message,
      stack: error.stack,
    });
    console.warn("⚠️ [API] ❌ API call failed, returning empty data");
    console.warn("⚠️ [API] Error:", error.message);
    console.warn(
      "⚠️ [API] Check your .env file: VITE_API_BASE_URL should point to real backend"
    );
    // Return empty data instead of mock data
    return {
      reports: [],
      zone: {
        center: coordinates,
        radius: 10,
        riskLevel: "low",
        score: 0,
        reportCount: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}


/**
 * Get all reports
 */
export async function getAllReports(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.severity) params.append("severity", filters.severity);
    if (filters.region) params.append("region", filters.region);

    const response = await fetch(`${API_BASE_URL}/reports?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
}

/**
 * Get danger zones
 */
export async function getDangerZones() {
  try {
    const response = await fetch(`${API_BASE_URL}/danger-zones`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching danger zones:", error);
    throw error;
  }
}

/**
 * Get zones by bounding box
 * @param {Object} bounds - { minLat, minLon, maxLat, maxLon }
 * @returns {Promise<Array>} Array of zone objects
 */
export async function getZonesByBounds(bounds) {
  const { minLat, minLon, maxLat, maxLon } = bounds;
  
  // Remove /api suffix if present, as zones endpoint is at root level
  const baseUrl = API_BASE_URL.replace(/\/api$/, '');
  const apiUrl = `${baseUrl}/zones?minLat=${minLat}&minLon=${minLon}&maxLat=${maxLat}&maxLon=${maxLon}`;
  
  console.log("🔍 [API] Calling zones API with bounds:", apiUrl);
  console.log("🔍 [API] Bounds:", bounds);

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [API] Zones HTTP error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ [API] Zones response:", data);
    console.log("📊 [API] Zones count:", Array.isArray(data) ? data.length : 0);

    // Transform zones if needed
    if (Array.isArray(data)) {
      return data.map((zone) => {
        // Transform center from GeoJSON Point to { lat, lng }
        let center = zone.center;
        if (center && center.type === "Point" && center.coordinates) {
          center = {
            lat: center.coordinates[1], // coordinates[1] is latitude
            lng: center.coordinates[0], // coordinates[0] is longitude
          };
        }

        return {
          ...zone,
          center,
        };
      });
    }

    return data;
  } catch (error) {
    console.error("❌ [API] Error fetching zones by bounds:", error);
    return []; // Return empty array on error
  }
}

/**
 * Get nearby SOS signals
 * @param {Object} coordinates - { lat: number, lng: number }
 * @param {number} km - Radius in kilometers (default: 5)
 * @returns {Promise<Array>} Array of SOS signals
 */
export async function getNearbySOS(coordinates, km = 5) {
  const apiUrl = `${API_BASE_URL}/nearby/sos?lat=${coordinates.lat}&lon=${coordinates.lng}&km=${km}`;
  console.log("🔍 [API] Calling nearby/sos API:", apiUrl);
  console.log("🔍 [API] Coordinates:", coordinates);

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(
      "📡 [API] SOS Response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [API] SOS HTTP error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ [API] SOS Raw response data:", data);
    console.log("✅ [API] SOS Raw response type:", typeof data);
    console.log("✅ [API] SOS Raw response isArray:", Array.isArray(data));
    console.log("✅ [API] SOS Raw response keys:", Object.keys(data || {}));
    console.log(
      "📊 [API] SOS count:",
      data.sos?.length || (Array.isArray(data) ? data.length : 0)
    );
    console.log("🌐 [API] ✅ Using REAL API for SOS (not mock data)");

    // Transform backend response if needed
    // Backend may return: { sos: [...] } or { alerts: [...] } or just [...]
    let sosList = null;

    if (Array.isArray(data)) {
      // Backend returns array directly
      sosList = data;
    } else if (data && typeof data === "object") {
      // Backend returns object with property
      sosList = data.sos || data.alerts || data.data || data.signals || [];
    } else {
      sosList = [];
    }

    // Ensure sosList is always an array
    if (!Array.isArray(sosList)) {
      console.warn(
        "⚠️ [API] sosList is not an array:",
        typeof sosList,
        sosList
      );
      sosList = [];
    }

    console.log("✅ [API] Final sosList:", sosList.length, "items");
    console.log("✅ [API] sosList isArray:", Array.isArray(sosList));

    // Get current user ID to filter out own SOS signals
    const currentUserId =
      localStorage.getItem("userId") || localStorage.getItem("userID") || null;
    console.log("👤 [API] Current user ID:", currentUserId);

    // Filter out SOS signals sent by current user
    const filteredSosList = sosList.filter((sos) => {
      const sosUserId =
        sos.UserID || sos.userID || sos.user_id || sos.userId || null;
      
      // Compare both as strings to ensure exact match
      const isOwnSOS =
        currentUserId &&
        sosUserId &&
        String(currentUserId).trim() === String(sosUserId).trim();

      if (isOwnSOS) {
        console.log(
          "🚫 [API] Filtering out own SOS:",
          sos.alertId || sos.id,
          "from user:",
          sosUserId,
          "(current user:",
          currentUserId,
          ")"
        );
      }

      return !isOwnSOS; // Keep only SOS from other users
    });

    console.log(
      "📊 [API] SOS after filtering own signals:",
      filteredSosList.length,
      "items (filtered out",
      sosList.length - filteredSosList.length,
      "own signals)"
    );

    return filteredSosList.map((sos) => {
      // Transform location from GeoJSON Point to { lat, lng } if needed
      let location = sos.location;
      if (location && location.type === "Point" && location.coordinates) {
        location = {
          lat: location.coordinates[1], // coordinates[1] is latitude
          lng: location.coordinates[0], // coordinates[0] is longitude
        };
      }

      // Handle timestamp - check ExpiresAt if timestamp not available
      let timestamp = sos.timestamp;
      if (!timestamp && sos.ExpiresAt) {
        // Use ExpiresAt and subtract TTLMin to get creation time
        const expiresAt = new Date(sos.ExpiresAt);
        const ttlMinutes = sos.TTLMin || 5;
        timestamp = expiresAt.getTime() - ttlMinutes * 60 * 1000;
      } else if (typeof timestamp === "number" && timestamp < 1e12) {
        timestamp = timestamp * 1000; // Convert seconds to milliseconds
      }

      // Map userId from various possible fields
      const userId =
        sos.UserID || sos.userID || sos.user_id || sos.userId || null;

      return {
        ...sos,
        location: location || sos.location,
        timestamp: timestamp
          ? new Date(timestamp).toISOString()
          : new Date().toISOString(),
        userId: userId,
        alertId: sos.alertId || sos.id,
        body: sos.Body || sos.body || sos.message || "",
        address:
          sos.address ||
          `${location?.lat?.toFixed(6) || "N/A"}, ${
            location?.lng?.toFixed(6) || "N/A"
          }`,
      };
    });
  } catch (error) {
    console.error("❌ [API] Error fetching nearby SOS:", error);
    console.warn("⚠️ [API] Falling back to empty array for SOS");
    return []; // Return empty array on error
  }
}

/**
 * Analyze alerts or reports using AI
 * @param {Object} data - { alerts: [...] } or { reports: [...] }
 * @returns {Promise<Object>} Analysis result with cause, current_status, recommendation, severity
 */
export async function analyzeWithAI(data) {
  // Remove /api suffix if present, as ai/analyze endpoint is at root level
  const baseUrl = API_BASE_URL.replace(/\/api$/, '');
  const apiUrl = `${baseUrl}/ai/analyze`;
  
  // Get authentication token
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  
  // Generate request ID for tracking
  const requestId = `AI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log("🤖 [AI] ========================================");
  console.log(`🤖 [AI] [${requestId}] Starting AI analysis request`);
  console.log(`🤖 [AI] [${requestId}] API URL:`, apiUrl);
  console.log(`🤖 [AI] [${requestId}] Has token:`, !!token);
  console.log(`🤖 [AI] [${requestId}] Request data:`, JSON.stringify(data, null, 2));
  console.log(`🤖 [AI] [${requestId}] Timestamp:`, new Date().toISOString());
  console.log("🤖 [AI] ========================================");

  // Dispatch event to show loading state
  window.dispatchEvent(new CustomEvent('ai-analysis-start', { detail: { requestId } }));

  // Prepare headers
  const headers = {
    "Content-Type": "application/json",
  };
  
  // Add authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    const duration = Date.now() - startTime;
    console.log(`🤖 [AI] [${requestId}] Response received in ${duration}ms`);
    console.log(`🤖 [AI] [${requestId}] Response status:`, response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [AI] [${requestId}] HTTP error response:`, errorText);
      console.error(`❌ [AI] [${requestId}] Status:`, response.status);
      
      // Dispatch error event
      window.dispatchEvent(new CustomEvent('ai-analysis-error', { 
        detail: { requestId, error: errorText, status: response.status } 
      }));
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get response as text first (may be wrapped in Markdown code block)
    const responseText = await response.text();
    console.log(`🤖 [AI] [${requestId}] Raw response text (first 500 chars):`, responseText.substring(0, 500));
    
    // Try to extract JSON from Markdown code block if present
    let jsonText = responseText.trim();
    
    // Check if response is wrapped in Markdown code block (```json ... ```)
    const markdownJsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownJsonMatch) {
      console.log(`🤖 [AI] [${requestId}] Found Markdown code block, extracting JSON...`);
      jsonText = markdownJsonMatch[1].trim();
    }
    
    // Parse JSON
    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error(`❌ [AI] [${requestId}] JSON parse error:`, parseError);
      console.error(`❌ [AI] [${requestId}] Response text that failed to parse:`, jsonText.substring(0, 500));
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }
    console.log("🤖 [AI] ========================================");
    console.log(`✅ [AI] [${requestId}] Analysis completed successfully`);
    console.log(`✅ [AI] [${requestId}] Result:`, JSON.stringify(result, null, 2));
    console.log(`✅ [AI] [${requestId}] Duration: ${duration}ms`);
    console.log("🤖 [AI] ========================================");
    
    // Dispatch success event
    window.dispatchEvent(new CustomEvent('ai-analysis-success', { 
      detail: { requestId, result, duration } 
    }));
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("🤖 [AI] ========================================");
    console.error(`❌ [AI] [${requestId}] Error analyzing with AI`);
    console.error(`❌ [AI] [${requestId}] Error message:`, error.message);
    console.error(`❌ [AI] [${requestId}] Error stack:`, error.stack);
    console.error(`❌ [AI] [${requestId}] Duration: ${duration}ms`);
    console.error("🤖 [AI] ========================================");
    
    // Dispatch error event
    window.dispatchEvent(new CustomEvent('ai-analysis-error', { 
      detail: { requestId, error: error.message, duration } 
    }));
    
    throw error;
  }
}

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

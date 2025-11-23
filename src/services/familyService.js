// Family Service
import { getFamilyById as getMockFamilyById } from "../data/mockFamily";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://stormwatchbackend-production.up.railway.app";

/**
 * Validate if token is a valid JWT format
 * JWT format: header.payload.signature (3 parts separated by dots)
 * @param {string} token - Token to validate
 * @returns {boolean} True if token format is valid
 */
function isValidToken(token) {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return false;
  }

  // JWT should have 3 parts separated by dots
  const parts = token.trim().split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

/**
 * Get valid token from localStorage
 * @returns {string|null} Valid token or null
 */
function getValidToken() {
  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  if (isValidToken(token)) {
    return token;
  }

  // If token is invalid, clear it
  if (token) {
    console.warn("⚠️ [Family] Invalid token format, clearing token");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
  }

  return null;
}

/**
 * Get user profile with group IDs
 * @returns {Promise<Object|null>} Profile object with groupIDs or null
 */
export async function getProfile() {
  try {
    const token = getValidToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      console.log("ℹ️ [Family] Profile not found (404)");
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ [Family] Profile fetched:", data);

    return data;
  } catch (error) {
    console.error("❌ [Family] Error fetching profile:", error);
    throw error;
  }
}

/**
 * Get all family groups for current user
 * Fetches profile first to get groupIDs, then fetches all group details
 * @returns {Promise<Array>} Array of family group objects
 */
export async function getAllFamilies() {
  try {
    const token = getValidToken();

    if (!token) {
      console.log("ℹ️ [Family] No valid token, user has no groups");
      return [];
    }

    // Step 1: Get user profile to get groupIDs
    const profile = await getProfile();

    if (!profile || !profile.groupIDs || profile.groupIDs.length === 0) {
      console.log("ℹ️ [Family] User has no groups (empty groupIDs array)");
      return [];
    }

    // Step 2: Get all group details
    console.log(
      `🔍 [Family] Fetching details for ${profile.groupIDs.length} groups`
    );

    const groupPromises = profile.groupIDs.map((groupId) =>
      getFamilyById(groupId).catch((err) => {
        console.warn(`⚠️ [Family] Failed to fetch group ${groupId}:`, err);
        return null; // Return null for failed fetches
      })
    );

    const groups = await Promise.all(groupPromises);
    // Filter out null values (failed fetches)
    return groups.filter((group) => group !== null);
  } catch (error) {
    console.error("❌ [Family] Error fetching families:", error);
    return [];
  }
}

/**
 * Get family group for current user (first group for backward compatibility)
 * Fetches profile first to get groupIDs, then fetches group details
 * @returns {Promise<Object|null>} Family group object or null if user has no group
 */
export async function getFamily() {
  try {
    const families = await getAllFamilies();
    return families.length > 0 ? families[0] : null;
  } catch (error) {
    console.error("❌ [Family] Error fetching family:", error);
    return null;
  }
}

/**
 * Get family group by ID
 * @param {string} groupId - Group ID
 * @returns {Promise<Object|null>} Family group object or null
 */
export async function getFamilyById(groupId) {
  try {
    const token = getValidToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    if (!groupId) {
      throw new Error("Group ID is required");
    }

    const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      console.log(`ℹ️ [Family] Group ${groupId} not found (404)`);
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(`✅ [Family] Group details fetched:`, data);

    // Fetch member details for all members
    const memberPromises = (data.memberIDs || []).map(
      async (memberId, index) => {
        try {
          const memberDetails = await getMemberDetails(groupId, memberId);
          if (memberDetails) {
            return {
              ...memberDetails,
              role: index === 0 ? "owner" : "member",
            };
          }
          // Fallback if member details not found
          return {
            id: memberId,
            name: `Member ${index + 1}`,
            phone: "",
            location: null,
            status: "unknown",
            role: index === 0 ? "owner" : "member",
          };
        } catch (error) {
          console.warn(
            `⚠️ [Family] Failed to fetch details for member ${memberId}:`,
            error
          );
          // Fallback if fetch fails
          return {
            id: memberId,
            name: `Member ${index + 1}`,
            phone: "",
            location: null,
            status: "unknown",
            role: index === 0 ? "owner" : "member",
          };
        }
      }
    );

    const members = await Promise.all(memberPromises);

    // Transform backend response to match frontend format
    return {
      id: data.id,
      name: data.name,
      inviteCode: data.inviteCode,
      members: members,
      memberIDs: data.memberIDs || [],
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    console.error(`❌ [Family] Error fetching group ${groupId}:`, error);
    throw error;
  }
}

/**
 * Create a new family group
 * @param {Object} payload - Family data { name }
 * @returns {Promise<Object>} Created family group
 */
export async function createFamily(payload) {
  try {
    const token = getValidToken();

    if (!token) {
      throw new Error("Bạn cần đăng nhập để tạo nhóm");
    }

    const response = await fetch(`${API_BASE_URL}/groups/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: payload.name || "My Family Group",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ [Family] Group created:", data);

    // Transform backend response to match frontend format
    return {
      id: data.id,
      name: data.name,
      inviteCode: data.inviteCode,
      members: (data.memberIDs || []).map((id, index) => ({
        id,
        name: `Member ${index + 1}`,
        role: index === 0 ? "owner" : "member",
      })),
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    console.error("❌ [Family] Error creating group:", error);
    throw error;
  }
}

/**
 * Join a family group using invite code
 * @param {string} inviteCode - Invite code to join the group
 * @returns {Promise<Object>} Joined family group
 */
export async function joinGroup(inviteCode) {
  try {
    const token = getValidToken();

    if (!token) {
      throw new Error("Bạn cần đăng nhập để tham gia nhóm");
    }

    if (!inviteCode || inviteCode.trim().length === 0) {
      throw new Error("Invite code is required");
    }

    const trimmedCode = inviteCode.toLowerCase().trim();
    console.log(
      `🔍 [Family] Attempting to join group with invite code: ${trimmedCode}`
    );
    console.log(`🔍 [Family] Using API base URL: ${API_BASE_URL}`);

    const joinUrl = `${API_BASE_URL}/groups/join/${trimmedCode}`;
    console.log(`🔍 [Family] Trying PUT ${joinUrl}`);

    const response = await fetch(joinUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ [Family] Joined group:", data);

    // Transform backend response to match frontend format
    return {
      id: data.id || data.groupId,
      name: data.name,
      inviteCode: data.inviteCode || inviteCode,
      members: (data.memberIDs || data.members || []).map((member, index) => ({
        id: typeof member === "string" ? member : member.id,
        name: typeof member === "string" ? `Member ${index + 1}` : member.name,
        role: index === 0 ? "owner" : "member", // First member is owner
      })),
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    console.error("❌ [Family] Error joining group:", error);
    throw error;
  }
}

/**
 * Normalize status from API format (SAFE, CAUTION, DANGER, UNKNOWN) to frontend format (safe, warning, danger, unknown)
 * @param {string} apiStatus - Status from API (uppercase)
 * @returns {string} Normalized status (lowercase)
 */
function normalizeStatus(apiStatus) {
  if (!apiStatus || typeof apiStatus !== "string") {
    return "unknown";
  }
  
  const normalized = apiStatus.toUpperCase().trim();
  
  switch (normalized) {
    case "SAFE":
      return "safe";
    case "CAUTION":
      return "warning"; // Map CAUTION to warning for frontend
    case "DANGER":
      return "danger";
    case "UNKNOWN":
      return "unknown";
    default:
      // If it's already lowercase, return as is if valid
      if (["safe", "warning", "danger", "unknown"].includes(apiStatus.toLowerCase())) {
        return apiStatus.toLowerCase();
      }
      return "unknown";
  }
}

/**
 * Get member details from a group
 * @param {string} groupId - Group ID
 * @param {string} memberId - Member ID
 * @returns {Promise<Object|null>} Member details object or null
 */
export async function getMemberDetails(groupId, memberId) {
  try {
    const token = getValidToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    if (!groupId || !memberId) {
      throw new Error("Group ID and Member ID are required");
    }

    const response = await fetch(
      `${API_BASE_URL}/groups/${groupId}/members/${memberId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 404) {
      console.log(
        `ℹ️ [Family] Member ${memberId} in group ${groupId} not found (404)`
      );
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(`✅ [Family] Member details fetched:`, data);

    // Transform backend response to match frontend format
    let location = null;
    const apiStatus = data.location?.status || "UNKNOWN";
    const normalizedStatus = normalizeStatus(apiStatus);
    
    if (data.location) {
      // Handle nested location structure
      const loc = data.location.location || data.location;
      if (loc && loc.coordinates && loc.coordinates.length >= 2) {
        location = {
          lat: loc.coordinates[1], // coordinates[0] is longitude, coordinates[1] is latitude
          lng: loc.coordinates[0],
          accuracy: data.location.accuracy_m || 0,
          status: apiStatus, // Keep original API status in location object
          updatedAt: data.location.updated_at || 0,
        };
      }
    }

    return {
      id: data.id,
      name: data.name || "Người dùng",
      phone: data.phone || "",
      location: location,
      status: normalizedStatus, // Use normalized status for frontend
      lastSeen: data.location?.updated_at
        ? new Date(data.location.updated_at * 1000).toISOString()
        : null,
    };
  } catch (error) {
    console.error(
      `❌ [Family] Error fetching member ${memberId} in group ${groupId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get danger zones for family members
 * @param {string} familyId - Family ID
 * @returns {Promise<Array>} Array of danger zones
 */
export async function getDangerZonesByFamily(familyId) {
  try {
    const token = getValidToken();
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/family/${familyId}/danger-zones`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error fetching danger zones by family:", error);
    // Return mock data
    const { getDangerZonesNearby } = await import("../data/mockDangerZones");
    const family = getMockFamilyById(familyId);
    if (family && family.members.length > 0) {
      const member = family.members[0];
      if (member.location) {
        return getDangerZonesNearby(
          member.location.lat,
          member.location.lng,
          5000
        );
      }
    }
    return [];
  }
}

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

    // Transform backend response to match frontend format
    return {
      id: data.id,
      name: data.name,
      inviteCode: data.inviteCode,
      members: (data.memberIDs || []).map((memberId, index) => ({
        id: memberId,
        name: `Member ${index + 1}`, // Will need to fetch member details separately if needed
        role: index === 0 ? "owner" : "member",
      })),
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
 * Add member to family
 * @param {string} familyId - Family ID
 * @param {Object} member - Member data { name, phone }
 * @returns {Promise<Object>} Updated family group
 */
export async function addFamilyMember(familyId, member) {
  try {
    const token = getValidToken();

    if (!token) {
      throw new Error("Bạn cần đăng nhập để thêm thành viên");
    }

    const response = await fetch(`${API_BASE_URL}/family/${familyId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(member),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error adding family member:", error);
    // Return mock updated family
    return getMockAddMember(familyId, member);
  }
}

/**
 * Get mock add member result
 */
function getMockAddMember(familyId, member) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const family = getMockFamilyById(familyId);
      if (family) {
        const newMember = {
          id: `user_${Date.now()}`,
          name: member.name,
          phone: member.phone,
          role: "member",
          status: "safe",
          location: null,
          lastSeen: new Date().toISOString(),
        };
        family.members.push(newMember);
        resolve(family);
      } else {
        resolve(null);
      }
    }, 500);
  });
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

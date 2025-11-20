// Family Service - Mock API
import { mockFamilyGroups, getFamilyByUserId, getFamilyById as getMockFamilyById } from '../data/mockFamily';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Get family group for current user
 * @returns {Promise<Object>} Family group object
 */
export async function getFamily() {
  try {
    const response = await fetch(`${API_BASE_URL}/family`, {
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
    console.error('Error fetching family:', error);
    // Return mock data
    const userId = localStorage.getItem('userId') || 'user_123';
    return getFamilyByUserId(userId) || null;
  }
}

/**
 * Get family by ID
 * @param {string} familyId - Family ID
 * @returns {Promise<Object>} Family group object
 */
export async function getFamilyById(familyId) {
  try {
    const response = await fetch(`${API_BASE_URL}/family/${familyId}`, {
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
    console.error('Error fetching family by ID:', error);
    // Return mock data
    return getMockFamilyById(familyId) || null;
  }
}

/**
 * Create a new family group
 * @param {Object} payload - Family data { name, ownerId }
 * @returns {Promise<Object>} Created family group
 */
export async function createFamily(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/family`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error creating family:', error);
    // Return mock created family
    return getMockCreateFamily(payload);
  }
}

/**
 * Get mock created family
 */
function getMockCreateFamily(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newFamily = {
        id: `family_${Date.now()}`,
        name: payload.name || 'Gia đình mới',
        ownerId: payload.ownerId || localStorage.getItem('userId') || 'user_123',
        ownerName: payload.ownerName || 'Chủ gia đình',
        createdAt: new Date().toISOString(),
        members: [
          {
            id: payload.ownerId || localStorage.getItem('userId') || 'user_123',
            name: payload.ownerName || 'Chủ gia đình',
            phone: payload.phone || '',
            role: 'owner',
            status: 'safe',
            location: null,
            lastSeen: new Date().toISOString(),
          },
        ],
      };
      mockFamilyGroups.push(newFamily);
      resolve(newFamily);
    }, 500);
  });
}

/**
 * Add member to family
 * @param {string} familyId - Family ID
 * @param {Object} member - Member data { name, phone }
 * @returns {Promise<Object>} Updated family group
 */
export async function addFamilyMember(familyId, member) {
  try {
    const response = await fetch(`${API_BASE_URL}/family/${familyId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(member),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error adding family member:', error);
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
          role: 'member',
          status: 'safe',
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
    const response = await fetch(`${API_BASE_URL}/family/${familyId}/danger-zones`, {
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
    console.error('Error fetching danger zones by family:', error);
    // Return mock data
    const { getDangerZonesNearby } = await import('../data/mockDangerZones');
    const family = getMockFamilyById(familyId);
    if (family && family.members.length > 0) {
      const member = family.members[0];
      if (member.location) {
        return getDangerZonesNearby(member.location.lat, member.location.lng, 5000);
      }
    }
    return [];
  }
}


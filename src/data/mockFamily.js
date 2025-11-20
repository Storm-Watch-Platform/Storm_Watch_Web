// Mock Family Data
export const mockFamilyGroups = [
  {
    id: 'family_1',
    name: 'Gia đình Nguyễn Văn A',
    ownerId: 'user_123',
    ownerName: 'Nguyễn Văn A',
    createdAt: '2025-01-01T00:00:00Z',
    members: [
      {
        id: 'user_123',
        name: 'Nguyễn Văn A',
        phone: '+84901234567',
        role: 'owner',
        status: 'safe',
        location: { lat: 10.7971, lng: 106.6768 },
        lastSeen: new Date().toISOString(),
      },
      {
        id: 'user_124',
        name: 'Nguyễn Thị B',
        phone: '+84901234568',
        role: 'member',
        status: 'warning',
        location: { lat: 10.8021, lng: 106.7018 },
        lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'user_125',
        name: 'Nguyễn Văn C',
        phone: '+84901234569',
        role: 'member',
        status: 'danger',
        location: { lat: 10.8121, lng: 106.6718 },
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

export const mockCurrentUser = {
  id: 'user_123',
  name: 'Nguyễn Văn A',
  phone: '+84901234567',
  email: 'nguyenvana@example.com',
};

export function getFamilyByUserId(userId) {
  return mockFamilyGroups.find((family) => 
    family.members.some((member) => member.id === userId)
  ) || null;
}

export function getFamilyById(familyId) {
  return mockFamilyGroups.find((family) => family.id === familyId) || null;
}


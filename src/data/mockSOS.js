// Mock SOS Data
export const mockSOSSignals = [
  {
    id: 'sos_1',
    userId: 'user_123',
    userName: 'Nguyễn Văn A',
    location: { lat: 10.7971, lng: 106.6768 },
    address: 'Đường Phan Xích Long, Phú Nhuận',
    timestamp: new Date().toISOString(),
    status: 'active',
    message: 'Cần hỗ trợ khẩn cấp! Nước ngập sâu, không thể di chuyển.',
    respondedBy: null,
  },
  {
    id: 'sos_2',
    userId: 'user_456',
    userName: 'Trần Thị B',
    location: { lat: 10.8021, lng: 106.7018 },
    address: 'Đường Điện Biên Phủ, Bình Thạnh',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'responded',
    message: 'Cần cứu hộ ngay lập tức!',
    respondedBy: 'rescue_team_1',
  },
];

export function createSOSSignal(userId, location, message = '') {
  const newSOS = {
    id: `sos_${Date.now()}`,
    userId,
    userName: 'Người dùng',
    location,
    address: 'Đang xác định...',
    timestamp: new Date().toISOString(),
    status: 'active',
    message,
    respondedBy: null,
  };
  
  mockSOSSignals.unshift(newSOS);
  return newSOS;
}

export function getSOSSignalsNearby(lat, lng, radius = 10000) {
  return mockSOSSignals.filter((sos) => {
    const distance = calculateDistance(lat, lng, sos.location.lat, sos.location.lng);
    return distance <= radius / 1000; // Convert to km
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


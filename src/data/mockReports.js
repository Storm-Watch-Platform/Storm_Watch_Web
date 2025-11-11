// Mock Danger Zones
export const mockDangerZones = [
  {
    id: 1,
    name: "Khu vực Phú Nhuận",
    coordinates: [
      { lat: 10.7971, lng: 106.6768 },
      { lat: 10.7971, lng: 106.6868 },
      { lat: 10.7871, lng: 106.6868 },
      { lat: 10.7871, lng: 106.6768 }
    ],
    riskLevel: "high",
    score: 8.5,
    reportCount: 23,
    lastUpdated: "2025-11-11T10:30:00"
  },
  {
    id: 2,
    name: "Khu vực Bình Thạnh",
    coordinates: [
      { lat: 10.8071, lng: 106.6968 },
      { lat: 10.8071, lng: 106.7068 },
      { lat: 10.7971, lng: 106.7068 },
      { lat: 10.7971, lng: 106.6968 }
    ],
    riskLevel: "medium",
    score: 5.2,
    reportCount: 12,
    lastUpdated: "2025-11-11T11:15:00"
  },
  {
    id: 3,
    name: "Khu vực Gò Vấp",
    coordinates: [
      { lat: 10.8171, lng: 106.6668 },
      { lat: 10.8171, lng: 106.6768 },
      { lat: 10.8071, lng: 106.6768 },
      { lat: 10.8071, lng: 106.6668 }
    ],
    riskLevel: "low",
    score: 2.8,
    reportCount: 5,
    lastUpdated: "2025-11-11T09:45:00"
  }
];

// Mock Reports
export const mockReports = [
  {
    id: 1,
    userId: "user_123",
    userName: "Nguyễn Văn A",
    location: { lat: 10.7971, lng: 106.6818 },
    address: "Đường Phan Xích Long, Phú Nhuận",
    severity: "high",
    description: "Nước ngập sâu 80cm, không thể di chuyển. Cần hỗ trợ khẩn cấp!",
    images: ["https://picsum.photos/400/300?random=1"],
    timestamp: "2025-11-11T10:25:00",
    visibility: "public",
    observers: 15
  },
  {
    id: 2,
    userId: "user_456",
    userName: "Trần Thị B",
    location: { lat: 10.8021, lng: 106.7018 },
    address: "Đường Điện Biên Phủ, Bình Thạnh",
    severity: "medium",
    description: "Đường bắt đầu ngập, xe máy còn đi được nhưng cẩn thận",
    images: ["https://picsum.photos/400/300?random=2"],
    timestamp: "2025-11-11T11:10:00",
    visibility: "public",
    observers: 8
  },
  {
    id: 3,
    userId: "user_789",
    userName: "Lê Văn C",
    location: { lat: 10.8121, lng: 106.6718 },
    address: "Đường Quang Trung, Gò Vấp",
    severity: "low",
    description: "Mưa lớn, tích nước nhẹ ở vỉa hè",
    images: ["https://picsum.photos/400/300?random=3"],
    timestamp: "2025-11-11T09:40:00",
    visibility: "public",
    observers: 3
  },
  {
    id: 4,
    userId: "user_234",
    userName: "Phạm Thị D",
    location: { lat: 10.7921, lng: 106.6838 },
    address: "Đường Hoàng Văn Thụ, Phú Nhuận",
    severity: "high",
    description: "Cây đổ chắn đường, giao thông tê liệt",
    images: ["https://picsum.photos/400/300?random=4"],
    timestamp: "2025-11-11T10:50:00",
    visibility: "public",
    observers: 12
  },
  {
    id: 5,
    userId: "user_345",
    userName: "Hoàng Văn E",
    location: { lat: 10.7991, lng: 106.6798 },
    address: "Đường Nguyễn Văn Trỗi, Phú Nhuận",
    severity: "medium",
    description: "Gió mạnh, cần chú ý đồ vật bay",
    images: ["https://picsum.photos/400/300?random=5"],
    timestamp: "2025-11-11T11:00:00",
    visibility: "public",
    observers: 6
  }
];

// Mock Alerts
export const mockAlerts = [
  {
    id: 1,
    userId: "user_567",
    userName: "Hoàng Văn E",
    location: { lat: 10.7991, lng: 106.6798 },
    alertType: "flood",
    timestamp: "2025-11-11T11:20:00",
    visibility: "public"
  },
  {
    id: 2,
    userId: "user_678",
    userName: "Nguyễn Thị F",
    location: { lat: 10.8031, lng: 106.6888 },
    alertType: "emergency",
    timestamp: "2025-11-11T11:25:00",
    visibility: "public"
  }
];
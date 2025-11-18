export const REGION_PRESETS = [
  {
    id: 'hanoi',
    name: 'Hà Nội',
    addressLabel: 'Quận Hoàn Kiếm, Hà Nội',
    center: { lat: 21.028511, lng: 105.804817 },
    defaultRisk: 'medium',
    reportTemplates: [
      {
        userId: 'hn_001',
        userName: 'Lê Anh Tuấn',
        address: 'Ngõ 87 Hào Nam, Ô Chợ Dừa, Đống Đa, Hà Nội',
        location: { lat: 21.0266, lng: 105.8293 },
        severity: 'high',
        description: 'Mưa lớn khiến ngõ 87 Hào Nam ngập lên tới bậc cửa. Xe máy không thể di chuyển, cần hỗ trợ bơm nước.',
        image: 'https://picsum.photos/seed/hanoi1/600/400',
        minutesAgo: 45,
        observers: 18,
      },
      {
        userId: 'hn_002',
        userName: 'Phạm Thu Hà',
        address: 'Ngã Tư Sở, Đống Đa, Hà Nội',
        location: { lat: 21.0094, lng: 105.8247 },
        severity: 'medium',
        description: 'Nước dâng cao nửa bánh xe, giao thông kẹt cứng hướng Trường Chinh. Đề nghị tránh qua khu vực.',
        image: 'https://picsum.photos/seed/hanoi2/600/400',
        minutesAgo: 70,
        observers: 25,
      },
      {
        userId: 'hn_003',
        userName: 'Đỗ Quang Huy',
        address: 'Phố Huế, Hai Bà Trưng, Hà Nội',
        location: { lat: 21.0165, lng: 105.8539 },
        severity: 'medium',
        description: 'Nước ngập lề đường, cửa hàng phải kê đồ đạc lên cao. Chưa ảnh hưởng tới ô tô nhưng xe máy chạy khó.',
        image: 'https://picsum.photos/seed/hanoi3/600/400',
        minutesAgo: 130,
        observers: 9,
      },
      {
        userId: 'hn_004',
        userName: 'Ngô Thị Hạnh',
        address: 'Trạm bơm Yên Sở, Hoàng Mai, Hà Nội',
        location: { lat: 20.9689, lng: 105.8655 },
        severity: 'low',
        description: 'Mực nước hồ Linh Đàm tăng nhanh, cần theo dõi thêm trong 2 giờ tới.',
        image: 'https://picsum.photos/seed/hanoi4/600/400',
        minutesAgo: 200,
        observers: 7,
      },
    ],
  },
  {
    id: 'hcm',
    name: 'TP. Hồ Chí Minh',
    addressLabel: 'Quận 1, TP. Hồ Chí Minh',
    center: { lat: 10.776889, lng: 106.700897 },
    defaultRisk: 'high',
    reportTemplates: [
      {
        userId: 'hcm_001',
        userName: 'Nguyễn Minh Thư',
        address: 'Đường Trần Hưng Đạo, Phường Cầu Kho, Quận 1',
        location: { lat: 10.7555, lng: 106.6885 },
        severity: 'high',
        description: 'Nước ngập sâu 40cm, các hộ dân phải kê đồ đạc. Có xe chết máy giữa đường.',
        image: 'https://picsum.photos/seed/hcm1/600/400',
        minutesAgo: 35,
        observers: 32,
      },
      {
        userId: 'hcm_002',
        userName: 'Trần Quốc Duy',
        address: 'Kênh Nhiêu Lộc, Phường 2, Quận Phú Nhuận',
        location: { lat: 10.7996, lng: 106.6801 },
        severity: 'medium',
        description: 'Mưa lớn làm nước kênh dâng sát bờ. Đề nghị người dân hạn chế ra bờ kênh.',
        image: 'https://picsum.photos/seed/hcm2/600/400',
        minutesAgo: 95,
        observers: 21,
      },
      {
        userId: 'hcm_003',
        userName: 'Phạm Hoài Nam',
        address: 'Đường Lê Văn Sỹ, Phường 13, Quận 3',
        location: { lat: 10.7902, lng: 106.6748 },
        severity: 'medium',
        description: 'Gió giật mạnh kéo theo cành cây gãy, đề nghị lực lượng cây xanh hỗ trợ.',
        image: 'https://picsum.photos/seed/hcm3/600/400',
        minutesAgo: 160,
        observers: 14,
      },
      {
        userId: 'hcm_004',
        userName: 'Võ Thanh Tùng',
        address: 'Cầu chữ Y, Quận 8, TP.HCM',
        location: { lat: 10.7419, lng: 106.6814 },
        severity: 'low',
        description: 'Nước sông dâng, tràn nhẹ lên vỉa hè nhưng chưa ảnh hưởng giao thông.',
        image: 'https://picsum.photos/seed/hcm4/600/400',
        minutesAgo: 210,
        observers: 11,
      },
    ],
  },
  {
    id: 'hue',
    name: 'Thừa Thiên Huế',
    addressLabel: 'Thành phố Huế, Thừa Thiên Huế',
    center: { lat: 16.463713, lng: 107.590866 },
    defaultRisk: 'medium',
    reportTemplates: [
      {
        userId: 'hue_001',
        userName: 'Huỳnh Thị Nhung',
        address: 'Đường Kim Long, Phường Kim Long, TP Huế',
        location: { lat: 16.4645, lng: 107.5612 },
        severity: 'high',
        description: 'Nước sông Hương tràn vào nhà dân tại Kim Long, cần đội cứu hộ di tản người già.',
        image: 'https://picsum.photos/seed/hue1/600/400',
        minutesAgo: 25,
        observers: 40,
      },
      {
        userId: 'hue_002',
        userName: 'Nguyễn Văn Thức',
        address: 'Khu vực Cầu Bạch Hổ, TP Huế',
        location: { lat: 16.4718, lng: 107.5696 },
        severity: 'medium',
        description: 'Cầu ngập cục bộ, xe tải không thể qua lại. Lực lượng chức năng đang phân luồng.',
        image: 'https://picsum.photos/seed/hue2/600/400',
        minutesAgo: 80,
        observers: 19,
      },
      {
        userId: 'hue_003',
        userName: 'Trần Viết Hùng',
        address: 'Chợ Đông Ba, Phường Phú Hòa, Huế',
        location: { lat: 16.4712, lng: 107.5936 },
        severity: 'medium',
        description: 'Tiểu thương phải di chuyển hàng lên cao, nước ngập 20cm trong sạp chợ.',
        image: 'https://picsum.photos/seed/hue3/600/400',
        minutesAgo: 150,
        observers: 16,
      },
      {
        userId: 'hue_004',
        userName: 'Lê Minh Quân',
        address: 'Phường Phú Hội, TP Huế',
        location: { lat: 16.4653, lng: 107.5983 },
        severity: 'low',
        description: 'Mưa kéo dài nhưng hệ thống thoát nước vẫn ổn. Đề nghị tiếp tục theo dõi.',
        image: 'https://picsum.photos/seed/hue4/600/400',
        minutesAgo: 260,
        observers: 8,
      },
    ],
  },
  {
    id: 'quangtri',
    name: 'Quảng Trị',
    addressLabel: 'TP Đông Hà, Quảng Trị',
    center: { lat: 16.816167, lng: 107.100819 },
    defaultRisk: 'medium',
    reportTemplates: [
      {
        userId: 'qt_001',
        userName: 'Lâm Hoàng Phúc',
        address: 'Phường 1, TP Đông Hà, Quảng Trị',
        location: { lat: 16.8185, lng: 107.1053 },
        severity: 'medium',
        description: 'Đường Lý Thường Kiệt ngập nửa bánh xe, học sinh được cho nghỉ sớm.',
        image: 'https://picsum.photos/seed/quangtri1/600/400',
        minutesAgo: 55,
        observers: 12,
      },
      {
        userId: 'qt_002',
        userName: 'Ngô Văn Mạnh',
        address: 'Cầu Thạch Hãn, Đông Hà',
        location: { lat: 16.8071, lng: 107.0954 },
        severity: 'medium',
        description: 'Mực nước sông Thạch Hãn tăng nhanh, đề nghị hạn chế qua lại.',
        image: 'https://picsum.photos/seed/quangtri2/600/400',
        minutesAgo: 120,
        observers: 10,
      },
      {
        userId: 'qt_003',
        userName: 'Hồ Mỹ Linh',
        address: 'Xã Triệu Ái, Huyện Triệu Phong, Quảng Trị',
        location: { lat: 16.7952, lng: 107.2293 },
        severity: 'high',
        description: 'Ngập sâu tại tuyến đường vào xã Triệu Ái, xe tải không thể tiếp cận.',
        image: 'https://picsum.photos/seed/quangtri3/600/400',
        minutesAgo: 180,
        observers: 6,
      },
      {
        userId: 'qt_004',
        userName: 'Phan Hải Yến',
        address: 'Đường Hùng Vương, Đông Hà',
        location: { lat: 16.8169, lng: 107.1304 },
        severity: 'low',
        description: 'Mưa nhỏ trở lại, nước đang rút dần nhưng vẫn cần cảnh giác.',
        image: 'https://picsum.photos/seed/quangtri4/600/400',
        minutesAgo: 300,
        observers: 5,
      },
    ],
  },
  {
    id: 'quangbinh',
    name: 'Quảng Bình',
    addressLabel: 'TP Đồng Hới, Quảng Bình',
    center: { lat: 17.472968, lng: 106.624481 },
    defaultRisk: 'low',
    reportTemplates: [
      {
        userId: 'qb_001',
        userName: 'Đinh Thị Bảo Yến',
        address: 'Đường Trần Hưng Đạo, TP Đồng Hới',
        location: { lat: 17.4709, lng: 106.6234 },
        severity: 'medium',
        description: 'Nước sông Nhật Lệ dâng cao, khu vực cầu Nhật Lệ 1 bắt đầu ngập.',
        image: 'https://picsum.photos/seed/quangbinh1/600/400',
        minutesAgo: 65,
        observers: 13,
      },
      {
        userId: 'qb_002',
        userName: 'Trương Quốc Việt',
        address: 'Phường Hải Thành, Đồng Hới',
        location: { lat: 17.4648, lng: 106.624 },
        severity: 'medium',
        description: 'Gió biển mạnh, nhà dân phải chằng chống cửa. Chưa có ngập nhưng sóng lớn.',
        image: 'https://picsum.photos/seed/quangbinh2/600/400',
        minutesAgo: 140,
        observers: 9,
      },
      {
        userId: 'qb_003',
        userName: 'Hà Đức Long',
        address: 'Xã Sơn Trạch, Huyện Bố Trạch, Quảng Bình',
        location: { lat: 17.5509, lng: 106.2861 },
        severity: 'high',
        description: 'Đường vào động Phong Nha bị sạt lở một phần, cấm du lịch tạm thời.',
        image: 'https://picsum.photos/seed/quangbinh3/600/400',
        minutesAgo: 220,
        observers: 28,
      },
      {
        userId: 'qb_004',
        userName: 'Nguyễn Hải Đăng',
        address: 'Chợ Đồng Hới, Phường Hải Đình',
        location: { lat: 17.4756, lng: 106.6262 },
        severity: 'low',
        description: 'Mưa nhẹ, chưa có ngập. Ban quản lý chợ đã chằng chống sạp hàng.',
        image: 'https://picsum.photos/seed/quangbinh4/600/400',
        minutesAgo: 310,
        observers: 4,
      },
    ],
  },
];

export function findNearestRegion({ lat, lng }) {
  if (!lat || !lng || REGION_PRESETS.length === 0) return null;
  let nearest = REGION_PRESETS[0];
  let minDistance = Number.MAX_VALUE;

  REGION_PRESETS.forEach((region) => {
    const dLat = ((region.center.lat - lat) * Math.PI) / 180;
    const dLng = ((region.center.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((region.center.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c; // Earth radius km

    if (distance < minDistance) {
      minDistance = distance;
      nearest = region;
    }
  });

  return nearest;
}


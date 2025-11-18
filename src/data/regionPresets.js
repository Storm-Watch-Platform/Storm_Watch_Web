export const REGION_PRESETS = [
  {
    id: 'hcm',
    name: 'TP. Hồ Chí Minh',
    center: { lat: 10.776889, lng: 106.700806 },
    radiusKm: 25,
    zoom: 13,
    reports: [
      {
        address: '45 Trần Hưng Đạo, Phường Cầu Kho, Quận 1, TP.HCM',
        location: { lat: 10.75842, lng: 106.69421 },
        severity: 'high',
        description: 'Nước ngập hơn 50cm, xe cộ chết máy hàng loạt, cần chặn đường để đảm bảo an toàn.',
        images: ['https://images.unsplash.com/photo-1502303756762-a97b5280d0d1?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: 'Ngã tư Nguyễn Văn Cừ - Trần Hưng Đạo, Quận 5, TP.HCM',
        location: { lat: 10.75612, lng: 106.68352 },
        severity: 'medium',
        description: 'Gió giật mạnh, cây xanh nghiêng 30 độ, đề nghị không dừng đỗ tại khu vực.',
        images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: '120 Điện Biên Phủ, Phường 17, Bình Thạnh, TP.HCM',
        location: { lat: 10.80179, lng: 106.70988 },
        severity: 'low',
        description: 'Mưa lớn kéo dài, nước tràn vỉa hè nhưng xe máy vẫn di chuyển được.',
        images: ['https://images.unsplash.com/photo-1502303756762-a97b5280d0d1?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: 'Hẻm 285 Cách Mạng Tháng 8, Quận 10, TP.HCM',
        location: { lat: 10.77762, lng: 106.66801 },
        severity: 'medium',
        description: 'Nước ngập gần đầu gối, người dân phải dựng bao cát chắn cửa.',
        images: ['https://images.unsplash.com/photo-1565772831621-2bdb505ec7f8?auto=format&fit=crop&w=800&q=70'],
      },
    ],
  },
  {
    id: 'hn',
    name: 'Hà Nội',
    center: { lat: 21.027763, lng: 105.83416 },
    radiusKm: 20,
    zoom: 13,
    reports: [
      {
        address: 'Ngã tư Chùa Bộc - Thái Hà, Quận Đống Đa, Hà Nội',
        location: { lat: 21.01062, lng: 105.82665 },
        severity: 'medium',
        description: 'Mưa dông lớn, giao thông ùn ứ, lực lượng chức năng đang điều tiết.',
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: '35 Lý Thường Kiệt, Phường Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
        location: { lat: 21.02591, lng: 105.85324 },
        severity: 'high',
        description: 'Cây xà cừ bật gốc chắn ngang đường, đã gọi lực lượng cứu hộ.',
        images: ['https://images.unsplash.com/photo-1502303756762-a97b5280d0d1?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: 'Ngõ 165 Cầu Giấy, Phường Quan Hoa, Hà Nội',
        location: { lat: 21.03465, lng: 105.8019 },
        severity: 'low',
        description: 'Nước lấp xấp vỉa hè, đề nghị hạn chế đỗ xe trên tuyến.',
        images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: 'Khu vực cầu Vĩnh Tuy, Quận Hai Bà Trưng, Hà Nội',
        location: { lat: 21.0172, lng: 105.8719 },
        severity: 'medium',
        description: 'Lốc xoáy nhỏ vừa xuất hiện, nên tránh đi qua cầu trong 30 phút tới.',
        images: ['https://images.unsplash.com/photo-1565772831621-2bdb505ec7f8?auto=format&fit=crop&w=800&q=70'],
      },
    ],
  },
  {
    id: 'dn',
    name: 'Đà Nẵng',
    center: { lat: 16.054407, lng: 108.202164 },
    radiusKm: 18,
    zoom: 13,
    reports: [
      {
        address: 'Cầu Rồng, Phường Phước Ninh, Hải Châu, Đà Nẵng',
        location: { lat: 16.06052, lng: 108.22728 },
        severity: 'medium',
        description: 'Gió giật cấp 7, khuyến cáo không đứng ngắm cầu vào thời điểm này.',
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: 'Đường Võ Nguyên Giáp, Phường Phước Mỹ, Sơn Trà, Đà Nẵng',
        location: { lat: 16.07242, lng: 108.24556 },
        severity: 'high',
        description: 'Sóng biển đánh mạnh, nước biển đã tràn qua bãi giữ xe, cần di chuyển tài sản.',
        images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: 'Ngã ba Ông Ích Khiêm - Hùng Vương, Hải Châu, Đà Nẵng',
        location: { lat: 16.0641, lng: 108.2136 },
        severity: 'low',
        description: 'Mưa lớn liên tục, nước thoát chậm, xe máy nên đi chậm.',
        images: ['https://images.unsplash.com/photo-1565772831621-2bdb505ec7f8?auto=format&fit=crop&w=800&q=70'],
      },
    ],
  },
  {
    id: 'hue',
    name: 'Thừa Thiên Huế',
    center: { lat: 16.463713, lng: 107.590866 },
    radiusKm: 25,
    zoom: 13,
    reports: [
      {
        address: 'Đường Kim Long, đối diện THCS Nguyễn Du, TP. Huế',
        location: { lat: 16.47204, lng: 107.5616 },
        severity: 'high',
        description: 'Nước sông Hương dâng cao, tràn vào sân nhà dân, cần hỗ trợ di tản người già.',
        images: ['https://images.unsplash.com/photo-1502303756762-a97b5280d0d1?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: 'Cầu Phú Xuân, Phường Phú Hội, TP. Huế',
        location: { lat: 16.46623, lng: 107.58636 },
        severity: 'medium',
        description: 'Mưa dày đặc, tầm nhìn giảm dưới 50m, xe tải nên đi chậm.',
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: 'Kiệt 34 Lê Lợi, Phường Vĩnh Ninh, TP. Huế',
        location: { lat: 16.4669, lng: 107.6027 },
        severity: 'low',
        description: 'Nước lấp xấp nhưng chậm rút, nguy cơ tràn vào nhà nếu mưa tiếp tục.',
        images: ['https://images.unsplash.com/photo-1565772831621-2bdb505ec7f8?auto=format&fit=crop&w=800&q=70'],
      },
    ],
  },
  {
    id: 'qt',
    name: 'Quảng Trị',
    center: { lat: 16.816636, lng: 107.100906 },
    radiusKm: 35,
    zoom: 12,
    reports: [
      {
        address: 'Thị trấn Khe Sanh, Hướng Hóa, Quảng Trị',
        location: { lat: 16.6183, lng: 106.7438 },
        severity: 'medium',
        description: 'Đất đá tràn xuống QL9, lực lượng đang khơi thông, đề nghị không vượt.',
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: 'Phường 1, TP Đông Hà, Quảng Trị',
        location: { lat: 16.81512, lng: 107.0954 },
        severity: 'high',
        description: 'Nước dâng 60cm tại các tuyến Lê Lợi, Nguyễn Huệ, đã báo chính quyền.',
        images: ['https://images.unsplash.com/photo-1502303756762-a97b5280d0d1?auto=format&fit=crop&w=800&q=70'],
      },
    ],
  },
  {
    id: 'qb',
    name: 'Quảng Bình',
    center: { lat: 17.468571, lng: 106.622273 },
    radiusKm: 40,
    zoom: 12,
    reports: [
      {
        address: 'Thị trấn Hoàn Lão, Huyện Bố Trạch, Quảng Bình',
        location: { lat: 17.5636, lng: 106.3505 },
        severity: 'medium',
        description: 'Gió giật mạnh, mái tôn bay, cần cố định lại hệ thống mái nhà.',
        images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=70'],
      },
      {
        address: 'Đường Quang Trung, TP Đồng Hới, Quảng Bình',
        location: { lat: 17.4709, lng: 106.6232 },
        severity: 'high',
        description: 'Nước biển dâng, các hộ kinh doanh ven biển đã đóng cửa, đề nghị không tụ tập.',
        images: ['https://images.unsplash.com/photo-1565772831621-2bdb505ec7f8?auto=format&fit=crop&w=800&q=70'],
      },
    ],
  },
];

export function findRegionByCoordinate(coordinate) {
  if (!coordinate) return null;
  let closest = null;
  let minDistance = Infinity;
  REGION_PRESETS.forEach((region) => {
    const dLat = ((region.center.lat - coordinate.lat) * Math.PI) / 180;
    const dLng = ((region.center.lng - coordinate.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((coordinate.lat * Math.PI) / 180) *
        Math.cos((region.center.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = 6371 * c;
    if (distanceKm < minDistance) {
      minDistance = distanceKm;
      closest = { region, distanceKm };
    }
  });

  if (closest && closest.distanceKm <= closest.region.radiusKm) {
    return closest.region;
  }
  return null;
}


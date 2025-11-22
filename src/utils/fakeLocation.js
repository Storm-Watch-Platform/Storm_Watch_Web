// Fake Location Configuration
// Tập trung config fake location cho test accounts ở đây để dễ quản lý

/**
 * Configuration cho fake location
 * Sửa ở đây sẽ áp dụng cho tất cả nơi sử dụng fake location
 */
export const FAKE_LOCATION_CONFIG = {
  // Danh sách số điện thoại của test accounts
  testAccounts: ["0123456781", "0123456782"],

  // Fake location cho từng test account
  // Key là số điện thoại đã normalize (bỏ +84, chỉ giữ số)
  accountLocations: {
    "0123456781": {
      lat: 10.812627,
      lng: 106.71426,
      address: "Vị trí test account 0123456781",
    },
    "0123456782": {
      lat: 10.8453,
      lng: 106.69337,
      address: "Lê đức thọ",
    },
    // Default location cho các test account khác
    default: {
      lat: 10.8453,
      lng: 106.69337,
      address: "Lê đức thọ",
    },
  },
};

/**
 * Normalize phone number để so sánh
 * Chuyển +84 về 0, bỏ tất cả ký tự không phải số
 */
function normalizePhone(phone) {
  if (!phone) return "";
  return phone.replace(/^\+84/, "0").replace(/\D/g, "");
}

/**
 * Kiểm tra xem user hiện tại có phải test account không
 * @returns {boolean} True nếu là test account
 */
export function isTestAccount() {
  const userPhone = localStorage.getItem("userPhone");
  if (!userPhone) return false;

  const normalizedUserPhone = normalizePhone(userPhone);

  // Check if phone is in test accounts list
  return FAKE_LOCATION_CONFIG.testAccounts.some((testPhone) => {
    const normalizedTestPhone = normalizePhone(testPhone);
    return normalizedUserPhone === normalizedTestPhone;
  });
}

/**
 * Lấy fake location cho test account dựa trên số điện thoại
 * Trả về object giống như từ navigator.geolocation.getCurrentPosition()
 * @returns {Object} { lat, lng, address }
 */
export function getFakeLocation() {
  const userPhone = localStorage.getItem("userPhone");
  const normalizedPhone = normalizePhone(userPhone || "");

  // Lấy location cho số điện thoại cụ thể, hoặc dùng default
  const locationConfig =
    FAKE_LOCATION_CONFIG.accountLocations[normalizedPhone] ||
    FAKE_LOCATION_CONFIG.accountLocations.default;

  console.log(
    `[FAKE_LOCATION] Getting location for phone: ${
      normalizedPhone || "unknown"
    }`
  );
  console.log(
    `[FAKE_LOCATION] Location: lat=${locationConfig.lat}, lng=${locationConfig.lng}`
  );

  return {
    lat: locationConfig.lat,
    lng: locationConfig.lng,
    address:
      locationConfig.address ||
      `Vị trí: ${locationConfig.lat.toFixed(6)}, ${locationConfig.lng.toFixed(
        6
      )}`,
  };
}

/**
 * Wrapper cho navigator.geolocation.getCurrentPosition()
 * Tự động dùng fake location nếu là test account
 * @param {Function} successCallback - Callback khi thành công (pos) => void
 * @param {Function} errorCallback - Callback khi lỗi (error) => void
 * @param {Object} options - Options cho geolocation
 * @returns {Promise} Promise resolves với position nếu là test account
 */
export function getCurrentPosition(
  successCallback,
  errorCallback,
  options = {}
) {
  // Nếu là test account, return fake location
  if (isTestAccount()) {
    console.log("[FAKE_LOCATION] Using fake location for test account");

    // Simulate delay như gọi GPS thật
    const delay = options.delay || 500;

    const fakeLocation = getFakeLocation();

    // Tạo mock Position object giống như từ navigator.geolocation
    const mockPosition = {
      coords: {
        latitude: fakeLocation.lat,
        longitude: fakeLocation.lng,
        accuracy: 10, // Mock accuracy
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        address: fakeLocation.address, // Thêm address vào coords để dùng sau
      },
      timestamp: Date.now(),
    };

    // Return promise với delay
    return new Promise((resolve) => {
      setTimeout(() => {
        if (successCallback) {
          successCallback(mockPosition);
        }
        resolve(mockPosition);
      }, delay);
    });
  }

  // Nếu không phải test account, dùng geolocation thật
  if (!navigator.geolocation) {
    const error = new Error("Trình duyệt không hỗ trợ xác định vị trí.");
    if (errorCallback) {
      errorCallback(error);
    }
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (successCallback) {
          successCallback(pos);
        }
        resolve(pos);
      },
      (err) => {
        if (errorCallback) {
          errorCallback(err);
        }
        reject(err);
      },
      options
    );
  });
}

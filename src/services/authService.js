// Auth Service
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://stormwatchbackend-production.up.railway.app";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true"; // Only use mock if explicitly set to 'true'

// Mock OTP storage (in real app, this would be on server)
const mockOTPStore = new Map();

/**
 * Get valid token from localStorage
 */
function getValidToken() {
  return localStorage.getItem("token");
}

/**
 * Get user profile from backend
 * @returns {Promise<Object|null>} Profile object or null
 */
async function getProfile() {
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
      console.log("ℹ️ [Auth] Profile not found (404)");
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ [Auth] Profile fetched:", data);
    return data;
  } catch (error) {
    console.error("❌ [Auth] Error fetching profile:", error);
    throw error;
  }
}

/**
 * Login with phone number and password
 * @param {string} phone - Phone number
 * @param {string} password - Password
 * @returns {Promise<Object>} { success: boolean, message?: string, accessToken?: string, refreshToken?: string }
 */
export async function login(phone, password) {
  // Try real API first, fallback to mock only if explicitly enabled
  try {
    // Normalize phone number: convert +84 to 0 format for backend
    // Backend expects format like "0812345678" not "+84812345678"
    let normalizedPhone = phone;
    if (normalizedPhone.startsWith("+84")) {
      normalizedPhone = "0" + normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith("84")) {
      normalizedPhone = "0" + normalizedPhone.substring(2);
    }

    console.log(
      `🔍 [Auth] Login attempt with phone: ${normalizedPhone} (original: ${phone})`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Endpoint: /login with JSON body (phone and password in body)
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: normalizedPhone,
        password: password,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // If mock is enabled and backend fails, fallback to mock
      if (USE_MOCK_API && (errorData.message || response.status >= 500)) {
        console.log("[Auth] Backend error, falling back to mock API");
        return getMockLogin(phone);
      }

      return {
        success: false,
        message: errorData.message || `HTTP error! status: ${response.status}`,
      };
    }

    // Success!
    console.log(`✅ [Auth] Login successful`);

    const data = await response.json();

    // Store tokens and user info
    if (data.accessToken) {
      localStorage.setItem("token", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      // Use userID from response if available, otherwise decode from JWT
      if (data.userID) {
        localStorage.setItem("userId", data.userID);
      } else {
        // Fallback: Decode JWT to get user info (basic decode, no verification)
        try {
          const tokenPayload = JSON.parse(atob(data.accessToken.split(".")[1]));
          localStorage.setItem(
            "userId",
            tokenPayload.id || tokenPayload.userId || ""
          );
        } catch {
          localStorage.setItem("userId", "");
        }
      }

      // Decode JWT to get user name if not in response
      try {
        const tokenPayload = JSON.parse(atob(data.accessToken.split(".")[1]));
        localStorage.setItem("userName", tokenPayload.name || "Người dùng");
        localStorage.setItem("userPhone", normalizedPhone);
      } catch {
        localStorage.setItem("userName", "Người dùng");
        localStorage.setItem("userPhone", normalizedPhone);
      }

      // Fetch profile to cache phone, name, and userId from backend
      try {
        const profile = await getProfile();
        if (profile) {
          if (profile.name) {
            localStorage.setItem("userName", profile.name);
          }
          if (profile.phone) {
            localStorage.setItem("userPhone", profile.phone);
          }
          // Cache userId from profile (this is the correct ID to match with SOS UserID)
          if (profile.id) {
            localStorage.setItem("userId", profile.id);
            console.log("✅ [Auth] UserId cached from profile:", profile.id);
          }
          console.log("✅ [Auth] Profile cached:", {
            id: profile.id,
            name: profile.name,
            phone: profile.phone,
          });
        }
      } catch (profileError) {
        console.warn("⚠️ [Auth] Failed to fetch profile, using JWT data:", profileError);
        // Continue with JWT data if profile fetch fails
      }
    }

    return {
      success: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      userID: data.userID,
    };
  } catch (error) {
    // Fallback to mock only if explicitly enabled
    if (
      USE_MOCK_API &&
      (error.name === "AbortError" || error.message.includes("Failed to fetch"))
    ) {
      console.log("⚠️ [Auth] Backend không khả dụng, sử dụng mock API");
      return getMockLogin(phone);
    }

    console.error("❌ [Auth] Error logging in:", error);
    return {
      success: false,
      message:
        error.message ||
        "Có lỗi xảy ra khi đăng nhập. Vui lòng kiểm tra kết nối.",
    };
  }
}

/**
 * Get mock login (for development)
 */
function getMockLogin(phone) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockToken = `mock_token_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const mockRefreshToken = `mock_refresh_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      localStorage.setItem("token", mockToken);
      localStorage.setItem("refreshToken", mockRefreshToken);
      localStorage.setItem("userId", `user_${phone.replace(/\D/g, "")}`);
      localStorage.setItem("userName", "Người dùng");
      localStorage.setItem("userPhone", phone);

      resolve({
        success: true,
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
      });
    }, 1000);
  });
}

/**
 * Verify OTP
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @returns {Promise<Object>} { success: boolean, token?: string, user?: Object }
 */
export async function verifyOTP(phone, otp) {
  // Use mock API by default in development
  if (USE_MOCK_API) {
    return getMockVerifyOTP(phone, otp);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, otp }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Store token and user info
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user?.id || "user_123");
      localStorage.setItem("userName", data.user?.name || "Người dùng");
      localStorage.setItem("userPhone", phone);
    }

    return data;
  } catch (error) {
    // Silently fallback to mock if connection fails (development mode)
    if (
      error.name === "AbortError" ||
      error.message.includes("Failed to fetch")
    ) {
      console.log("[Auth] Backend không khả dụng, sử dụng mock API");
      return getMockVerifyOTP(phone, otp);
    }
    console.error("Error verifying OTP:", error);
    // Return mock verification
    return getMockVerifyOTP(phone, otp);
  }
}

/**
 * Get mock OTP verification
 */
function getMockVerifyOTP(phone, otp) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = mockOTPStore.get(phone);

      if (!stored) {
        resolve({
          success: false,
          message: "OTP không hợp lệ hoặc đã hết hạn",
        });
        return;
      }

      if (Date.now() > stored.expiresAt) {
        mockOTPStore.delete(phone);
        resolve({
          success: false,
          message: "OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
        });
        return;
      }

      if (stored.otp !== otp) {
        resolve({
          success: false,
          message: "OTP không đúng. Vui lòng thử lại.",
        });
        return;
      }

      // OTP is valid
      mockOTPStore.delete(phone);
      const mockToken = `mock_token_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const mockUser = {
        id: `user_${phone.replace(/\D/g, "")}`,
        name: "Người dùng",
        phone,
      };

      localStorage.setItem("token", mockToken);
      localStorage.setItem("userId", mockUser.id);
      localStorage.setItem("userName", mockUser.name);
      localStorage.setItem("userPhone", phone);

      resolve({
        success: true,
        message: "Xác thực thành công",
        token: mockToken,
        user: mockUser,
      });
    }, 800);
  });
}

/**
 * Register new user
 * @param {Object} payload - { phone, name, password }
 * @returns {Promise<Object>} { success: boolean, message?: string, accessToken?: string, refreshToken?: string }
 */
export async function register(payload) {
  // Use mock API by default in development
  if (USE_MOCK_API) {
    return getMockRegister(payload);
  }

  try {
    // Normalize phone number: convert +84 to 0 format for backend
    // Backend expects format like "0812345678" not "+84812345678"
    let normalizedPhone = payload.phone;
    if (normalizedPhone.startsWith("+84")) {
      normalizedPhone = "0" + normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith("84")) {
      normalizedPhone = "0" + normalizedPhone.substring(2);
    }

    console.log(
      `🔍 [Auth] Register attempt with phone: ${normalizedPhone} (original: ${payload.phone})`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.name,
        phone: normalizedPhone,
        password: payload.password,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `HTTP error! status: ${response.status}`,
      };
    }

    // Success!
    console.log(`✅ [Auth] Register successful`);

    const data = await response.json();

    // Store tokens and user info
    if (data.accessToken) {
      localStorage.setItem("token", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      // Use userID from response if available, otherwise decode from JWT
      if (data.userID) {
        localStorage.setItem("userId", data.userID);
      } else {
        // Fallback: Decode JWT to get user info (basic decode, no verification)
        try {
          const tokenPayload = JSON.parse(atob(data.accessToken.split(".")[1]));
          localStorage.setItem(
            "userId",
            tokenPayload.id || tokenPayload.userId || ""
          );
        } catch {
          localStorage.setItem("userId", "");
        }
      }

      // Decode JWT to get user name if not in response
      try {
        const tokenPayload = JSON.parse(atob(data.accessToken.split(".")[1]));
        localStorage.setItem("userName", tokenPayload.name || payload.name);
        localStorage.setItem("userPhone", normalizedPhone);
      } catch {
        localStorage.setItem("userName", payload.name);
        localStorage.setItem("userPhone", normalizedPhone);
      }

      // Fetch profile to cache phone, name, and userId from backend
      try {
        const profile = await getProfile();
        if (profile) {
          if (profile.name) {
            localStorage.setItem("userName", profile.name);
          }
          if (profile.phone) {
            localStorage.setItem("userPhone", profile.phone);
          }
          // Cache userId from profile (this is the correct ID to match with SOS UserID)
          if (profile.id) {
            localStorage.setItem("userId", profile.id);
            console.log("✅ [Auth] UserId cached from profile after register:", profile.id);
          }
          console.log("✅ [Auth] Profile cached after register:", {
            id: profile.id,
            name: profile.name,
            phone: profile.phone,
          });
        }
      } catch (profileError) {
        console.warn("⚠️ [Auth] Failed to fetch profile after register, using form data:", profileError);
        // Continue with form data if profile fetch fails
      }
    }

    return {
      success: true,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      userID: data.userID,
    };
  } catch (error) {
    // Silently fallback to mock if connection fails (development mode)
    if (
      error.name === "AbortError" ||
      error.message.includes("Failed to fetch")
    ) {
      console.log("[Auth] Backend không khả dụng, sử dụng mock API");
      return getMockRegister(payload);
    }
    console.error("Error registering:", error);
    return {
      success: false,
      message: error.message || "Có lỗi xảy ra khi đăng ký",
    };
  }
}

/**
 * Get mock register (for development)
 */
function getMockRegister(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockToken = `mock_token_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const mockRefreshToken = `mock_refresh_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const mockUser = {
        id: `user_${payload.phone.replace(/\D/g, "")}`,
        name: payload.name,
        phone: payload.phone,
      };

      localStorage.setItem("token", mockToken);
      localStorage.setItem("refreshToken", mockRefreshToken);
      localStorage.setItem("userId", mockUser.id);
      localStorage.setItem("userName", mockUser.name);
      localStorage.setItem("userPhone", mockUser.phone);

      resolve({
        success: true,
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
      });
    }, 1000);
  });
}

/**
 * Logout
 */
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userPhone");
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
  return !!localStorage.getItem("token");
}

/**
 * Get current user
 * @returns {Object|null} User object or null
 */
export function getCurrentUser() {
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");
  const userPhone = localStorage.getItem("userPhone");

  if (!userId) return null;

  return {
    id: userId,
    name: userName || "Người dùng",
    phone: userPhone || "",
  };
}

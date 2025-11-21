// Auth Service - Mock API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'; // Default to true for development

// Mock OTP storage (in real app, this would be on server)
const mockOTPStore = new Map();

/**
 * Login with phone number and password
 * @param {string} phone - Phone number
 * @param {string} password - Password
 * @returns {Promise<Object>} { success: boolean, message?: string, accessToken?: string, refreshToken?: string }
 */
export async function login(phone, password) {
  // Use mock API by default in development
  if (USE_MOCK_API) {
    return getMockLogin(phone, password);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, password }),
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

    const data = await response.json();
    
    // Store tokens and user info
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      // Use userID from response if available, otherwise decode from JWT
      if (data.userID) {
        localStorage.setItem('userId', data.userID);
      } else {
        // Fallback: Decode JWT to get user info (basic decode, no verification)
        try {
          const tokenPayload = JSON.parse(atob(data.accessToken.split('.')[1]));
          localStorage.setItem('userId', tokenPayload.id || tokenPayload.userId || '');
        } catch (e) {
          localStorage.setItem('userId', '');
        }
      }
      
      // Decode JWT to get user name if not in response
      try {
        const tokenPayload = JSON.parse(atob(data.accessToken.split('.')[1]));
        localStorage.setItem('userName', tokenPayload.name || '');
        localStorage.setItem('userPhone', phone);
      } catch (e) {
        localStorage.setItem('userName', '');
        localStorage.setItem('userPhone', phone);
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
    if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
      console.log('[Auth] Backend không khả dụng, sử dụng mock API');
      return getMockLogin(phone, password);
    }
    console.error('Error logging in:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi đăng nhập',
    };
  }
}

/**
 * Get mock login (for development)
 */
function getMockLogin(phone, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockRefreshToken = `mock_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      localStorage.setItem('token', mockToken);
      localStorage.setItem('refreshToken', mockRefreshToken);
      localStorage.setItem('userId', `user_${phone.replace(/\D/g, '')}`);
      localStorage.setItem('userName', 'Người dùng');
      localStorage.setItem('userPhone', phone);

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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user?.id || 'user_123');
      localStorage.setItem('userName', data.user?.name || 'Người dùng');
      localStorage.setItem('userPhone', phone);
    }

    return data;
  } catch (error) {
    // Silently fallback to mock if connection fails (development mode)
    if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
      console.log('[Auth] Backend không khả dụng, sử dụng mock API');
      return getMockVerifyOTP(phone, otp);
    }
    console.error('Error verifying OTP:', error);
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
          message: 'OTP không hợp lệ hoặc đã hết hạn',
        });
        return;
      }

      if (Date.now() > stored.expiresAt) {
        mockOTPStore.delete(phone);
        resolve({
          success: false,
          message: 'OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
        });
        return;
      }

      if (stored.otp !== otp) {
        resolve({
          success: false,
          message: 'OTP không đúng. Vui lòng thử lại.',
        });
        return;
      }

      // OTP is valid
      mockOTPStore.delete(phone);
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockUser = {
        id: `user_${phone.replace(/\D/g, '')}`,
        name: 'Người dùng',
        phone,
      };

      localStorage.setItem('token', mockToken);
      localStorage.setItem('userId', mockUser.id);
      localStorage.setItem('userName', mockUser.name);
      localStorage.setItem('userPhone', phone);

      resolve({
        success: true,
        message: 'Xác thực thành công',
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        phone: payload.phone,
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

    const data = await response.json();
    
    // Store tokens and user info
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      // Use userID from response if available, otherwise decode from JWT
      if (data.userID) {
        localStorage.setItem('userId', data.userID);
      } else {
        // Fallback: Decode JWT to get user info (basic decode, no verification)
        try {
          const tokenPayload = JSON.parse(atob(data.accessToken.split('.')[1]));
          localStorage.setItem('userId', tokenPayload.id || tokenPayload.userId || '');
        } catch (e) {
          localStorage.setItem('userId', '');
        }
      }
      
      // Decode JWT to get user name if not in response
      try {
        const tokenPayload = JSON.parse(atob(data.accessToken.split('.')[1]));
        localStorage.setItem('userName', tokenPayload.name || payload.name);
        localStorage.setItem('userPhone', payload.phone);
      } catch (e) {
        localStorage.setItem('userName', payload.name);
        localStorage.setItem('userPhone', payload.phone);
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
    if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
      console.log('[Auth] Backend không khả dụng, sử dụng mock API');
      return getMockRegister(payload);
    }
    console.error('Error registering:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi đăng ký',
    };
  }
}

/**
 * Get mock register (for development)
 */
function getMockRegister(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockRefreshToken = `mock_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockUser = {
        id: `user_${payload.phone.replace(/\D/g, '')}`,
        name: payload.name,
        phone: payload.phone,
      };

      localStorage.setItem('token', mockToken);
      localStorage.setItem('refreshToken', mockRefreshToken);
      localStorage.setItem('userId', mockUser.id);
      localStorage.setItem('userName', mockUser.name);
      localStorage.setItem('userPhone', mockUser.phone);

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
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userPhone');
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

/**
 * Get current user
 * @returns {Object|null} User object or null
 */
export function getCurrentUser() {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const userPhone = localStorage.getItem('userPhone');

  if (!userId) return null;

  return {
    id: userId,
    name: userName || 'Người dùng',
    phone: userPhone || '',
  };
}


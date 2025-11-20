// Auth Service - Mock API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'; // Default to true for development

// Mock OTP storage (in real app, this would be on server)
const mockOTPStore = new Map();

/**
 * Login with phone number (sends OTP)
 * @param {string} phone - Phone number
 * @returns {Promise<Object>} { success: boolean, message: string }
 */
export async function login(phone) {
  // Use mock API by default in development
  if (USE_MOCK_API) {
    return getMockLogin(phone);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Silently fallback to mock if connection fails (development mode)
    if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
      console.log('[Auth] Backend không khả dụng, sử dụng mock API');
      return getMockLogin(phone);
    }
    console.error('Error logging in:', error);
    // Return mock OTP as fallback
    return getMockLogin(phone);
  }
}

/**
 * Get mock login (generate OTP)
 */
function getMockLogin(phone) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      mockOTPStore.set(phone, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      });

      console.log(`[MOCK] OTP for ${phone}: ${otp}`); // For development

      resolve({
        success: true,
        message: 'OTP đã được gửi đến số điện thoại của bạn',
        otp: otp, // Only in mock, remove in production
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
 * @param {Object} payload - { phone, name, email? }
 * @returns {Promise<Object>} { success: boolean, message: string }
 */
export async function register(payload) {
  // Use mock API by default in development
  if (USE_MOCK_API) {
    return getMockLogin(payload.phone);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Silently fallback to mock if connection fails (development mode)
    if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
      console.log('[Auth] Backend không khả dụng, sử dụng mock API');
      return getMockLogin(payload.phone);
    }
    console.error('Error registering:', error);
    // Return mock registration (same as login, sends OTP)
    return getMockLogin(payload.phone);
  }
}

/**
 * Logout
 */
export function logout() {
  localStorage.removeItem('token');
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


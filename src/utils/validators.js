/**
 * Validate phone number (Vietnamese format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export function validatePhone(phone) {
  if (!phone) return false;
  // Vietnamese phone: +84 or 0 followed by 9 digits
  const phoneRegex = /^(\+84|0)[3|5|7|8|9][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate OTP (6 digits)
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid
 */
export function validateOTP(otp) {
  if (!otp) return false;
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid
 */
export function validateCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Normalize phone number to +84 format
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone number
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('0')) {
    return '+84' + cleaned.substring(1);
  }
  if (cleaned.startsWith('84')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('+84')) {
    return cleaned;
  }
  return cleaned;
}


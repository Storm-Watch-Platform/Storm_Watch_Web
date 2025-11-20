/**
 * Format timestamp to relative time (e.g., "2 phút trước")
 * @param {string|Date} timestamp - ISO string or Date object
 * @returns {string} Formatted relative time
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Không xác định';

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'Vừa xong';
  } else if (diffMin < 60) {
    return `${diffMin} phút trước`;
  } else if (diffHour < 24) {
    return `${diffHour} giờ trước`;
  } else if (diffDay < 7) {
    return `${diffDay} ngày trước`;
  } else {
    return formatDateTime(timestamp);
  }
}

/**
 * Format timestamp to date and time string
 * @param {string|Date} timestamp - ISO string or Date object
 * @returns {string} Formatted date and time
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return 'Không xác định';

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  };

  return new Intl.DateTimeFormat('vi-VN', options).format(date);
}

/**
 * Format timestamp to date string only
 * @param {string|Date} timestamp - ISO string or Date object
 * @returns {string} Formatted date
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'Không xác định';

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  };

  return new Intl.DateTimeFormat('vi-VN', options).format(date);
}

/**
 * Format timestamp to time string only
 * @param {string|Date} timestamp - ISO string or Date object
 * @returns {string} Formatted time
 */
export function formatTime(timestamp) {
  if (!timestamp) return 'Không xác định';

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  };

  return new Intl.DateTimeFormat('vi-VN', options).format(date);
}


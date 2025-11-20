// Report Channel - Socket events for reports
import { getSocket } from './socket';

/**
 * Subscribe to new reports
 * @param {Function} callback - Callback function (report) => void
 */
export function subscribeToNewReports(callback) {
  const socket = getSocket();
  if (!socket) {
    console.warn('[Report Channel] Socket not initialized');
    return;
  }

  socket.on('report:new', callback);
}

/**
 * Subscribe to updated reports
 * @param {Function} callback - Callback function (report) => void
 */
export function subscribeToUpdatedReports(callback) {
  const socket = getSocket();
  if (!socket) {
    console.warn('[Report Channel] Socket not initialized');
    return;
  }

  socket.on('report:updated', callback);
}

/**
 * Unsubscribe from report events
 */
export function unsubscribeFromReports() {
  const socket = getSocket();
  if (!socket) return;

  socket.off('report:new');
  socket.off('report:updated');
}


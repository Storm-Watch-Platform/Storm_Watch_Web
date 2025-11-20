// Family Channel - Socket events for family
import { getSocket } from './socket';

/**
 * Subscribe to family member location updates
 * @param {Function} callback - Callback function (member) => void
 */
export function subscribeToMemberLocation(callback) {
  const socket = getSocket();
  if (!socket) {
    console.warn('[Family Channel] Socket not initialized');
    return;
  }

  socket.on('family:member:location', callback);
}

/**
 * Subscribe to family member status updates
 * @param {Function} callback - Callback function (member) => void
 */
export function subscribeToMemberStatus(callback) {
  const socket = getSocket();
  if (!socket) {
    console.warn('[Family Channel] Socket not initialized');
    return;
  }

  socket.on('family:member:status', callback);
}

/**
 * Subscribe to family danger alerts
 * @param {Function} callback - Callback function (alert) => void
 */
export function subscribeToFamilyDanger(callback) {
  const socket = getSocket();
  if (!socket) {
    console.warn('[Family Channel] Socket not initialized');
    return;
  }

  socket.on('family:danger', callback);
}

/**
 * Unsubscribe from family events
 */
export function unsubscribeFromFamily() {
  const socket = getSocket();
  if (!socket) return;

  socket.off('family:member:location');
  socket.off('family:member:status');
  socket.off('family:danger');
}


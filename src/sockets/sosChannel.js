// SOS Channel - Socket events for SOS
import { getSocket } from './socket';

/**
 * Subscribe to new SOS signals
 * @param {Function} callback - Callback function (sos) => void
 */
export function subscribeToNewSOS(callback) {
  const socket = getSocket();
  if (!socket) {
    console.warn('[SOS Channel] Socket not initialized');
    return;
  }

  socket.on('sos:new', callback);
}

/**
 * Subscribe to SOS status updates
 * @param {Function} callback - Callback function (sos) => void
 */
export function subscribeToSOSStatus(callback) {
  const socket = getSocket();
  if (!socket) {
    console.warn('[SOS Channel] Socket not initialized');
    return;
  }

  socket.on('sos:status', callback);
}

/**
 * Unsubscribe from SOS events
 */
export function unsubscribeFromSOS() {
  const socket = getSocket();
  if (!socket) return;

  socket.off('sos:new');
  socket.off('sos:status');
}


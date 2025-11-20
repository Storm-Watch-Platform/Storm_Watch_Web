// Socket.IO Client - Mock for development
// In production, this would connect to a real WebSocket server

let mockSocket = null;

/**
 * Initialize socket connection (mock)
 * @param {string} token - Auth token
 * @returns {Object} Mock socket object
 */
export function initSocket(token) {
  if (mockSocket) {
    return mockSocket;
  }

  // Mock socket object
  mockSocket = {
    connected: true,
    id: `mock_socket_${Date.now()}`,
    
    on: (event, callback) => {
      console.log(`[Mock Socket] Listening to event: ${event}`);
      // In real app, this would register event listeners
    },
    
    emit: (event, data) => {
      console.log(`[Mock Socket] Emitting event: ${event}`, data);
      // In real app, this would send data to server
    },
    
    disconnect: () => {
      console.log('[Mock Socket] Disconnected');
      mockSocket = null;
    },
  };

  // Simulate connection
  setTimeout(() => {
    if (mockSocket && mockSocket.on) {
      // Simulate receiving events
      console.log('[Mock Socket] Connected');
    }
  }, 100);

  return mockSocket;
}

/**
 * Get socket instance
 * @returns {Object|null} Socket instance or null
 */
export function getSocket() {
  return mockSocket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (mockSocket) {
    mockSocket.disconnect();
    mockSocket = null;
  }
}


import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

let socket = null;

export function getSocket() {
  if (socket && socket.connected) return socket;
  if (socket) {
    try { socket.disconnect(); } catch (e) {}
  }

  const token = localStorage.getItem('accessToken') || '';

  socket = io(BACKEND_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('Realtime socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('Realtime socket connect error (will fallback to polling):', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch (e) {}
    socket = null;
  }
}

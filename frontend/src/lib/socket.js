import { io } from 'socket.io-client';
import { tokenStore } from './api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket = null;

export function getSocket() {
  if (socket && socket.connected) return socket;
  if (socket) {
    try { socket.disconnect(); } catch (e) {}
  }

  const token = tokenStore.getAccess() || localStorage.getItem('bizreels_access_token') || localStorage.getItem('accessToken') || '';
  if (!token) return null;

  socket = io(BACKEND_URL, {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    withCredentials: true,
    auth: { token: token.startsWith('Bearer ') ? token : `Bearer ${token}` },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Realtime socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('Realtime socket connect error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch (e) {}
    socket = null;
  }
}

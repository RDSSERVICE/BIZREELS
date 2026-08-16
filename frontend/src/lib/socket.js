import { io } from 'socket.io-client';
import { tokenStore } from './api';

const rawBackendUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '');

let socket = null;

export function getSocket() {
  // If socket already exists (connecting, connected, or reconnecting), reuse the singleton
  if (socket) return socket;

  const user = tokenStore.getUser();
  if (!user) return null;

  const token = tokenStore.getAccess() || '';

  socket = io(BACKEND_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: token ? { token: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    // Socket connected
  });

  socket.on('connect_error', (err) => {
    console.warn('Realtime socket connect error:', err?.message || err);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch (e) {}
    socket = null;
  }
}

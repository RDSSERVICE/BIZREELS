import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import { tokenStore } from '@/src/lib/api';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

let socket: Socket | null = null;
let appStateListener: any = null;

export async function getSocket(): Promise<Socket | null> {
  const token = await tokenStore.getAccess();
  if (!token) return null;
  if (socket && socket.connected) return socket;
  if (socket) {
    try { socket.disconnect(); } catch {}
  }
  socket = io(BACKEND_URL!, {
    path: '/api/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('[socket] connected');
  });
  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', reason);
  });
  socket.on('connect_error', (err) => {
    console.log('[socket] connect_error:', err.message);
  });

  return socket;
}

export function getSocketSync(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch {}
    socket = null;
  }
}

/** Reconnect socket when app comes to foreground, disconnect on background */
export function setupAppStateSocketHandler() {
  if (appStateListener) return;
  appStateListener = AppState.addEventListener('change', async (state: AppStateStatus) => {
    if (state === 'active') {
      const s = await getSocket();
      if (s && !s.connected) s.connect();
    } else if (state === 'background') {
      if (socket) socket.disconnect();
    }
  });
}

export function cleanupAppStateSocketHandler() {
  if (appStateListener) {
    appStateListener.remove();
    appStateListener = null;
  }
}

import { io } from "socket.io-client";
import { tokenStore } from "@/lib/api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

let socket = null;

export function getSocket() {
  const token = tokenStore.getAccess();
  if (!token) return null;
  if (socket && socket.connected) return socket;
  if (socket) { try { socket.disconnect(); } catch {} }
  socket = io(BACKEND_URL, {
    path: "/api/socket.io",
    transports: ["websocket", "polling"],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) { try { socket.disconnect(); } catch {} socket = null; }
}

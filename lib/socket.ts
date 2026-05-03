import { io, Socket } from "socket.io-client";
import { tokenStorage } from "@/lib/api/client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";
    socket = io(url, {
      path: "/socket.io",
      autoConnect: false,
      auth: (cb) => {
        cb({ token: tokenStorage.getAccess() ?? "" });
      },
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
}

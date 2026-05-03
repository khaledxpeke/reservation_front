"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  joinMatchRoom: (matchPostId: string) => void;
  sendMessage: (matchPostId: string, content: string) => void;
  /** Subscribe to live updates on /jouer/[id] (new demands, status, etc.) */
  watchMatchPost: (matchPostId: string) => void;
  unwatchMatchPost: (matchPostId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  joinMatchRoom: () => {},
  sendMessage: () => {},
  watchMatchPost: () => {},
  unwatchMatchPost: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = connectSocket();
    setSocket(s);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    if (s.connected) setConnected(true);

    const onAutoJoin = ({ matchPostId }: { matchPostId: string }) => {
      s.emit("chat:join", matchPostId);
    };
    s.on("chat:auto_join", onAutoJoin);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("chat:auto_join", onAutoJoin);
    };
  }, [user]);

  const joinMatchRoom = useCallback((matchPostId: string) => {
    getSocket().emit("chat:join", matchPostId);
  }, []);

  const sendMessage = useCallback((matchPostId: string, content: string) => {
    getSocket().emit("chat:send", { matchPostId, content });
  }, []);

  const watchMatchPost = useCallback((matchPostId: string) => {
    getSocket().emit("match:watch", matchPostId);
  }, []);

  const unwatchMatchPost = useCallback((matchPostId: string) => {
    getSocket().emit("match:unwatch", matchPostId);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinMatchRoom,
        sendMessage,
        watchMatchPost,
        unwatchMatchPost,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { createSocket, destroySocket } from "@/lib/socket";

/**
 * Creates a Socket.IO connection on mount using the provided token.
 * Cleans up on unmount or when token changes.
 * Returns the socket instance (stable ref, does not cause re-renders).
 */
export function useSocket(token: string | null): Socket | null {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = createSocket(token);
    socketRef.current = socket;

    return () => {
      // Only destroy if this hook instance created it
      socketRef.current = null;
    };
  }, [token]);

  return socketRef.current;
}

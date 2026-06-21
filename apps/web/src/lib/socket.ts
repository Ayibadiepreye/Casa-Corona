import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let _socket: Socket | null = null;

export function getSocket(): Socket | null {
  return _socket;
}

export function createSocket(token: string): Socket {
  if (_socket?.connected) return _socket;

  _socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return _socket;
}

export function destroySocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

export function joinConversation(socket: Socket, conversationId: string): void {
  socket.emit("conversation:join", { conversationId });
}

export function leaveConversation(socket: Socket, conversationId: string): void {
  socket.emit("conversation:leave", { conversationId });
}

export function sendMessageSocket(socket: Socket, conversationId: string, content: string): void {
  socket.emit("message:send", { conversationId, content, type: "text" });
}

export function markReadSocket(socket: Socket, conversationId: string): void {
  socket.emit("message:read", { conversationId });
}

export function sendTyping(socket: Socket, conversationId: string): void {
  socket.emit("message:typing", { conversationId });
}

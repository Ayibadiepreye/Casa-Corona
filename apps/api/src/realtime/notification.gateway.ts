
import type { Socket } from "socket.io";

export function setupNotificationGateway(socket: Socket) {
  socket.join(`user:${socket.data.userId}`);
}


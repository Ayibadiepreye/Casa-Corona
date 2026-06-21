
import type { Socket } from "socket.io";
import { getIO } from "../lib/socket.js";
import * as conversationService from "../modules/conversations/conversation.service.js";

export function setupChatGateway(socket: Socket) {
  socket.on("conversation:join", async ({ conversationId }: { conversationId: string }) => {
    socket.join(`conv:${conversationId}`);
  });

  socket.on("conversation:leave", async ({ conversationId }: { conversationId: string }) => {
    socket.leave(`conv:${conversationId}`);
  });

  socket.on("message:send", async ({ conversationId, content, type, attachmentUrl }: any) => {
    const userId = socket.data.userId;
    const role = socket.data.role;
    const message = await conversationService.sendMessage(userId, conversationId, { content, type, attachmentUrl }, role);
    const io = getIO();
    io.to(`conv:${conversationId}`).emit("message:new", message);
  });

  socket.on("message:typing", async ({ conversationId }: { conversationId: string }) => {
    const io = getIO();
    socket.to(`conv:${conversationId}`).emit("message:typing", { userId: socket.data.userId, conversationId });
  });

  socket.on("message:read", async ({ conversationId, messageIds }: any) => {
    const userId = socket.data.userId;
    const role = socket.data.role;
    try {
      await conversationService.markRead(userId, conversationId, role);
      const io = getIO();
      io.to(`conv:${conversationId}`).emit("message:read", { userId: socket.data.userId, conversationId, messageIds });
    } catch (error: any) {
      // Silently ignore permission errors - admin viewing conversations they're not part of
      if (error.statusCode === 403 || error.code === 'FORBIDDEN') {
        console.log(`[chat] User ${userId} (${role}) attempted to mark conversation ${conversationId} as read but lacks permission`);
      } else {
        console.error(`[chat] Error marking conversation as read:`, error);
      }
    }
  });

  socket.on("presence:online", async () => {
    console.log(`User ${socket.data.userId} is online`);
  });

  socket.on("presence:offline", async () => {
    console.log(`User ${socket.data.userId} is offline`);
  });
}



import { Server } from "socket.io";
import http from "http";
import { verifyAccessToken } from "./jwt.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

let io: Server;

export function initSocket(server: http.Server): Server {
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
  
  io = new Server(server, {
    cors: {
      origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        throw new Error("No token provided");
      }
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch (err) {
      logger.error({ err }, "Socket auth failed");
      next(new Error("Authentication failed"));
    }
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}


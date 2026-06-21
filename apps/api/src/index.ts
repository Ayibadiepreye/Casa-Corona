import http from "http";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";
import { env } from "./lib/env.js";
import { initSocket } from "./lib/socket.js";
import { setupChatGateway } from "./realtime/chat.gateway.js";
import { setupNotificationGateway } from "./realtime/notification.gateway.js";
import { startMessageCleanupCron } from "./jobs/message-cleanup.js";
import { startSubscriptionCron } from "./jobs/subscription-cron.js";
import { startNotificationCleanupCron } from "./jobs/notification-cleanup.js";
import { startCommissionCron } from "./jobs/commission-cron.js";

const app = createApp();
const server = http.createServer(app);
const io = initSocket(server);

// Start background cron jobs
startMessageCleanupCron();
startSubscriptionCron();
startNotificationCleanupCron();
startCommissionCron();

io.on("connection", (socket) => {
  logger.info({ userId: socket.data.userId }, "Socket connected");
  setupNotificationGateway(socket);
  setupChatGateway(socket);

  socket.on("disconnect", () => {
    logger.info({ userId: socket.data.userId }, "Socket disconnected");
  });
});

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Server listening");
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info({ signal }, "Received shutdown signal");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));


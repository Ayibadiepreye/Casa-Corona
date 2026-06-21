import { db, notificationsTable } from "@casa-corona/db";
import { lt } from "drizzle-orm";
import cron from "node-cron";
import { logger } from "../lib/logger.js";

/**
 * Auto-delete notifications older than 48 hours.
 * Runs hourly. Keeps the in-app notification bell tidy.
 */
async function purgeOldNotifications() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h ago
  const deleted = await db
    .delete(notificationsTable)
    .where(lt(notificationsTable.createdAt, cutoff))
    .returning({ id: notificationsTable.id });
  if (deleted.length > 0) {
    logger.info({ count: deleted.length }, "[notif-cleanup] purged old notifications");
  }
  return deleted.length;
}

export function startNotificationCleanupCron() {
  // Run once on startup
  purgeOldNotifications().catch((e) => logger.error({ err: e?.message }, "[notif-cleanup] startup error"));
  // Then every hour
  cron.schedule("0 * * * *", () => {
    purgeOldNotifications().catch((e) => logger.error({ err: e?.message }, "[notif-cleanup] cron error"));
  });
  logger.info("[notif-cleanup] Cron started (hourly, 48h retention)");
}

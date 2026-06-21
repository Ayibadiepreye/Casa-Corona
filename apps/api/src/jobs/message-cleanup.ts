import { db, messagesTable } from "@casa-corona/db";
import { logger } from "../lib/logger.js";
import { and, lt, or, isNotNull, sql } from "drizzle-orm";
import cron from "node-cron";

/**
 * Delete messages whose expiresAt is in the past, EXCEPT for messages in
 * conversations that are still active (no endedAt). Uses a subquery so we
 * don't accidentally delete live chat history.
 */
export async function cleanupMessages() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Delete messages that have expired AND the parent conversation has been ended
  // (or the message expiry is older than 24h, regardless of conversation state)
  const deleted = await db
    .delete(messagesTable)
    .where(
      or(
        and(
          lt(messagesTable.expiresAt, now),
          sql`${messagesTable.conversationId} IN (SELECT id FROM conversations WHERE ended_at IS NOT NULL)`
        ),
        lt(messagesTable.expiresAt, yesterday)
      )
    )
    .returning();

  if (deleted.length > 0) {
    logger.info(`[message-cleanup] Deleted ${deleted.length} expired messages`);
  }
  return deleted;
}

/**
 * Runs every hour. Schedules via node-cron.
 */
export function startMessageCleanupCron() {
  cron.schedule("0 * * * *", () => {
    cleanupMessages().catch((e) => console.error("[message-cleanup] error:", e));
  });
  logger.info("[message-cleanup] Cron started (hourly)");
}
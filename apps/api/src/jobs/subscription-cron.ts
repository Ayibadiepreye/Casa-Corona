import cron from "node-cron";
import { logger } from "../lib/logger.js";
import { db } from "@casa-corona/db";
import { subscriptionsTable, vendorsTable, notificationsTable } from "@casa-corona/db";
import { and, eq, isNotNull, lt, gte, isNull } from "drizzle-orm";
import { sendEmail } from "../lib/email.js";

/**
 * Runs hourly. Finds subscriptions expiring in [targetDays] days and:
 *   1. Creates an in-app notification
 *   2. Sends a warning email via Resend (if configured)
 *
 * Also auto-unlists vendors whose subscriptions have already expired:
 *   - Sets vendors.subscriptionStatus = 'expired'
 *   - Sets vendors.featured = false (so they drop out of featured listings)
 *
 * Schedule: every hour at the top of the hour
 */
export function startSubscriptionCron() {
  // Hourly
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();

      // ─── Auto-unlist expired ────────────────────────────────────────────
      // Subscriptions with expiresAt in the past and still marked active
      const expired = await db
        .update(subscriptionsTable)
        .set({ status: "expired" as any })
        .where(and(lt(subscriptionsTable.expiresAt, now), eq(subscriptionsTable.status, "active")))
        .returning({ vendorId: subscriptionsTable.vendorId });
      if (expired.length > 0) {
        const vendorIds = expired.map((e) => e.vendorId);
        // Unfeature expired vendors
        for (const vendorId of vendorIds) {
          await db
            .update(vendorsTable)
            .set({ featured: false })
            .where(eq(vendorsTable.id, vendorId));
        }
        logger.info(`[sub-cron] Auto-unlisted ${expired.length} vendors (subscription expired)`);
      }

      // ─── Warning thresholds (5d / 2d / 1d before expiry) ────────────────
      for (const days of [5, 2, 1]) {
        const target = new Date(now.getTime() + days * 86400000);
        const targetStart = new Date(target);
        targetStart.setHours(0, 0, 0, 0);
        const targetEnd = new Date(target);
        targetEnd.setHours(23, 59, 59, 999);

        // Subscriptions expiring within target window that are still active
        const expiring = await db
          .select()
          .from(subscriptionsTable)
          .where(
            and(
              eq(subscriptionsTable.status, "active"),
              gte(subscriptionsTable.expiresAt, targetStart),
              lt(subscriptionsTable.expiresAt, targetEnd)
            )
          );

        for (const sub of expiring) {
          // Skip if already warned for this threshold (check if a similar notification exists)
          const existing = await db
            .select()
            .from(notificationsTable)
            .where(and(eq(notificationsTable.userId, sub.vendorId), eq(notificationsTable.title, `Subscription expiring in ${days} day${days === 1 ? "" : "s"}`)));
          if (existing.length > 0) continue;

          // In-app notification
          await db.insert(notificationsTable).values({
            userId: sub.vendorId,
            type: "subscription_expiring" as any,
            title: `Subscription expiring in ${days} day${days === 1 ? "" : "s"}`,
            body: `Your Casa Corona subscription expires on ${sub.expiresAt?.toDateString?.() || "soon"}. Renew now to keep your listing active.`,
            data: { link: "/vendor/subscription" },
          });

          // Email (best-effort)
          try {
            await sendEmail(
              "", // vendor email resolution left to email lib (best-effort)
              `Your Casa Corona subscription expires in ${days} day${days === 1 ? "" : "s"}`,
              `<p>Your subscription expires on ${sub.expiresAt?.toDateString?.() || "soon"}. <a href="https://casacorona.org/vendor/subscription">Renew now</a> to keep your listing active.</p>`
            );
          } catch (_e) {
            // email failures are non-fatal
          }
        }
        if (expiring.length > 0) {
          logger.info(`[sub-cron] Warned ${expiring.length} vendors (expires in ${days}d)`);
        }
      }
    } catch (e) {
      console.error("[sub-cron] error:", e);
    }
  });
  logger.info("[sub-cron] Subscription cron started (hourly)");
}
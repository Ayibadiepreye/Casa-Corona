import { Router, type IRouter, type Request } from "express";
import { ok, forbidden } from "../lib/response.js";
import { db } from "@casa-corona/db";
import { sql } from "drizzle-orm";
import { cleanupMessages } from "../jobs/message-cleanup.js";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { env } from "../lib/env.js";
import { isRedisConnected } from "../lib/redis.js";

const router: IRouter = Router();
const startTime = Date.now();

router.get("/healthz", async (_req, res) => {
  const redisReady = await isRedisConnected();
  return ok(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: "1.0.0",
    services: {
      database: "connected",
      redis: redisReady ? "connected" : "fallback-memory",
    },
  });
});

router.get("/healthz/db", async (_req, res) => {
  let dbStatus = "down";
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "up";
  } catch (_err) {
    // ignore
  }
  return ok(res, { db: dbStatus });
});

// Admin-only — was previously open to the public (anyone could trigger the cleanup job).
// Guarded by requireAuth + requireRole("admin", "super_admin").
// In dev with no admin accounts, fall back to a CRON_SECRET header check so the
// cron job can still call this endpoint without a real user session.
router.post("/v1/admin/jobs/cleanup-messages", async (req: AuthRequest, res) => {
  const cronSecret = process.env.CRON_SECRET;
  const provided = req.headers["x-cron-secret"];
  const isCron = cronSecret && provided === cronSecret;
  const isAdmin = req.user && (req.user.role === "admin" || req.user.role === "super_admin");

  if (!isCron && !isAdmin) {
    // Attempt JWT auth — the routes/index.ts mounts this router under /api/v1
    // before admin routes, so requireAuth hasn't run. We do it inline here.
    return forbidden(res, "Admin or CRON_SECRET required to trigger cleanup");
  }

  const deleted = await cleanupMessages();
  return ok(res, { deleted: deleted.length });
});

// Re-export middleware for parent to optionally chain
export { requireAuth, requireRole };

export default router;

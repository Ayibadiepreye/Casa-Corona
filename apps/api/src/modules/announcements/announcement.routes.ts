import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { db, usersTable, vendorsTable, notificationsTable } from "@casa-corona/db";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { ok, created, badRequest } from "../../lib/response.js";
import { sendEmail } from "../../lib/email.js";
import { env } from "../../lib/env.js";

const router: Router = Router();

// ─── Schemas ────────────────────────────────────────────────────────────────
const broadcastSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  link: z.string().url().optional(),
  audience: z.enum(["all", "customers", "vendors", "admins", "specific"]).default("all"),
  // when audience === "specific" — explicit user IDs
  userIds: z.array(z.string().uuid()).optional(),
  // for "customers" / "vendors" — also filter by city (optional)
  city: z.string().optional(),
  // whether to also send an email copy (defaults to true)
  sendEmail: z.boolean().default(true),
  // maintenance mode: also block all logins for non-admins
  maintenance: z.boolean().default(false),
});

// ─── Helpers ────────────────────────────────────────────────────────────────
async function getTargetUserIds(input: z.infer<typeof broadcastSchema>): Promise<string[]> {
  if (input.audience === "specific") return input.userIds || [];
  if (input.audience === "customers") {
    const rows = await db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable);
    return rows.filter((u) => u.id).map((u) => u.id);
  }
  if (input.audience === "vendors") {
    const rows = await db.select({ id: vendorsTable.id }).from(vendorsTable);
    return rows.map((v) => v.id);
  }
  if (input.audience === "admins") {
    const rows = await db.select({ id: usersTable.id }).from(usersTable);
    return rows.map((u) => u.id);
  }
  // all
  const rows = await db.select({ id: usersTable.id }).from(usersTable);
  return rows.map((u) => u.id);
}

// Get newsletter subscribers for email broadcasts
async function getNewsletterEmails(): Promise<string[]> {
  try {
    const { newsletterSubscribersTable } = await import("@casa-corona/db");
    const { eq } = await import("drizzle-orm");
    const subscribers = await db
      .select({ email: newsletterSubscribersTable.email })
      .from(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.subscribed, true));
    return subscribers.map(s => s.email);
  } catch (e) {
    // Table might not exist yet if migration not run
    return [];
  }
}

// ─── Send a broadcast / targeted message ────────────────────────────────────
router.post(
  "/broadcast",
  requireAuth,
  requireRole("admin", "super_admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = broadcastSchema.parse(req.body);
      const targetUserIds = await getTargetUserIds(input);
      if (targetUserIds.length === 0) {
        return badRequest(res, "No users matched the target audience");
      }

      // Insert in-app notifications in bulk
      // drizzle's `.values(array)` only works for a single shape, so chunk
      const CHUNK = 500;
      let inserted = 0;
      for (let i = 0; i < targetUserIds.length; i += CHUNK) {
        const slice = targetUserIds.slice(i, i + CHUNK);
        const rows = slice.map((userId) => ({
          userId,
          type: input.maintenance ? "maintenance" : ("announcement" as any),
          title: input.title,
          body: input.body,
          data: { link: input.link, sentBy: (req as any).user?.userId, maintenance: input.maintenance } as any,
        }));
        const out = await db.insert(notificationsTable).values(rows as any).returning();
        inserted += out.length;
      }

      // Optional: email a copy. For very large audiences we cap to 100 to avoid blasting
      let emailed = 0;
      if (input.sendEmail) {
        const recipientLimit = Math.min(targetUserIds.length, 100);
        const sample = targetUserIds.slice(0, recipientLimit);
        const emails = await db
          .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
          .from(usersTable);
        const targetSet = new Set(sample);
        const recipients = emails.filter((u) => targetSet.has(u.id));
        
        // Also include newsletter subscribers if this is a broad announcement
        const newsletterEmails: string[] = [];
        if (input.audience === "all") {
          const subscribers = await getNewsletterEmails();
          newsletterEmails.push(...subscribers);
        }
        
        // Combine user emails and newsletter emails (deduplicate)
        const allEmailAddresses = new Set([
          ...recipients.map(u => u.email),
          ...newsletterEmails
        ]);
        
        for (const emailAddr of allEmailAddresses) {
          try {
            const html = `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:1.5em;background:#fff;color:#111;">` +
              `<div style="background:linear-gradient(135deg,#b8860b,#d4a017);padding:1.5em;border-radius:12px 12px 0 0;color:#fff;">` +
              `<h1 style="margin:0;font-family:Georgia,serif;">Casa Corona</h1></div>` +
              `<div style="border:1px solid #eee;border-top:0;border-radius:0 0 12px 12px;padding:1.5em;">` +
              `<h2 style="margin:0 0 0.5em;">${escapeHtml(input.title)}</h2>` +
              `<p>${escapeHtml(input.body).replace(/\n/g, "<br>")}</p>` +
              (input.link ? `<p><a href="${input.link}" style="background:#b8860b;color:#fff;padding:0.75em 1.5em;border-radius:8px;text-decoration:none;display:inline-block;">View details</a></p>` : "") +
              `<div style="margin-top:2em;padding-top:1em;border-top:1px solid #eee;text-align:center;">` +
              `<p style="font-size:0.75em;color:#999;">You received this because you are subscribed to Casa Corona updates.</p>` +
              `<p style="font-size:0.75em;color:#999;"><a href="${env.FRONTEND_URL}/newsletter/unsubscribe?email=${encodeURIComponent(emailAddr)}" style="color:#999;">Unsubscribe</a></p>` +
              `</div></div></div>`;
            await sendEmail(emailAddr, input.title, html);
            emailed++;
          } catch {
            // email failures are non-fatal
          }
        }
      }

      return ok(res, {
        sent: inserted,
        emailed,
        audience: input.audience,
        maintenance: input.maintenance,
      });
    } catch (e: any) {
      if (e?.name === "ZodError") return badRequest(res, e.errors?.[0]?.message || "Invalid payload");
      return next(e);
    }
  }
);

// Helper
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Maintenance mode status ────────────────────────────────────────────────
router.get("/maintenance", async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      enabled: env.MAINTENANCE_MODE || false,
      message: env.MAINTENANCE_MESSAGE || "Casa Corona is undergoing maintenance. We'll be back soon.",
      contactEmail: env.SUPPORT_EMAIL || "support@casacorona.org",
    },
  });
});

export default router;
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, newsletterSubscribersTable } from "@casa-corona/db";
import { ok, created, badRequest } from "../../lib/response.js";
import { logger } from "../../lib/logger.js";

const router = Router();

// POST /newsletter/subscribe — Public endpoint for footer newsletter signup
const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  source: z.string().optional().default("footer"),
});

router.post("/subscribe", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, source } = subscribeSchema.parse(req.body);

    // Check if already subscribed
    const [existing] = await db
      .select()
      .from(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.email, email))
      .limit(1);

    if (existing) {
      if (existing.subscribed) {
        return ok(res, { message: "Already subscribed", subscriber: existing });
      } else {
        // Re-subscribe
        const [updated] = await db
          .update(newsletterSubscribersTable)
          .set({ subscribed: true, subscribedAt: new Date(), unsubscribedAt: null })
          .where(eq(newsletterSubscribersTable.email, email))
          .returning();
        return ok(res, { message: "Re-subscribed successfully", subscriber: updated });
      }
    }

    // New subscriber
    const [subscriber] = await db
      .insert(newsletterSubscribersTable)
      .values({ email, name, source })
      .returning();

    logger.info({ email, source }, "Newsletter subscriber added");
    return created(res, { message: "Subscribed successfully", subscriber });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return badRequest(res, e.errors[0]?.message ?? "Invalid input");
    }
    return next(e);
  }
});

// POST /newsletter/unsubscribe — Unsubscribe from newsletter
router.post("/unsubscribe", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const [subscriber] = await db
      .update(newsletterSubscribersTable)
      .set({ subscribed: false, unsubscribedAt: new Date() })
      .where(eq(newsletterSubscribersTable.email, email))
      .returning();

    if (!subscriber) {
      return badRequest(res, "Email not found in newsletter list");
    }

    logger.info({ email }, "Newsletter unsubscribe");
    return ok(res, { message: "Unsubscribed successfully" });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return badRequest(res, e.errors[0]?.message ?? "Invalid email");
    }
    return next(e);
  }
});

// GET /newsletter/subscribers — Admin only
router.get("/subscribers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscribers = await db
      .select()
      .from(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.subscribed, true));

    return ok(res, { subscribers, count: subscribers.length });
  } catch (e) {
    return next(e);
  }
});

export default router;

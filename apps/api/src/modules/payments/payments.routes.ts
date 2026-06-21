import { Router, type IRouter } from "express";
import { logger } from "../../lib/logger";
import { z } from "zod";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { ok, badRequest, notFound, forbidden } from "../../lib/response";
import { eq, and, asc, sql } from "drizzle-orm";
import crypto from "crypto";
import { env } from "../../lib/env";
import {
  db,
  subscriptionsTable,
  paymentsTable,
  vendorsTable,
  subscriptionPlansTable,
  notificationsTable,
  platformSettingsTable,
} from "@casa-corona/db";

const router: IRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Vendor subscription plans (Paystack integration)
// ─────────────────────────────────────────────────────────────────────────────

// Use the actual subscription_plan enum values defined in the schema
const planEnum = z.enum(["monthly", "3month", "6month", "12month"]);
type Plan = z.infer<typeof planEnum>;

// Read plan from DB so admin can change prices/discounts without a redeploy
async function getPlanFromDb(planId: Plan) {
  const [row] = await db
    .select()
    .from(subscriptionPlansTable)
    .where(eq(subscriptionPlansTable.id, planId))
    .limit(1);
  return row;
}

function daysFromMonths(months: number): number {
  return Math.round(months * 30.4375);
}

// POST /payments/subscribe
// Initialises a Paystack transaction for the chosen plan
const subscribeSchema = z.object({
  plan: planEnum,
  type: z.enum(["subscription", "featured"]).optional().default("subscription"),
  callbackUrl: z.string().url().optional(),
});

router.post("/subscribe", requireAuth, requireRole("vendor"), async (req, res, next) => {
  try {
    const { plan, type, callbackUrl } = subscribeSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, userId));
    if (!vendor) return notFound(res, "Vendor profile not found");

    if (!env.PAYSTACK_SECRET_KEY) {
      return badRequest(res, "Payments are not yet configured. Please contact support.");
    }

    // Determine amount based on type
    let amount: number; // Amount in kobo (Nigerian lowest currency unit)
    let metadata: any;
    
    if (type === "featured") {
      // Get featured price from platform settings
      const [setting] = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, "pricing"));
      const featuredPrice = (setting?.value as any)?.featured_slot ?? 25000;
      // Amount in Naira (will be multiplied by 100 for Paystack kobo)
      amount = featuredPrice;
      metadata = {
        vendorId: vendor.id,
        userId,
        type: "featured",
      };
    } else {
      // Regular subscription
      const planInfo = await getPlanFromDb(plan);
      if (!planInfo || !planInfo.active) {
        return badRequest(res, "This plan is not currently available");
      }
      amount = planInfo.amountNgn;
      metadata = {
        vendorId: vendor.id,
        userId,
        plan,
        type: "subscription",
      };
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: (req as any).user.email ?? "vendor@casa-corona.com",
        amount: amount * 100, // kobo
        currency: "NGN",
        metadata,
        callback_url: callbackUrl || `${env.FRONTEND_URL}/vendor/payments?status=success`,
      }),
    });
    const data: any = await response.json();
    if (!data?.status) return badRequest(res, data?.message ?? "Paystack init failed");
    return ok(res, { authorizationUrl: data.data.authorization_url, reference: data.data.reference });
  } catch (e) {
    if (e instanceof z.ZodError) return badRequest(res, e.errors[0]?.message ?? "Bad request");
    return next(e);
  }
});

// GET /payments/verify?reference=xxx
router.get("/verify", requireAuth, async (req, res, next) => {
  try {
    const reference = String(req.query.reference ?? "");
    if (!reference) return badRequest(res, "Missing reference");
    if (!env.PAYSTACK_SECRET_KEY) return badRequest(res, "Payments not configured");

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
    });
    const data: any = await response.json();
    if (!data?.status) return badRequest(res, data?.message ?? "Verification failed");

    const meta = data.data.metadata ?? {};
    
    // Handle featured listing payment
    if (meta.type === "featured" && meta.vendorId) {
      // Featured listing: 30 days
      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + 30);
      
      await db
        .update(vendorsTable)
        .set({
          featured: true,
          featuredUntil,
        })
        .where(eq(vendorsTable.id, meta.vendorId));
      
      // Create payment record
      await db.insert(paymentsTable).values({
        vendorId: meta.vendorId,
        userId: meta.userId,
        amount: data.data.amount,
        currency: data.data.currency ?? "NGN",
        reference: reference,
        status: "success",
        type: "featured",
        paystackData: data.data as any,
      });
      
      // Notify vendor
      const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, meta.vendorId)).limit(1);
      if (vendor?.userId) {
        await db.insert(notificationsTable).values({
          userId: vendor.userId,
          type: "payment",
          title: "Featured listing activated!",
          body: "Your business is now featured and will appear at the top of search results for 30 days.",
        });
      }
      
      logger.info(`[payments] Featured listing activated for vendor ${meta.vendorId}`);
      return ok(res, { status: data.data.status, amount: data.data.amount, reference, type: "featured" });
    }
    
    // Handle commission payment
    if (meta.type === "commission" && meta.paymentId) {
      // Update payment record to success
      await db
        .update(paymentsTable)
        .set({
          status: "success",
          paidAt: new Date(),
        })
        .where(eq(paymentsTable.id, meta.paymentId));

      // Mark commission as paid in bookings (if needed)
      logger.info(`[payments] Commission invoice ${meta.paymentId} paid by vendor ${meta.vendorId}`);
      
      // Notify vendor
      if (meta.vendorId) {
        const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, meta.vendorId)).limit(1);
        if (vendor?.userId) {
          await db.insert(notificationsTable).values({
            userId: vendor.userId,
            type: "payment",
            title: "Commission payment received",
            body: "Thank you for your payment. Your commission invoice has been settled.",
          });
        }
      }
      
      return ok(res, { status: data.data.status, amount: data.data.amount, reference, type: "commission" });
    }
    
    // Handle regular subscription payment
    if (meta.type === "subscription" && meta.vendorId) {
      // Re-fetch the plan from DB so the expiry math uses current values
      const planInfo = await getPlanFromDb(meta.plan);
      const months = planInfo?.monthsCovered ?? 1;
      
      // Fetch current vendor to check existing expiry
      const [currentVendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, meta.vendorId)).limit(1);
      
      // Calculate new expiry: if subscription is active, extend from current expiry; otherwise start fresh
      let expiresAt: Date;
      const startsAt = new Date();
      
      if (currentVendor?.subscriptionStatus === 'active' && currentVendor?.subscriptionExpiresAt) {
        // Pay early - extend from existing expiry date
        const currentExpiry = new Date(currentVendor.subscriptionExpiresAt);
        if (currentExpiry > startsAt) {
          // Current subscription is still valid, add months to it
          expiresAt = new Date(currentExpiry);
          expiresAt.setDate(expiresAt.getDate() + daysFromMonths(months));
        } else {
          // Expired subscription, start fresh
          expiresAt = new Date(startsAt);
          expiresAt.setDate(expiresAt.getDate() + daysFromMonths(months));
        }
      } else {
        // New subscription, start from today
        expiresAt = new Date(startsAt);
        expiresAt.setDate(expiresAt.getDate() + daysFromMonths(months));
      }

      // Activate vendor
      await db
        .update(vendorsTable)
        .set({
          subscriptionStatus: "active",
          subscriptionExpiresAt: expiresAt,
          verified: true,
        })
        .where(eq(vendorsTable.id, meta.vendorId));

      // Log the subscription
      await db
        .insert(subscriptionsTable)
        .values({
          vendorId: meta.vendorId,
          plan: meta.plan,
          amount: data.data.amount,
          currency: data.data.currency ?? "NGN",
          paystackReference: reference,
          status: "active",
          autoRenew: false,
          startsAt,
          expiresAt,
        });

      // Auto-verify notification
      const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, meta.vendorId)).limit(1);
      if (vendor?.userId) {
        await db.insert(notificationsTable).values({
          userId: vendor.userId,
          type: "payment",
          title: "Subscription activated!",
          body: "Your business is now verified and active on Casa Corona.",
        });
      }
    }

    return ok(res, { status: data.data.status, amount: data.data.amount, reference });
  } catch (e) {
    return next(e);
  }
});

// POST /payments/webhook
router.post("/webhook", async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const body = JSON.stringify(req.body);
  const expected = crypto
    .createHmac("sha512", env.PAYSTACK_SECRET_KEY ?? "")
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return res.status(401).send("Invalid signature");
  }

  res.status(200).send("OK");
  logger.info("[paystack webhook]", req.body?.event, "ref:", req.body?.data?.reference);

  // Handle subscription.success event
  const event = req.body?.event;
  const data = req.body?.data;
  
  // Handle featured listing payments
  if (event === "charge.success" && data?.metadata?.type === "featured" && data?.metadata?.vendorId) {
    logger.info({ event, vendorId: data.metadata.vendorId }, "[webhook] featured listing charge.success received");
    try {
      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + 30);
      
      await db.update(vendorsTable).set({ 
        featured: true,
        featuredUntil 
      }).where(eq(vendorsTable.id, data.metadata.vendorId));
      
      // Notify vendor
      const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, data.metadata.vendorId));
      if (vendor?.userId) {
        await db.insert(notificationsTable).values({
          userId: vendor.userId,
          type: "payment",
          title: "Featured listing activated!",
          body: "Your business is now featured for 30 days.",
        });
      }
      
      logger.info("[webhook] Featured listing activated", data.metadata.vendorId);
    } catch (e: any) {
      logger.error({ err: e.message }, "[webhook] Featured listing activation failed");
    }
  }
  
  // Handle regular subscription payments
  if (event === "charge.success" && data?.metadata?.type === "subscription" && data?.metadata?.vendorId) {
    logger.info({ event, vendorId: data.metadata.vendorId }, "[webhook] subscription charge.success received");
    try {
      // Check if auto-verify is enabled
      const [setting] = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, "features"));
      const autoVerify = (setting?.value as any)?.auto_verify_on_payment === true;
      logger.info({ autoVerify, settingExists: !!setting, settingValue: setting?.value }, "[webhook] auto-verify check");
      
      if (autoVerify) {
        await db.update(vendorsTable).set({ verified: true }).where(eq(vendorsTable.id, data.metadata.vendorId));
        
        // Notify vendor
        const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, data.metadata.vendorId));
        if (vendor?.userId) {
          await db.insert(notificationsTable).values({
            userId: vendor.userId,
            type: "payment",
            title: "Vendor verified!",
            body: "Your business has been auto-verified after successful payment.",
          });
        }
        
        logger.info("[webhook] Auto-verified vendor", data.metadata.vendorId);
      }
    } catch (e: any) {
      logger.error({ err: e.message }, "[webhook] Auto-verify failed");
    }
  }
  return;
});

// GET /payments/plans — public (reads from DB so admin can edit prices)
router.get("/plans", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.active, true))
      .orderBy(asc(subscriptionPlansTable.sortOrder));
    const plans = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      amountNgn: r.amountNgn,
      discountPct: r.discountPct,
      monthsCovered: r.monthsCovered,
      intervalLabel: r.intervalLabel,
      currency: "NGN",
      interval: r.intervalLabel,
    }));
    return ok(res, { plans });
  } catch (e) {
    return next(e);
  }
});

// Admin: list all plans (including inactive)
router.get("/plans/all", requireAuth, requireRole("admin", "super_admin", "moderator"), async (_req, res, next) => {
  try {
    const rows = await db.select().from(subscriptionPlansTable).orderBy(asc(subscriptionPlansTable.sortOrder));
    return ok(res, { plans: rows });
  } catch (e) { return next(e); }
});

// Admin: update a plan
const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  amountNgn: z.number().int().min(0).optional(),
  monthsCovered: z.number().int().min(1).optional(),
  discountPct: z.number().int().min(0).max(100).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
router.patch("/plans/:id", requireAuth, requireRole("admin", "super_admin", "moderator"), async (req, res, next) => {
  try {
    const parsed = updatePlanSchema.parse(req.body);
    const updates: any = { ...parsed, updatedAt: new Date() };
    await db.update(subscriptionPlansTable).set(updates).where(eq(subscriptionPlansTable.id, req.params.id as any));
    const [row] = await db.select().from(subscriptionPlansTable).where(eq(subscriptionPlansTable.id, req.params.id as any)).limit(1);
    return ok(res, { plan: row });
  } catch (e) { return next(e); }
});

// Vendor: list my own subscriptions
router.get("/my-subscriptions", requireAuth, requireRole("vendor"), async (req, res, next) => {
  try {
    const subs = await db
      .select()
      .from(subscriptionsTable)
      .innerJoin(vendorsTable, eq(subscriptionsTable.vendorId, vendorsTable.id))
      .where(eq(vendorsTable.userId, (req as any).user.userId));
    return ok(res, { subscriptions: subs.map((r) => r.subscriptions) });
  } catch (e) {
    return next(e);
  }
});

// Vendor: cancel my subscription
router.post("/subscriptions/:id/cancel", requireAuth, requireRole("vendor"), async (req, res, next) => {
  try {
    const subId = req.params.id as string;
    const subs = await db
      .select({ id: subscriptionsTable.id, vendorId: subscriptionsTable.vendorId })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, subId))
      .limit(1);
    if (!subs[0]) return notFound(res, "Subscription");
    // Verify ownership
    const v = await db.select({ userId: vendorsTable.userId }).from(vendorsTable).where(eq(vendorsTable.id, subs[0].vendorId)).limit(1);
    if (!v[0] || v[0].userId !== (req as any).user.userId) return forbidden(res, "Not your subscription");
    await db
      .update(subscriptionsTable)
      .set({ autoRenew: false, cancelledAt: new Date(), status: "cancelled" })
      .where(and(eq(subscriptionsTable.id, subId), eq(subscriptionsTable.vendorId, subs[0].vendorId)));
    return ok(res, { success: true });
  } catch (e) {
    return next(e);
  }
});

// Admin: list active subscriptions
router.get("/subscriptions", requireAuth, requireRole("admin", "super_admin", "moderator"), async (_req, res, next) => {
  try {
    const subs = await db
      .select({
        id: subscriptionsTable.id,
        vendorId: subscriptionsTable.vendorId,
        plan: subscriptionsTable.plan,
        amount: subscriptionsTable.amount,
        currency: subscriptionsTable.currency,
        status: subscriptionsTable.status,
        expiresAt: subscriptionsTable.expiresAt,
        createdAt: subscriptionsTable.createdAt,
      })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, "active"));
    return ok(res, { subscriptions: subs });
  } catch (e) {
    return next(e);
  }
});

// Admin: list payments
router.get("/payments", requireAuth, requireRole("admin", "super_admin", "moderator"), async (_req, res, next) => {
  try {
    const rows = await db.select().from(paymentsTable);
    return ok(res, { payments: rows });
  } catch (e) {
    return next(e);
  }
});

// POST /payments/commission/:id/pay — Initialize Paystack payment for commission invoice
router.post("/commission/:id/pay", requireAuth, requireRole("vendor"), async (req, res, next) => {
  try {
    const paymentId = req.params.id as string;
    const userId = (req as any).user.userId;

    // Get the commission payment record
    const [payment] = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, paymentId))
      .limit(1);

    if (!payment) return notFound(res, "Commission invoice not found");
    if (payment.type !== "commission") return badRequest(res, "Not a commission payment");
    if (payment.status !== "pending") return badRequest(res, "Invoice already paid or not payable");

    // Verify the vendor owns this invoice
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, payment.vendorId!));
    if (!vendor || vendor.userId !== userId) {
      return forbidden(res, "This invoice does not belong to you");
    }

    if (!env.PAYSTACK_SECRET_KEY) {
      return badRequest(res, "Payments are not configured. Please contact support.");
    }

    // Initialize Paystack transaction for commission
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: (req as any).user.email ?? "vendor@casa-corona.com",
        amount: payment.amount, // Already in kobo
        currency: payment.currency,
        reference: payment.reference,
        metadata: {
          vendorId: vendor.id,
          userId,
          type: "commission",
          paymentId: payment.id,
        },
        callback_url: `${env.FRONTEND_URL}/vendor/payments?status=success&reference=${payment.reference}`,
      }),
    });

    const data: any = await response.json();
    if (!data?.status) return badRequest(res, data?.message ?? "Paystack init failed");

    return ok(res, { authorizationUrl: data.data.authorization_url, reference: data.data.reference });
  } catch (e) {
    return next(e);
  }
});

// Admin: refund a payment via Paystack
// POST /payments/payments/:id/refund  body: { amount?: number /* in kobo, partial */, reason?: string }
router.post("/payments/:id/refund", requireAuth, requireRole("admin", "super_admin", "moderator"), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    if (!env.PAYSTACK_SECRET_KEY) return badRequest(res, "Paystack is not configured on this server.");

    // Find the payment row to get the Paystack reference
    const [payment] = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, id))
      .limit(1);
    if (!payment) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Payment not found" } });
    if (payment.status !== "success") {
      return res.status(400).json({ success: false, error: { code: "REFUND_BLOCKED", message: `Cannot refund a payment in status '${payment.status}'.` } });
    }
    if (!payment.reference) {
      return res.status(400).json({ success: false, error: { code: "NO_REFERENCE", message: "Payment has no Paystack reference on file." } });
    }

    const body: { amount?: number; reason?: string } = req.body || {};
    const refundPayload: Record<string, unknown> = {
      transaction: payment.reference,
      merchant_note: body.reason || "Refunded by admin",
    };
    if (typeof body.amount === "number" && body.amount > 0) {
      refundPayload.amount = Math.round(body.amount * 100); // kobo
    }

    // Call Paystack refund endpoint
    const paystackRes = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refundPayload),
    });
    const json: any = await paystackRes.json().catch(() => ({}));
    if (!paystackRes.ok) {
      return res.status(502).json({
        success: false,
        error: {
          code: "PAYSTACK_REFUND_FAILED",
          message: json?.message || "Paystack refund failed",
          details: json,
        },
      });
    }

    // Update the payment row in our DB
    const isFull = !body.amount || body.amount * 100 >= payment.amount;
    await db
      .update(paymentsTable)
      .set({
        status: isFull ? "refunded" : "partially_refunded",
        refundAmount: body.amount ? Math.round(body.amount * 100) : payment.amount,
        refundReason: body.reason || null,
        refundedAt: new Date(),
        refundedBy: (req as any).user?.userId,
      })
      .where(eq(paymentsTable.id, id));

    // Notify the vendor (their payment is the one refunded)
    if (payment.vendorId) {
      await db.insert(notificationsTable).values({
        userId: payment.vendorId,
        type: "payment",
        title: isFull ? "Your payment was refunded" : "Your payment was partially refunded",
        body: body.reason ? `Reason: ${body.reason}` : "Please contact support if you have questions.",
        data: { paymentId: id } as any,
      });
    }

    return ok(res, { success: true, refund: json?.data });
  } catch (e) {
    return next(e);
  }
});

export default router;

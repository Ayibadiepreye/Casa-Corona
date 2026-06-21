
import { Router, Response, NextFunction } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { eq, count, sql, and, gte } from "drizzle-orm";
import { db, vendorsTable, usersTable, bookingsTable, paymentsTable } from "@casa-corona/db";
import { AuthRequest } from "../../middlewares/requireAuth";
import { ok } from "../../lib/response";
import { logger } from "../../lib/logger";

const router = Router();

router.post("/track", (req: AuthRequest, res: Response) => {
  logger.info({ event: req.body }, "Analytics event");
  ok(res);
});

router.get("/vendor/me", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, req.user!.userId));
    if (!vendor) {
      return res.status(404).json({ success: false, error: "Vendor not found" });
    }
    return ok(res, {
      profileViews: vendor.totalViews,
      searchAppearances: 0,
      ctr: 0,
      topServices: [],
      earningsChart: [],
    });
  } catch (e) {
    return next(e);
  }
});

router.get("/admin/platform", requireAuth, requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [usersCount] = await db.select({ count: count() }).from(usersTable);
    const [vendorsCount] = await db.select({ count: count() }).from(vendorsTable);
    const [bookingsCount] = await db.select({ count: count() }).from(bookingsTable);

    // Commission totals from completed bookings (in kobo, convert to display)
    const [commissionAgg] = await db
      .select({
        totalCommission: sql<number>`COALESCE(SUM(${bookingsTable.commissionAmount}), 0)`,
        totalGmv: sql<number>`COALESCE(SUM(${bookingsTable.totalAmount}), 0)`,
        completedCount: sql<number>`COUNT(*) FILTER (WHERE ${bookingsTable.status} = 'completed')`,
      })
      .from(bookingsTable);

    // Subscription revenue this month (in kobo, convert to display)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [subscriptionAgg] = await db
      .select({
        monthRevenue: sql<number>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
        thisMonthCount: sql<number>`COUNT(*)`,
      })
      .from(paymentsTable)
      .where(and(
        eq(paymentsTable.status, "success"),
        gte(paymentsTable.createdAt, monthStart),
        eq(paymentsTable.type, "subscription")
      ));

    return ok(res, {
      users: usersCount.count,
      vendors: vendorsCount.count,
      bookings: bookingsCount.count,
      totalGmv: Math.round(Number(commissionAgg.totalGmv) / 100) || 0, // Convert kobo to Naira
      totalCommission: Math.round(Number(commissionAgg.totalCommission) / 100) || 0, // Convert kobo to Naira
      completedBookings: Number(commissionAgg.completedCount) || 0,
      monthSubscriptionRevenue: Math.round(Number(subscriptionAgg.monthRevenue) / 100) || 0, // Convert kobo to Naira
      subscriptionsThisMonth: Number(subscriptionAgg.thisMonthCount) || 0,
    });
  } catch (e) {
    return next(e);
  }
});

export default router;

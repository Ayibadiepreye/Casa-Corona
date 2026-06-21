import { db, bookingsTable, vendorsTable, usersTable, paymentsTable, notificationsTable } from "@casa-corona/db";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import cron from "node-cron";
import { logger } from "../lib/logger";
import { sendEmail } from "../lib/email";

/**
 * 1st of every month: invoice all vendors for accumulated commission.
 * 5% default (configurable in platform_settings).
 */
async function generateMonthlyCommissionInvoices() {
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Per-vendor totals
  const rows = await db
    .select({
      vendorId: bookingsTable.vendorId,
      totalCommission: sql<number>`COALESCE(SUM(${bookingsTable.commissionAmount}), 0)::int`,
      totalBookings: sql<number>`COUNT(*)::int`,
    })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.status, "completed"),
        gte(bookingsTable.updatedAt, lastMonthStart),
        lte(bookingsTable.updatedAt, lastMonthEnd)
      )
    )
    .groupBy(bookingsTable.vendorId);

  let invoiced = 0;
  for (const row of rows) {
    if (row.totalCommission <= 0) continue;

    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, row.vendorId));
    if (!vendor) continue;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, vendor.userId));
    if (!user) continue;

    // Create commission payment record
    const [payment] = await db
      .insert(paymentsTable)
      .values({
        vendorId: vendor.id,
        userId: vendor.userId,
        reference: `COMM-${vendor.id.slice(0, 8)}-${now.getTime()}`,
        amount: row.totalCommission,
        status: "pending",
        type: "commission",
        paystackData: {
          period: { from: lastMonthStart.toISOString(), to: lastMonthEnd.toISOString() },
          bookings: row.totalBookings,
          kind: "monthly_invoice",
        },
      })
      .returning();

    // Notify + email vendor
    await db.insert(notificationsTable).values({
      userId: user.id,
      type: "payment",
      title: "Commission invoice ready",
      body: `Your ${formatNaira(row.totalCommission)} commission for ${row.totalBookings} bookings last month is ready to pay.`,
      data: { link: `/vendor/payments` },
    });

    if (user.email) {
      await sendEmail(
        user.email,
        "Your Casa Corona commission invoice",
        `<p>Your commission of <strong>${formatNaira(row.totalCommission)}</strong> for ${row.totalBookings} bookings in ${lastMonthStart.toDateString()} – ${lastMonthEnd.toDateString()} is ready to pay.</p><p><a href="https://casacorona.org/vendor/payments">Pay now</a></p>`
      ).catch((e) => logger.error({ err: e.message }, "commission email failed"));
    }

    invoiced++;
  }

  return invoiced;
}

function formatNaira(kobo: number) {
  return "₦" + (kobo / 100).toLocaleString("en-NG");
}

export function startCommissionCron() {
  cron.schedule("0 2 1 * *", async () => {
    // 2am on 1st of every month
    try {
      const n = await generateMonthlyCommissionInvoices();
      logger.info({ count: n }, "[commission-cron] Monthly invoices generated");
    } catch (e: any) {
      logger.error({ err: e.message }, "[commission-cron] Error");
    }
  });
  logger.info("[commission-cron] Cron registered (1st of month, 2am)");
}

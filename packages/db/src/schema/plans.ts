import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum, index } from "drizzle-orm/pg-core";

// Use the same enum values defined in payments.ts so existing data continues to work
// (we re-export them to avoid a circular import).
export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "monthly",
  "3month",
  "6month",
  "12month",
]);

/**
 * Admin-editable subscription plans. Prices/discounts live in the database
 * so the admin can adjust them without a code deploy. The payments module
 * reads from this table; if a plan is missing here, the fallback in
 * payments.routes.ts supplies a default.
 */
export const subscriptionPlansTable = pgTable(
  "subscription_plans",
  {
    id: subscriptionPlanEnum("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    amountNgn: integer("amount_ngn").notNull(), // price in naira (Paystack will multiply by 100 for kobo)
    intervalLabel: text("interval_label").notNull(), // "monthly", "quarterly", "biannual", "annual"
    monthsCovered: integer("months_covered").notNull(),
    discountPct: integer("discount_pct").notNull().default(0),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    activeIdx: index("subscription_plans_active_idx").on(t.active),
    sortIdx: index("subscription_plans_sort_idx").on(t.sortOrder),
  })
);

export type SubscriptionPlan = typeof subscriptionPlansTable.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlansTable.$inferInsert;
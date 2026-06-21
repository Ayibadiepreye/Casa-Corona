import { pgTable, uuid, text, boolean, integer, timestamp, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersTable } from "./users.js";
import { vendorsTable } from "./vendors.js";

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["monthly", "3month", "6month", "12month"]);
export const subscriptionRecordStatusEnum = pgEnum("subscription_record_status", [
  "pending", "active", "expired", "cancelled", "failed"
]);
export const paymentTypeEnum = pgEnum("payment_type", [
  "subscription", "registration", "featured", "commission"
]);
export const paymentStatusEnum = pgEnum('payment_status_enum', [
  "pending", "success", "failed", "refunded", "partially_refunded"
]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  plan: subscriptionPlanEnum("plan").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("NGN"),
  paystackReference: text("paystack_reference").unique(),
  paystackCustomerCode: text("paystack_customer_code"),
  status: subscriptionRecordStatusEnum("status").notNull().default("pending"),
  autoRenew: boolean("auto_renew").notNull().default(false),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("subscriptions_vendor_idx").on(t.vendorId)]);

export const paymentsTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").references(() => vendorsTable.id),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  reference: text("reference").notNull().unique(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("NGN"),
  channel: text("channel"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  type: paymentTypeEnum("type").notNull(),
  paystackData: jsonb("paystack_data"),
  paidAt: timestamp("paid_at"),
  // ── Refund tracking (added Round 4) ──────────────────────────
  refundAmount: integer("refund_amount"),        // in kobo
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at"),
  refundedBy: uuid("refunded_by").references(() => usersTable.id),
  // ─────────────────────────────────────────────────────────────
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("payments_vendor_idx").on(t.vendorId),
  index("payments_user_idx").on(t.userId),
  index("payments_reference_idx").on(t.reference),
]);

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true });
export type InsertSubscription = InferInsertModel<typeof subscriptionsTable>;
export type Subscription = InferSelectModel<typeof subscriptionsTable>;

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = InferInsertModel<typeof paymentsTable>;
export type Payment = InferSelectModel<typeof paymentsTable>;

import { pgTable, uuid, text, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersTable } from "./users";
import { vendorsTable } from "./vendors";
import { servicesTable } from "./services";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending", "confirmed", "completed", "cancelled"
]);

export const bookingsTable = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => usersTable.id),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id),
  serviceId: uuid("service_id").references(() => servicesTable.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  notes: text("notes"),
  vendorNotes: text("vendor_notes"),
  totalAmount: integer("total_amount"),
  // Commission tracked for admin. Defaults to 10% of totalAmount on completion.
  commissionRate: integer("commission_rate_bps").notNull().default(1000), // basis points (1000 = 10%)
  commissionAmount: integer("commission_amount"),
  commissionPaidAt: timestamp("commission_paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("bookings_customer_idx").on(t.customerId),
  index("bookings_vendor_idx").on(t.vendorId),
  index("bookings_scheduled_idx").on(t.scheduledFor),
]);

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = InferInsertModel<typeof bookingsTable>;
export type Booking = InferSelectModel<typeof bookingsTable>;

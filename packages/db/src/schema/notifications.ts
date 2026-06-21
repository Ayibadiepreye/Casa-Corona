import { pgTable, uuid, text, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),          // booking, message, review, system, payment, etc.
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data"),                   // arbitrary payload (vendorId, bookingId, ...)
  read: boolean("read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("notifications_user_idx").on(t.userId),
  index("notifications_user_unread_idx").on(t.userId, t.readAt),
]);

export type Notification = typeof notificationsTable.$inferSelect;
export type InsertNotification = typeof notificationsTable.$inferInsert;

import { pgTable, uuid, text, boolean, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersTable } from "./users.js";
import { vendorsTable } from "./vendors.js";
import { bookingsTable } from "./bookings.js";

export const reviewsTable = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  bookingId: uuid("booking_id").references(() => bookingsTable.id),
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  photos: text("photos").array(),
  vendorReply: text("vendor_reply"),
  vendorReplyAt: timestamp("vendor_reply_at"),
  helpfulCount: integer("helpful_count").notNull().default(0),
  reported: boolean("reported").notNull().default(false),
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("reviews_vendor_idx").on(t.vendorId),
  index("reviews_user_idx").on(t.userId),
]);

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReview = InferInsertModel<typeof reviewsTable>;
export type Review = InferSelectModel<typeof reviewsTable>;

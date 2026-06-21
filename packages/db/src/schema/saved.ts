import { pgTable, uuid, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { vendorsTable } from "./vendors.js";

export const savedVendorsTable = pgTable("saved_vendors", {
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.vendorId] }),
  index("saved_user_idx").on(t.userId),
]);

export const followsTable = pgTable("follows", {
  followerId: uuid("follower_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.followerId, t.vendorId] }),
  index("follows_follower_idx").on(t.followerId),
]);

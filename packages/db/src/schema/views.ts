import { pgTable, uuid, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { vendorsTable } from "./vendors";

/**
 * Tracks every profile view by day, so a vendor sees daily/weekly/monthly counts
 * without storing a row per click. The unique key is (vendorId, day) so a single
 * visitor per day increments the count instead of creating duplicates.
 */
export const vendorViewsTable = pgTable(
  "vendor_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // YYYY-MM-DD
    count: integer("count").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    vendorDayIdx: index("vendor_views_vendor_day_idx").on(t.vendorId, t.day),
  })
);
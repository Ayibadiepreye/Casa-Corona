import { pgTable, uuid, text, boolean, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { vendorsTable } from "./vendors.js";

export const servicesTable = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  priceMin: integer("price_min").notNull(),
  priceMax: integer("price_max"),
  currency: text("currency").notNull().default("NGN"),
  durationMinutes: integer("duration_minutes"),
  popular: boolean("popular").notNull().default(false),
  active: boolean("active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("services_vendor_idx").on(t.vendorId)]);

export const insertServiceSchema = createInsertSchema(servicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertService = InferInsertModel<typeof servicesTable>;
export type Service = InferSelectModel<typeof servicesTable>;

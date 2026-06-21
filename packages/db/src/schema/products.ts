import { pgTable, uuid, text, boolean, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { vendorsTable } from "./vendors.js";

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("NGN"),
  buyLink: text("buy_link"),
  images: text("images").array(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("products_vendor_idx").on(t.vendorId)]);

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = InferInsertModel<typeof productsTable>;
export type Product = InferSelectModel<typeof productsTable>;

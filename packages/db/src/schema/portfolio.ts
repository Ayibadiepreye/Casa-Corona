import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { vendorsTable } from "./vendors";

export const portfolioShotsTable = pgTable("portfolio_shots", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  publicId: text("public_id"),
  caption: text("caption"),
  category: text("category"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("portfolio_vendor_idx").on(t.vendorId)]);

export const insertPortfolioShotSchema = createInsertSchema(portfolioShotsTable).omit({ id: true, createdAt: true });
export type InsertPortfolioShot = InferInsertModel<typeof portfolioShotsTable>;
export type PortfolioShot = InferSelectModel<typeof portfolioShotsTable>;

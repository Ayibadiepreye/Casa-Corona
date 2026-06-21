import {
  pgTable, uuid, text, boolean, timestamp, pgEnum,
  doublePrecision, integer, jsonb, index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";

export const priceRangeEnum = pgEnum("price_range", ["budget", "mid", "premium", "luxury"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "inactive", "active", "expired", "cancelled"
]);

export const vendorsTable = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  businessName: text("business_name").notNull(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => categoriesTable.id),
  whatsapp: text("whatsapp"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  instagram: text("instagram"),
  twitter: text("twitter"),
  facebook: text("facebook"),
  tiktok: text("tiktok"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country").notNull().default("Nigeria"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  hours: jsonb("hours"),
  holidays: jsonb("holidays"),
  yearsInBusiness: text("years_in_business"),
  teamSize: text("team_size"),
  priceRange: priceRangeEnum("price_range"),
  serviceArea: text("service_area"),
  verified: boolean("verified").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  featuredUntil: timestamp("featured_until"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("inactive"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  totalViews: integer("total_views").notNull().default(0),
  totalSaves: integer("total_saves").notNull().default(0),
  totalFollowers: integer("total_followers").notNull().default(0),
  averageRating: doublePrecision("average_rating").notNull().default(4.0),
  reviewCount: integer("review_count").notNull().default(0),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("vendors_slug_idx").on(t.slug),
  index("vendors_city_state_idx").on(t.city, t.state),
  index("vendors_category_idx").on(t.categoryId),
  index("vendors_subscription_idx").on(t.subscriptionStatus),
]);

export const insertVendorSchema = createInsertSchema(vendorsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVendor = InferInsertModel<typeof vendorsTable>;
export type Vendor = InferSelectModel<typeof vendorsTable>;

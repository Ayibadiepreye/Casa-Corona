import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersTable } from "./users";
import { vendorsTable } from "./vendors";

export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => usersTable.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  changes: jsonb("changes"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("audit_actor_idx").on(t.actorId)]);

export const announcementsTable = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  targetRole: text("target_role").array(),
  active: boolean("active").notNull().default(true),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const platformSettingsTable = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  category: text("category").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => usersTable.id),
});

export const faqsTable = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category"),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const loginHistoryTable = pgTable("login_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  device: text("device"),
  location: text("location"),
  success: boolean("success").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("login_history_user_idx").on(t.userId)]);

export const featuredRotationTable = pgTable("featured_rotation", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  slot: integer("slot").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const savedSearchesTable = pgTable("saved_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  filters: jsonb("filters"),
  alertEnabled: boolean("alert_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  keys: jsonb("keys").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFaqSchema = createInsertSchema(faqsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFaq = InferInsertModel<typeof faqsTable>;
export type Faq = InferSelectModel<typeof faqsTable>;

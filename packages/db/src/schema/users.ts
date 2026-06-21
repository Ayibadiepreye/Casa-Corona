import {
  pgTable, uuid, text, boolean, timestamp, pgEnum, index, jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "customer", "vendor", "moderator", "admin", "super_admin"
]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("Nigeria"),
  bio: text("bio"),
  location: jsonb("location"),
  role: userRoleEnum("role").notNull().default("customer"),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  lastLoginAt: timestamp("last_login_at"),
  suspended: boolean("suspended").notNull().default(false),
  suspendedReason: text("suspended_reason"),
  deletedAt: timestamp("deleted_at"),
  notificationPreferences: text("notification_preferences").default("{}"),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("users_email_idx").on(t.email),
  index("users_role_idx").on(t.role),
]);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true, createdAt: true, updatedAt: true, passwordHash: true,
});
export type InsertUser = InferInsertModel<typeof usersTable>;
export type User = InferSelectModel<typeof usersTable>;

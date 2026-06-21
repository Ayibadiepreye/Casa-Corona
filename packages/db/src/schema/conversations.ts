import { pgTable, uuid, text, boolean, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersTable } from "./users.js";
import { vendorsTable } from "./vendors.js";

export const messageTypeEnum = pgEnum("message_type", ["text", "image", "file", "system"]);

export const conversationsTable = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => usersTable.id),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id),
  lastMessageAt: timestamp("last_message_at"),
  customerUnread: integer("customer_unread").notNull().default(0),
  vendorUnread: integer("vendor_unread").notNull().default(0),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("conversations_customer_idx").on(t.customerId),
  index("conversations_vendor_idx").on(t.vendorId),
]);

export const messagesTable = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => usersTable.id),
  senderRole: text("sender_role").notNull(),
  content: text("content"),
  type: messageTypeEnum("type").notNull().default("text"),
  attachmentUrl: text("attachment_url"),
  readAt: timestamp("read_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("messages_conversation_idx").on(t.conversationId),
  index("messages_expires_idx").on(t.expiresAt),
]);

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ id: true, createdAt: true });
export type InsertConversation = InferInsertModel<typeof conversationsTable>;
export type Conversation = InferSelectModel<typeof conversationsTable>;

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true });
export type InsertMessage = InferInsertModel<typeof messagesTable>;
export type Message = InferSelectModel<typeof messagesTable>;

export const quickRepliesTable = pgTable("quick_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const autoRepliesTable = pgTable("auto_replies", {
  vendorId: uuid("vendor_id").primaryKey().references(() => vendorsTable.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(false),
  message: text("message"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blockedUsersTable = pgTable("blocked_users", {
  blockerId: uuid("blocker_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  blockedId: uuid("blocked_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

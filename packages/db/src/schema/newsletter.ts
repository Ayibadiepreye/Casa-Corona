import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const newsletterSubscribersTable = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  subscribed: boolean("subscribed").notNull().default(true),
  source: text("source").default("footer"), // footer, landing_page, etc.
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type NewsletterSubscriber = typeof newsletterSubscribersTable.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribersTable.$inferInsert;

import { relations } from "drizzle-orm";
import {
  usersTable,
  vendorsTable,
  categoriesTable,
  servicesTable,
  productsTable,
  portfolioShotsTable,
  reviewsTable,
  bookingsTable,
  savedVendorsTable,
  followsTable,
  subscriptionsTable,
  paymentsTable,
  notificationsTable,
  conversationsTable,
  messagesTable,
  auditLogsTable,
  loginHistoryTable,
  pushSubscriptionsTable,
} from "./schema";

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  vendor: one(vendorsTable, {
    fields: [usersTable.id],
    references: [vendorsTable.userId],
  }),
  bookings: many(bookingsTable, { relationName: "customerBookings" }),
  reviews: many(reviewsTable, { relationName: "userReviews" }),
  savedVendors: many(savedVendorsTable, { relationName: "userSavedVendors" }),
  follows: many(followsTable, { relationName: "userFollows" }),
  messages: many(messagesTable, { relationName: "senderMessages" }),
  notifications: many(notificationsTable, { relationName: "userNotifications" }),
  conversations: many(conversationsTable, { relationName: "customerConversations" }),
  subscriptions: many(subscriptionsTable, { relationName: "userSubscriptions" }),
  payments: many(paymentsTable, { relationName: "userPayments" }),
  loginHistory: many(loginHistoryTable, { relationName: "userLoginHistory" }),
  auditLogs: many(auditLogsTable, { relationName: "actorAuditLogs" }),
  pushSubscriptions: many(pushSubscriptionsTable, { relationName: "userPushSubscriptions" }),
}));

export const vendorsRelations = relations(vendorsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [vendorsTable.userId],
    references: [usersTable.id],
  }),
  category: one(categoriesTable, {
    fields: [vendorsTable.categoryId],
    references: [categoriesTable.id],
  }),
  services: many(servicesTable, { relationName: "vendorServices" }),
  products: many(productsTable, { relationName: "vendorProducts" }),
  portfolioShots: many(portfolioShotsTable, { relationName: "vendorPortfolioShots" }),
  reviews: many(reviewsTable, { relationName: "vendorReviews" }),
  bookings: many(bookingsTable, { relationName: "vendorBookings" }),
  savedBy: many(savedVendorsTable, { relationName: "vendorSavedBy" }),
  followers: many(followsTable, { relationName: "vendorFollowers" }),
  subscriptions: many(subscriptionsTable, { relationName: "vendorSubscriptions" }),
  payments: many(paymentsTable, { relationName: "vendorPayments" }),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  vendors: many(vendorsTable, { relationName: "categoryVendors" }),
}));

export const servicesRelations = relations(servicesTable, ({ one }) => ({
  vendor: one(vendorsTable, {
    fields: [servicesTable.vendorId],
    references: [vendorsTable.id],
  }),
}));

export const productsRelations = relations(productsTable, ({ one }) => ({
  vendor: one(vendorsTable, {
    fields: [productsTable.vendorId],
    references: [vendorsTable.id],
  }),
}));

export const portfolioShotsRelations = relations(portfolioShotsTable, ({ one }) => ({
  vendor: one(vendorsTable, {
    fields: [portfolioShotsTable.vendorId],
    references: [vendorsTable.id],
  }),
}));

export const reviewsRelations = relations(reviewsTable, ({ one }) => ({
  vendor: one(vendorsTable, {
    fields: [reviewsTable.vendorId],
    references: [vendorsTable.id],
  }),
  user: one(usersTable, {
    fields: [reviewsTable.userId],
    references: [usersTable.id],
  }),
  booking: one(bookingsTable, {
    fields: [reviewsTable.bookingId],
    references: [bookingsTable.id],
  }),
}));

export const bookingsRelations = relations(bookingsTable, ({ one }) => ({
  customer: one(usersTable, {
    fields: [bookingsTable.customerId],
    references: [usersTable.id],
  }),
  vendor: one(vendorsTable, {
    fields: [bookingsTable.vendorId],
    references: [vendorsTable.id],
  }),
  service: one(servicesTable, {
    fields: [bookingsTable.serviceId],
    references: [servicesTable.id],
  }),
}));

export const savedVendorsRelations = relations(savedVendorsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [savedVendorsTable.userId],
    references: [usersTable.id],
  }),
  vendor: one(vendorsTable, {
    fields: [savedVendorsTable.vendorId],
    references: [vendorsTable.id],
  }),
}));

export const followsRelations = relations(followsTable, ({ one }) => ({
  follower: one(usersTable, {
    fields: [followsTable.followerId],
    references: [usersTable.id],
  }),
  vendor: one(vendorsTable, {
    fields: [followsTable.vendorId],
    references: [vendorsTable.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptionsTable, ({ one }) => ({
  vendor: one(vendorsTable, {
    fields: [subscriptionsTable.vendorId],
    references: [vendorsTable.id],
  }),
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  vendor: one(vendorsTable, {
    fields: [paymentsTable.vendorId],
    references: [vendorsTable.id],
  }),
  user: one(usersTable, {
    fields: [paymentsTable.userId],
    references: [usersTable.id],
  }),
}));

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.userId],
    references: [usersTable.id],
  }),
}));

export const conversationsRelations = relations(conversationsTable, ({ one, many }) => ({
  customer: one(usersTable, {
    fields: [conversationsTable.customerId],
    references: [usersTable.id],
  }),
  vendor: one(vendorsTable, {
    fields: [conversationsTable.vendorId],
    references: [vendorsTable.id],
  }),
  messages: many(messagesTable, { relationName: "conversationMessages" }),
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  conversation: one(conversationsTable, {
    fields: [messagesTable.conversationId],
    references: [conversationsTable.id],
  }),
  sender: one(usersTable, {
    fields: [messagesTable.senderId],
    references: [usersTable.id],
  }),
}));

export const auditLogsRelations = relations(auditLogsTable, ({ one }) => ({
  actor: one(usersTable, {
    fields: [auditLogsTable.actorId],
    references: [usersTable.id],
  }),
}));

export const loginHistoryRelations = relations(loginHistoryTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [loginHistoryTable.userId],
    references: [usersTable.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [pushSubscriptionsTable.userId],
    references: [usersTable.id],
  }),
}));

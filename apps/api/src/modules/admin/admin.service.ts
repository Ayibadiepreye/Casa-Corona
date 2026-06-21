
import { db, usersTable, vendorsTable, categoriesTable, announcementsTable, faqsTable, auditLogsTable, loginHistoryTable, platformSettingsTable, bookingsTable, reviewsTable, paymentsTable } from "@casa-corona/db";
import { eq, and, ilike, desc, gt, gte, or, isNull, isNotNull, count, inArray } from "drizzle-orm";
import { signImpersonationToken } from "../../lib/jwt";
import Papa from "papaparse";
import { ConflictError } from "../../lib/errors";

export async function getPlatformStats() {
  const [usersCount] = await db.select({ count: count() }).from(usersTable);
  const [vendorsCount] = await db.select({ count: count() }).from(vendorsTable);
  const [bookingsCount] = await db.select({ count: count() }).from(bookingsTable);
  const [reviewsCount] = await db.select({ count: count() }).from(reviewsTable);
  const [paymentsCount] = await db.select({ count: count() }).from(paymentsTable);

  const usersByRole = await db
    .select({ role: usersTable.role, count: count() })
    .from(usersTable)
    .groupBy(usersTable.role);

  const vendorsByStatus = await db
    .select({ status: vendorsTable.subscriptionStatus, count: count() })
    .from(vendorsTable)
    .groupBy(vendorsTable.subscriptionStatus);

  return {
    users: {
      total: usersCount.count,
      byRole: Object.fromEntries(usersByRole.map(r => [r.role, r.count])),
    },
    vendors: {
      total: vendorsCount.count,
      byStatus: Object.fromEntries(vendorsByStatus.map(r => [r.status, r.count])),
    },
    bookings: bookingsCount.count,
    reviews: reviewsCount.count,
    payments: { count: paymentsCount.count },
  };
}

export async function listAllUsers({ page, limit, role, suspended, q }: { page: number; limit: number; role?: string; suspended?: boolean; q?: string }) {
  const offset = (page - 1) * limit;
  let where = and();
  if (role) where = and(where, eq(usersTable.role, role as any));
  if (typeof suspended === "boolean") where = and(where, eq(usersTable.suspended, suspended));
  if (q) where = and(where, or(ilike(usersTable.email, `%${q}%`), ilike(usersTable.name, `%${q}%`)));

  const users = await db
    .select()
    .from(usersTable)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(usersTable.createdAt));

  const [totalCount] = await db.select({ count: count() }).from(usersTable).where(where);
  return { users, total: totalCount.count, page, limit };
}

export async function getUserDetail(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) throw new Error("User not found");
  const loginHistory = await db
    .select()
    .from(loginHistoryTable)
    .where(eq(loginHistoryTable.userId, userId))
    .limit(10)
    .orderBy(desc(loginHistoryTable.createdAt));
  return { user, loginHistory };
}

export async function suspendUser(userId: string, reason: string, actorId: string) {
  const [user] = await db
    .update(usersTable)
    .set({ suspended: true, suspendedReason: reason, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "suspend_user",
    resourceType: "user",
    resourceId: userId,
    changes: { reason },
  });
  return user;
}

export async function unsuspendUser(userId: string, actorId: string) {
  const [user] = await db
    .update(usersTable)
    .set({ suspended: false, suspendedReason: null, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "unsuspend_user",
    resourceType: "user",
    resourceId: userId,
  });
  return user;
}

export async function deleteUser(userId: string, actorId: string) {
  // Soft-delete: mark deleted_at and clear sensitive fields, never hard-delete
  // because of FK references in bookings, messages, reviews, etc.
  const [user] = await db
    .update(usersTable)
    .set({
      deletedAt: new Date(),
      suspended: true,
      suspendedReason: "deleted_by_admin",
      refreshToken: null,
      resetToken: null,
      passwordHash: null,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId))
    .returning();
  if (!user) throw new Error("User not found");
  await db.insert(auditLogsTable).values({
    actorId,
    action: "delete_user",
    resourceType: "user",
    resourceId: userId,
  });
  return { id: user.id, deletedAt: user.deletedAt };
}

export async function impersonateUser(superAdminId: string, targetUserId: string) {
  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.id, targetUserId));
  if (!targetUser) throw new Error("Target user not found");
  await db.insert(auditLogsTable).values({
    actorId: superAdminId,
    action: "impersonate_user",
    resourceType: "user",
    resourceId: targetUserId,
  });
  const token = signImpersonationToken({ userId: targetUser.id, role: targetUser.role, email: targetUser.email });
  return { token };
}

export async function listAllVendors({
  page,
  limit,
  status,
  categoryId,
  verified,
  featured,
  q,
}: {
  page: number;
  limit: number;
  status?: string;
  categoryId?: string;
  verified?: boolean;
  featured?: boolean;
  q?: string;
}) {
  const offset = (page - 1) * limit;
  let where = and();
  if (status) where = and(where, eq(vendorsTable.subscriptionStatus, status as any));
  if (categoryId) where = and(where, eq(vendorsTable.categoryId, categoryId));
  if (typeof verified === "boolean") where = and(where, eq(vendorsTable.verified, verified));
  if (typeof featured === "boolean") where = and(where, eq(vendorsTable.featured, featured));
  if (q) where = and(where, or(ilike(vendorsTable.businessName, `%${q}%`), ilike(vendorsTable.email, `%${q}%`)));

  const vendors = await db
    .select()
    .from(vendorsTable)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(vendorsTable.createdAt));

  const [totalCount] = await db.select({ count: count() }).from(vendorsTable).where(where);
  return { vendors, total: totalCount.count, page, limit };
}

export async function listPendingVendors() {
  const vendors = await db
    .select()
    .from(vendorsTable)
    .where(or(isNull(vendorsTable.createdAt), eq(vendorsTable.subscriptionStatus, "inactive")))
    .orderBy(desc(vendorsTable.createdAt));
  return { vendors };
}

export async function bulkApproveVendors(vendorIds: string[], actorId: string) {
  const vendors = await db
    .update(vendorsTable)
    .set({ verified: true, updatedAt: new Date() })
    .where(inArray(vendorsTable.id, vendorIds))
    .returning();
  for (const vendor of vendors) {
    await db.insert(auditLogsTable).values({
      actorId,
      action: "approve_vendor",
      resourceType: "vendor",
      resourceId: vendor.id,
    });
  }
  return { vendors };
}

export async function updateVendor(vendorId: string, data: any, actorId: string) {
  const [vendor] = await db
    .update(vendorsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(vendorsTable.id, vendorId))
    .returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "update_vendor",
    resourceType: "vendor",
    resourceId: vendorId,
    changes: data,
  });
  return vendor;
}

export async function suspendVendor(vendorId: string, reason: string, actorId: string) {
  const [vendor] = await db
    .update(vendorsTable)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(vendorsTable.id, vendorId))
    .returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "suspend_vendor",
    resourceType: "vendor",
    resourceId: vendorId,
    changes: { reason },
  });
  return vendor;
}

export async function createCategory(data: any, actorId: string) {
  const [existing] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, data.slug));
  if (existing) throw new ConflictError("Category with this slug already exists");
  const [category] = await db.insert(categoriesTable).values(data).returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "create_category",
    resourceType: "category",
    resourceId: category.id,
    changes: data,
  });
  return category;
}

export async function updateCategory(id: string, data: any, actorId: string) {
  const [category] = await db
    .update(categoriesTable)
    .set(data)
    .where(eq(categoriesTable.id, id))
    .returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "update_category",
    resourceType: "category",
    resourceId: id,
    changes: data,
  });
  return category;
}

export async function deleteCategory(id: string, actorId: string) {
  const [category] = await db
    .update(categoriesTable)
    .set({ active: false })
    .where(eq(categoriesTable.id, id))
    .returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "delete_category",
    resourceType: "category",
    resourceId: id,
  });
  return category;
}

export async function listAnnouncements() {
  return await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
}

export async function createAnnouncement(data: any, actorId: string) {
  const [announcement] = await db.insert(announcementsTable).values(data).returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "create_announcement",
    resourceType: "announcement",
    resourceId: announcement.id,
    changes: data,
  });
  return announcement;
}

export async function updateAnnouncement(id: string, data: any, actorId: string) {
  const [announcement] = await db
    .update(announcementsTable)
    .set(data)
    .where(eq(announcementsTable.id, id))
    .returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "update_announcement",
    resourceType: "announcement",
    resourceId: id,
    changes: data,
  });
  return announcement;
}

export async function deleteAnnouncement(id: string, actorId: string) {
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  await db.insert(auditLogsTable).values({
    actorId,
    action: "delete_announcement",
    resourceType: "announcement",
    resourceId: id,
  });
  return { success: true };
}

export async function listFaqs() {
  return await db.select().from(faqsTable).orderBy(faqsTable.displayOrder);
}

export async function createFaq(data: any, actorId: string) {
  const [faq] = await db.insert(faqsTable).values(data).returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "create_faq",
    resourceType: "faq",
    resourceId: faq.id,
    changes: data,
  });
  return faq;
}

export async function updateFaq(id: string, data: any, actorId: string) {
  const [faq] = await db
    .update(faqsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(faqsTable.id, id))
    .returning();
  await db.insert(auditLogsTable).values({
    actorId,
    action: "update_faq",
    resourceType: "faq",
    resourceId: id,
    changes: data,
  });
  return faq;
}

export async function deleteFaq(id: string, actorId: string) {
  await db.delete(faqsTable).where(eq(faqsTable.id, id));
  await db.insert(auditLogsTable).values({
    actorId,
    action: "delete_faq",
    resourceType: "faq",
    resourceId: id,
  });
  return { success: true };
}

export async function listAuditLogs({
  page,
  limit,
  actorId,
  resourceType,
}: {
  page: number;
  limit: number;
  actorId?: string;
  resourceType?: string;
}) {
  const offset = (page - 1) * limit;
  let where = and();
  if (actorId) where = and(where, eq(auditLogsTable.actorId, actorId));
  if (resourceType) where = and(where, eq(auditLogsTable.resourceType, resourceType));

  const logs = await db
    .select()
    .from(auditLogsTable)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(auditLogsTable.createdAt));

  const [totalCount] = await db.select({ count: count() }).from(auditLogsTable).where(where);
  return { logs, total: totalCount.count, page, limit };
}

export async function getSystemHealth() {
  const [usersCount] = await db.select({ count: count() }).from(usersTable);
  const [vendorsCount] = await db.select({ count: count() }).from(vendorsTable);
  const [messagesCount] = await db.select({ count: count() }).from(paymentsTable); // using payments as placeholder
  const [notificationsCount] = await db.select({ count: count() }).from(announcementsTable);
  return {
    db: "connected",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    totalUsers: usersCount.count,
    totalVendors: vendorsCount.count,
    totalMessages: messagesCount.count,
    totalNotifications: notificationsCount.count,
  };
}

export async function exportDataAsCsv(table: string) {
  let data: any[] = [];
  switch (table) {
    case "users":
      data = await db.select().from(usersTable);
      break;
    case "vendors":
      data = await db.select().from(vendorsTable);
      break;
    case "bookings":
      data = await db.select().from(bookingsTable);
      break;
    case "reviews":
      data = await db.select().from(reviewsTable);
      break;
    case "payments":
      data = await db.select().from(paymentsTable);
      break;
    default:
      throw new Error("Unsupported table");
  }
  return Papa.unparse(data);
}

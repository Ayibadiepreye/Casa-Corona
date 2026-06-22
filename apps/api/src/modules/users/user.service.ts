import { db, usersTable, vendorsTable, bookingsTable, reviewsTable, savedVendorsTable, followsTable, notificationsTable, InferSelectModel } from '@casa-corona/db';
import { eq, and } from 'drizzle-orm';
import { hashPassword, comparePasswords } from '../../lib/password.js';
import { NotFoundError, UnauthorizedError } from '../../lib/errors.js';

type User = InferSelectModel<typeof usersTable>;
type SafeUser = Omit<User, 'passwordHash' | 'refreshToken' | 'resetToken'>;

export async function getMe(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) throw new NotFoundError('User not found');
  const { passwordHash, refreshToken, resetToken, ...safeUser } = user;
  return { ...safeUser, hasPassword: !!passwordHash };
}

export async function updateProfile(userId: string, data: any) {
  const [user] = await db.update(usersTable).set(data).where(eq(usersTable.id, userId)).returning();
  if (!user) throw new NotFoundError('User not found');
  const { passwordHash, refreshToken, resetToken, ...safeUser } = user;
  return { ...safeUser, hasPassword: !!passwordHash };
}

export async function changePassword(userId: string, { currentPassword, newPassword }: any) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) throw new NotFoundError('User not found');

  // If user has no password (OAuth user), allow setting password without currentPassword
  if (user.passwordHash) {
    // User has a password, verify current password
    const valid = await comparePasswords(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid current password');
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash, refreshToken: null }).where(eq(usersTable.id, userId));

  return { success: true };
}

export async function deleteAccount(userId: string) {
  await db.update(usersTable).set({ deletedAt: new Date(), refreshToken: null }).where(eq(usersTable.id, userId));
  return { success: true };
}

export async function exportData(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const vendors = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, userId));
  const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.customerId, userId));
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.userId, userId));
  const savedVendors = await db.select().from(savedVendorsTable).where(eq(savedVendorsTable.userId, userId));
  const follows = await db.select().from(followsTable).where(eq(followsTable.followerId, userId));
  const notifications = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, userId));

  return { user, vendors, bookings, reviews, saved: savedVendors, follows, notifications };
}

export async function getNotifications(userId: string, { page = 1, limit = 20, unreadOnly = false }: any) {
  const where = [eq(notificationsTable.userId, userId)];
  if (unreadOnly) {
    where.push(eq(notificationsTable.read, false));
  }
  const notifications = await db.select().from(notificationsTable).where(and(...where)).orderBy(notificationsTable.createdAt);
  return { notifications, page, limit, total: notifications.length };
}

export async function markNotificationRead(userId: string, id: string) {
  await db.update(notificationsTable).set({ read: true, readAt: new Date() }).where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
  return { success: true };
}

export async function markAllNotificationsRead(userId: string) {
  await db.update(notificationsTable).set({ read: true, readAt: new Date() }).where(eq(notificationsTable.userId, userId));
  return { success: true };
}

export async function updateNotificationPreferences(userId: string, prefs: any) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const existingPrefs = typeof user?.notificationPreferences === 'string'
    ? JSON.parse(user.notificationPreferences)
    : (user?.notificationPreferences || {});
  const merged = { ...existingPrefs, ...prefs };

  const [updated] = await db.update(usersTable)
    .set({ notificationPreferences: JSON.stringify(merged) })
    .where(eq(usersTable.id, userId))
    .returning();
  if (!updated) throw new NotFoundError('User not found');
  const { passwordHash, refreshToken, resetToken, ...safeUser } = updated;
  return { ...safeUser, hasPassword: !!passwordHash };
}

export async function subscribePush(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const { pushSubscriptionsTable } = await import('@casa-corona/db');
  // Upsert: if endpoint exists for this user, update; else insert
  const [existing] = await db.select().from(pushSubscriptionsTable)
    .where(and(eq(pushSubscriptionsTable.userId, userId), eq(pushSubscriptionsTable.endpoint, sub.endpoint)))
    .limit(1);
  if (existing) {
    const [updated] = await db.update(pushSubscriptionsTable)
      .set({ keys: sub.keys })
      .where(eq(pushSubscriptionsTable.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db.insert(pushSubscriptionsTable)
    .values({ userId, endpoint: sub.endpoint, keys: sub.keys })
    .returning();
  return created;
}

export async function unsubscribePush(userId: string, endpoint: string) {
  const { pushSubscriptionsTable } = await import('@casa-corona/db');
  await db.delete(pushSubscriptionsTable)
    .where(and(eq(pushSubscriptionsTable.userId, userId), eq(pushSubscriptionsTable.endpoint, endpoint)));
}

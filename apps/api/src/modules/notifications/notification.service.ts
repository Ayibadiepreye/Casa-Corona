
import { db, notificationsTable } from "@casa-corona/db";
import { eq, and, desc } from "drizzle-orm";
import { getIO } from "../../lib/socket";

export async function createNotification(userId: string, data: any) {
  const [notification] = await db.insert(notificationsTable).values({
    userId,
    type: data.type,
    title: data.title,
    body: data.body,
    data: data.data || (data.link ? { link: data.link } : null),
  }).returning();

  try {
    const io = getIO();
    io.to(`user:${userId}`).emit("notification:new", notification);
  } catch (err) {
    console.error("Failed to emit notification:", err);
  }

  return notification;
}

export async function listNotifications(userId: string, { page = 1, limit = 20, unreadOnly = false }) {
  let notifications;
  if (unreadOnly) {
    notifications = await db.select().from(notificationsTable).where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false))).orderBy(desc(notificationsTable.createdAt)).limit(limit).offset((page - 1) * limit);
  } else {
    notifications = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, userId)).orderBy(desc(notificationsTable.createdAt)).limit(limit).offset((page - 1) * limit);
  }
  return notifications;
}

export async function markRead(userId: string, notificationId: string) {
  await db.update(notificationsTable).set({ read: true, readAt: new Date() }).where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, userId)));
  return { success: true };
}

export async function markAllRead(userId: string) {
  await db.update(notificationsTable).set({ read: true, readAt: new Date() }).where(eq(notificationsTable.userId, userId));
  return { success: true };
}


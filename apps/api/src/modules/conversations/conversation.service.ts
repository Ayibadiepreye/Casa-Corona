
import { db, conversationsTable, messagesTable, usersTable, vendorsTable, notificationsTable } from "@casa-corona/db";
import { eq, and, desc, gt } from "drizzle-orm";
import { createNotification } from "../notifications/notification.service";
import { NotFoundError, ForbiddenError } from "../../lib/errors";
import { sendNewMessage } from "../../lib/email";

export async function findOrCreateConversation(customerId: string, vendorId: string) {
  let [conversation] = await db.select().from(conversationsTable).where(and(eq(conversationsTable.customerId, customerId), eq(conversationsTable.vendorId, vendorId)));
  if (!conversation) {
    [conversation] = await db.insert(conversationsTable).values({ customerId, vendorId, lastMessageAt: new Date() }).returning();
  }
  return conversation;
}

export async function listMyConversations(userId: string, role: string) {
  let conversations: any[] = [];
  if (role === "customer") {
    const results = await db
      .select({
        id: conversationsTable.id,
        customerId: conversationsTable.customerId,
        vendorId: conversationsTable.vendorId,
        lastMessageAt: conversationsTable.lastMessageAt,
        customerUnread: conversationsTable.customerUnread,
        vendorUnread: conversationsTable.vendorUnread,
        endedAt: conversationsTable.endedAt,
        createdAt: conversationsTable.createdAt,
        vendorId_: vendorsTable.id,
        vendorSlug: vendorsTable.slug,
        vendorBusinessName: vendorsTable.businessName,
        vendorLogoUrl: vendorsTable.logoUrl,
      })
      .from(conversationsTable)
      .leftJoin(vendorsTable, eq(conversationsTable.vendorId, vendorsTable.id))
      .where(eq(conversationsTable.customerId, userId))
      .orderBy(desc(conversationsTable.lastMessageAt));

    conversations = results.map((r) => ({
      id: r.id,
      customerId: r.customerId,
      vendorId: r.vendorId,
      lastMessageAt: r.lastMessageAt,
      customerUnread: r.customerUnread,
      vendorUnread: r.vendorUnread,
      endedAt: r.endedAt,
      createdAt: r.createdAt,
      vendor: {
        id: r.vendorId_,
        slug: r.vendorSlug,
        businessName: r.vendorBusinessName,
        logoUrl: r.vendorLogoUrl,
      },
    }));
  } else {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, userId));
    if (!vendor) return [];
    const results = await db
      .select({
        id: conversationsTable.id,
        customerId: conversationsTable.customerId,
        vendorId: conversationsTable.vendorId,
        lastMessageAt: conversationsTable.lastMessageAt,
        customerUnread: conversationsTable.customerUnread,
        vendorUnread: conversationsTable.vendorUnread,
        endedAt: conversationsTable.endedAt,
        createdAt: conversationsTable.createdAt,
        customerId_: usersTable.id,
        customerName: usersTable.name,
        customerAvatarUrl: usersTable.avatarUrl,
      })
      .from(conversationsTable)
      .leftJoin(usersTable, eq(conversationsTable.customerId, usersTable.id))
      .where(eq(conversationsTable.vendorId, vendor.id))
      .orderBy(desc(conversationsTable.lastMessageAt));

    conversations = results.map((r) => ({
      id: r.id,
      customerId: r.customerId,
      vendorId: r.vendorId,
      lastMessageAt: r.lastMessageAt,
      customerUnread: r.customerUnread,
      vendorUnread: r.vendorUnread,
      endedAt: r.endedAt,
      createdAt: r.createdAt,
      customer: {
        id: r.customerId_,
        name: r.customerName,
        avatarUrl: r.customerAvatarUrl,
      },
    }));
  }

  for (const conv of conversations) {
    const [lastMessage] = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, conv.id)).orderBy(desc(messagesTable.createdAt)).limit(1);
    conv.lastMessage = lastMessage || null;
  }

  return conversations;
}

export async function getConversation(userId: string, conversationId: string, role: string) {
  let [conversation] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  if (!conversation) throw new NotFoundError("Conversation not found");

  let isParty = false;
  if (role === "customer") {
    isParty = conversation.customerId === userId;
  } else {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, userId));
    if (vendor) isParty = conversation.vendorId === vendor.id;
  }
  if (!isParty) throw new ForbiddenError("Not a party to this conversation");

  const messages = await db.select().from(messagesTable).where(and(eq(messagesTable.conversationId, conversationId), gt(messagesTable.expiresAt, new Date()))).orderBy(messagesTable.createdAt);
  return { conversation, messages };
}

export async function sendMessage(userId: string, conversationId: string, data: any, role: string) {
  const [conversation] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  if (!conversation) throw new NotFoundError("Conversation not found");

  let isParty = false;
  let senderRole = role;
  let recipientId: string | null = null;
  if (role === "customer") {
    isParty = conversation.customerId === userId;
    const vendorResult = await db.select({ userId: vendorsTable.userId }).from(vendorsTable).where(eq(vendorsTable.id, conversation.vendorId));
    if (vendorResult[0]) recipientId = vendorResult[0].userId;
  } else {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, userId));
    if (vendor) {
      isParty = conversation.vendorId === vendor.id;
      recipientId = conversation.customerId;
    }
  }
  if (!isParty) throw new ForbiddenError("Not a party to this conversation");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // messages expire after 30 days

  const [message] = await db.insert(messagesTable).values({
    conversationId,
    senderId: userId,
    senderRole,
    content: data.content,
    type: data.type || "text",
    attachmentUrl: data.attachmentUrl || null,
    expiresAt,
  }).returning();

  await db.update(conversationsTable).set({
    lastMessageAt: new Date(),
    customerUnread: role === "vendor" ? conversation.customerUnread + 1 : conversation.customerUnread,
    vendorUnread: role === "customer" ? conversation.vendorUnread + 1 : conversation.vendorUnread,
  }).where(eq(conversationsTable.id, conversationId));

  if (recipientId) {
    await createNotification(recipientId, {
      type: "message",
      title: "New message",
      body: data.content.substring(0, 100),
      data: { conversationId },
    });

    // Send email notification to recipient (only if their notifications are enabled)
    const [recipientUser] = await db.select().from(usersTable).where(eq(usersTable.id, recipientId));
    if (recipientUser?.email) {
      const prefs = typeof recipientUser.notificationPreferences === "string"
        ? JSON.parse(recipientUser.notificationPreferences || "{}")
        : recipientUser.notificationPreferences || {};
      // Default to true if not set
      if (prefs.email_messages !== false) {
        const [senderUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
        await sendNewMessage(recipientUser.email, {
          senderName: senderUser?.name || "Someone",
          preview: data.content.substring(0, 200),
        });
      }
    }
  }

  return message;
}

export async function markRead(userId: string, conversationId: string, role: string) {
  const [conversation] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  if (!conversation) throw new NotFoundError("Conversation not found");

  let isParty = false;
  if (role === "customer") {
    isParty = conversation.customerId === userId;
    if (isParty) {
      await db.update(messagesTable).set({ readAt: new Date() }).where(and(eq(messagesTable.conversationId, conversationId), eq(messagesTable.senderRole, "vendor")));
      await db.update(conversationsTable).set({ customerUnread: 0 }).where(eq(conversationsTable.id, conversationId));
    }
  } else {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, userId));
    if (vendor) {
      isParty = conversation.vendorId === vendor.id;
      if (isParty) {
        await db.update(messagesTable).set({ readAt: new Date() }).where(and(eq(messagesTable.conversationId, conversationId), eq(messagesTable.senderRole, "customer")));
        await db.update(conversationsTable).set({ vendorUnread: 0 }).where(eq(conversationsTable.id, conversationId));
      }
    }
  }
  if (!isParty) throw new ForbiddenError("Not a party to this conversation");

  return { success: true };
}

export async function exportTranscript(userId: string, conversationId: string, role: string) {
  const { conversation, messages } = await getConversation(userId, conversationId, role);
  let transcript = "";
  for (const msg of messages) {
    const sender = msg.senderRole === "customer" ? "Customer" : "Vendor";
    transcript += `[${new Date(msg.createdAt).toLocaleString()}] ${sender}: ${msg.content}\n`;
  }
  return transcript;
}

export async function endConversation(userId: string, conversationId: string, role: string) {
  const [conversation] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  if (!conversation) throw new NotFoundError("Conversation not found");

  let isParty = false;
  if (role === "customer") {
    isParty = conversation.customerId === userId;
  } else {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, userId));
    if (vendor) isParty = conversation.vendorId === vendor.id;
  }
  if (!isParty) throw new ForbiddenError("Not a party to this conversation");

  await db.update(conversationsTable).set({ endedAt: new Date() }).where(eq(conversationsTable.id, conversationId));
  return { success: true };
}


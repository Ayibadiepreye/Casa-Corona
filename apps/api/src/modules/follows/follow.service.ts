import { db, followsTable, vendorsTable, notificationsTable } from "@casa-corona/db";
import { eq, and, desc, sql } from "drizzle-orm";

async function createNotification(
  userId: string,
  type: "message" | "review" | "booking" | "payment" | "subscription" | "announcement" | "follow",
  title: string,
  body: string,
  link?: string
) {
  await db.insert(notificationsTable).values({
    userId,
    type,
    title,
    body,
    data: link ? { link } : null,
  });
}

export async function getMyFollows(userId: string, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const follows = await db
    .select({
      id: vendorsTable.id,
      slug: vendorsTable.slug,
      businessName: vendorsTable.businessName,
      description: vendorsTable.description,
      logoUrl: vendorsTable.logoUrl,
      coverUrl: vendorsTable.coverUrl,
      categoryId: vendorsTable.categoryId,
      address: vendorsTable.address,
      city: vendorsTable.city,
      state: vendorsTable.state,
      country: vendorsTable.country,
      latitude: vendorsTable.latitude,
      longitude: vendorsTable.longitude,
      phone: vendorsTable.phone,
      email: vendorsTable.email,
      website: vendorsTable.website,
      instagram: vendorsTable.instagram,
      twitter: vendorsTable.twitter,
      facebook: vendorsTable.facebook,
      whatsapp: vendorsTable.whatsapp,
      yearsInBusiness: vendorsTable.yearsInBusiness,
      teamSize: vendorsTable.teamSize,
      totalViews: vendorsTable.totalViews,
      totalSaves: vendorsTable.totalSaves,
      totalFollowers: vendorsTable.totalFollowers,
      averageRating: vendorsTable.averageRating,
      reviewCount: vendorsTable.reviewCount,
      featured: vendorsTable.featured,
      verified: vendorsTable.verified,
      userId: vendorsTable.userId,
      createdAt: vendorsTable.createdAt,
      updatedAt: vendorsTable.updatedAt,
      deletedAt: vendorsTable.deletedAt,
      followedAt: followsTable.createdAt,
    })
    .from(followsTable)
    .innerJoin(vendorsTable, eq(followsTable.vendorId, vendorsTable.id))
    .where(eq(followsTable.followerId, userId))
    .orderBy(desc(followsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));

  return { follows, total: countResult.count, page, pages: Math.ceil(countResult.count / limit) };
}

export async function followVendor(userId: string, vendorId: string) {
  const [existing] = await db
    .select()
    .from(followsTable)
    .where(and(eq(followsTable.followerId, userId), eq(followsTable.vendorId, vendorId)));
  if (existing) {
    return;
  }

  await db.insert(followsTable).values({
    followerId: userId,
    vendorId,
  });

  // Increment vendor's totalFollowers
  await db
    .update(vendorsTable)
    .set({ totalFollowers: sql`${vendorsTable.totalFollowers} + 1` })
    .where(eq(vendorsTable.id, vendorId));

  // Send notification to vendor
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, vendorId)).limit(1);
  if (vendor) {
    await createNotification(vendor.userId, "follow", "New Follower!", "Someone followed your business!", "/followers");
  }
}

export async function unfollowVendor(userId: string, vendorId: string) {
  const deleted = await db
    .delete(followsTable)
    .where(and(eq(followsTable.followerId, userId), eq(followsTable.vendorId, vendorId)));

  if (deleted.rowCount && deleted.rowCount > 0) {
    await db
      .update(vendorsTable)
      .set({ totalFollowers: sql`GREATEST(0, ${vendorsTable.totalFollowers} - 1)` })
      .where(eq(vendorsTable.id, vendorId));
  }
}

export async function isFollowing(userId: string, vendorId: string) {
  const [existing] = await db
    .select()
    .from(followsTable)
    .where(and(eq(followsTable.followerId, userId), eq(followsTable.vendorId, vendorId)));
  return existing ? true : false;
}
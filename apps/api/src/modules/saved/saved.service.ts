import { db, savedVendorsTable, vendorsTable } from "@casa-corona/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { ForbiddenError } from "../../lib/errors.js";

export async function getMySaved(userId: string, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  // Select all vendor fields explicitly to avoid type issues
  const saved = await db
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
      savedAt: savedVendorsTable.createdAt,
    })
    .from(savedVendorsTable)
    .innerJoin(vendorsTable, eq(savedVendorsTable.vendorId, vendorsTable.id))
    .where(eq(savedVendorsTable.userId, userId))
    .orderBy(desc(savedVendorsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(savedVendorsTable)
    .where(eq(savedVendorsTable.userId, userId));

  return { saved, total: countResult.count, page, pages: Math.ceil(countResult.count / limit) };
}

export async function saveVendor(userId: string, vendorId: string) {
  // Check if already saved
  const [existing] = await db
    .select()
    .from(savedVendorsTable)
    .where(and(eq(savedVendorsTable.userId, userId), eq(savedVendorsTable.vendorId, vendorId)));
  if (existing) {
    return;
  }

  await db.insert(savedVendorsTable).values({
    userId,
    vendorId,
  });

  // Increment vendor's totalSaves
  await db
    .update(vendorsTable)
    .set({ totalSaves: sql`${vendorsTable.totalSaves} + 1` })
    .where(eq(vendorsTable.id, vendorId));
}

export async function unsaveVendor(userId: string, vendorId: string) {
  const deleted = await db
    .delete(savedVendorsTable)
    .where(and(eq(savedVendorsTable.userId, userId), eq(savedVendorsTable.vendorId, vendorId)));

  if (deleted.rowCount && deleted.rowCount > 0) {
    // Decrement vendor's totalSaves
    await db
      .update(vendorsTable)
      .set({ totalSaves: sql`GREATEST(0, ${vendorsTable.totalSaves} - 1)` })
      .where(eq(vendorsTable.id, vendorId));
  }
}

export async function isSaved(userId: string, vendorId: string) {
  const [existing] = await db
    .select()
    .from(savedVendorsTable)
    .where(and(eq(savedVendorsTable.userId, userId), eq(savedVendorsTable.vendorId, vendorId)));
  return existing ? true : false;
}
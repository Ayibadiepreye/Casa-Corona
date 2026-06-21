import { db, vendorsTable } from "@casa-corona/db";
import { eq, desc, and, sql, isNull, not } from "drizzle-orm";

export async function getForYou(userId: string) {
  // Simple for now: just return featured vendors
  const vendors = await db
    .select()
    .from(vendorsTable)
    .where(and(eq(vendorsTable.featured, true), isNull(vendorsTable.deletedAt)))
    .orderBy(desc(vendorsTable.totalViews))
    .limit(10);
  return vendors;
}

export async function getSimilar(vendorId: string) {
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, vendorId)).limit(1);
  if (!vendor || !vendor.categoryId) return [];

  const similarVendors = await db
    .select()
    .from(vendorsTable)
    .where(
      and(
        eq(vendorsTable.categoryId, vendor.categoryId),
        not(eq(vendorsTable.id, vendorId)),
        isNull(vendorsTable.deletedAt)
      )
    )
    .orderBy(desc(vendorsTable.totalViews))
    .limit(6);

  return similarVendors;
}

export async function getTrendingNearYou() {
  const vendors = await db
    .select()
    .from(vendorsTable)
    .where(isNull(vendorsTable.deletedAt))
    .orderBy(desc(vendorsTable.totalViews))
    .limit(10);
  return vendors;
}
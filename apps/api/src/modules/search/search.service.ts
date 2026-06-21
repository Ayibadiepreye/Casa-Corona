import { db, vendorsTable, categoriesTable } from "@casa-corona/db";
import { eq, and, ilike, or, desc, sql, isNull, SQL } from "drizzle-orm";

export async function searchVendors(query: any) {
  const { q, category, state, city, sort, page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const whereClauses = [isNull(vendorsTable.deletedAt)];

  if (category) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, category)).limit(1);
    if (cat) {
      whereClauses.push(eq(vendorsTable.categoryId, cat.id));
    }
  }

  if (state) {
    whereClauses.push(eq(vendorsTable.state, state));
  }
  if (city) {
    whereClauses.push(eq(vendorsTable.city, city));
  }

  if (q) {
    const conditions = [
      ilike(vendorsTable.businessName, `%${q}%`),
      ilike(vendorsTable.city, `%${q}%`),
    ] as any;
    whereClauses.push(or(...conditions) as SQL);
  }

  let orderBy = [desc(vendorsTable.createdAt)];
  const whereClause = whereClauses.length > 0 ? and(...whereClauses) : undefined;

  const vendors = await db
    .select()
    .from(vendorsTable)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vendorsTable)
    .where(whereClause);

  return { vendors, total: countResult.count, page, pages: Math.ceil(countResult.count / limit) };
}

export async function searchSuggestions(q: string) {
  const suggestions = await db
    .select({
      id: vendorsTable.id,
      businessName: vendorsTable.businessName,
      slug: vendorsTable.slug,
    })
    .from(vendorsTable)
    .where(
      and(
        isNull(vendorsTable.deletedAt),
        ilike(vendorsTable.businessName, `%${q}%`)
      )
    )
    .limit(5);
  return suggestions;
}

export async function getTrendingVendors() {
  const vendors = await db
    .select()
    .from(vendorsTable)
    .where(isNull(vendorsTable.deletedAt))
    .orderBy(desc(vendorsTable.totalViews))
    .limit(10);
  return vendors;
}
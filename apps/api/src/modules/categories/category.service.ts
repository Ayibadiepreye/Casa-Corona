
import { db, categoriesTable, vendorsTable } from "@casa-corona/db";
import { eq, and, desc, sql, asc, isNull } from "drizzle-orm";
import { NotFoundError } from "../../lib/errors";

export async function listCategories() {
  const categories = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.active, true))
    .orderBy(asc(categoriesTable.displayOrder));

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(vendorsTable)
        .where(and(eq(vendorsTable.categoryId, cat.id), isNull(vendorsTable.deletedAt)));
      return { ...cat, vendorCount: countResult.count };
    }),
  );

  return categoriesWithCount;
}

export async function getCategoryBySlug(slug: string) {
  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(and(eq(categoriesTable.slug, slug), eq(categoriesTable.active, true)))
    .limit(1);
  if (!category) throw new NotFoundError("Category not found");

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vendorsTable)
    .where(and(eq(vendorsTable.categoryId, category.id), isNull(vendorsTable.deletedAt)));
  const categoryWithCount = { ...category, vendorCount: countResult.count };

  const featuredVendors = await db
    .select()
    .from(vendorsTable)
    .where(
      and(
        eq(vendorsTable.categoryId, category.id),
        eq(vendorsTable.featured, true),
        isNull(vendorsTable.deletedAt),
      ),
    )
    .orderBy(desc(vendorsTable.createdAt))
    .limit(20);

  const recentVendors = await db
    .select()
    .from(vendorsTable)
    .where(
      and(
        eq(vendorsTable.categoryId, category.id),
        isNull(vendorsTable.deletedAt),
      ),
    )
    .orderBy(desc(vendorsTable.createdAt))
    .limit(20);

  return { category: categoryWithCount, featuredVendors, recentVendors };
}


import {
  db,
  vendorsTable,
  usersTable,
  categoriesTable,
  servicesTable,
  productsTable,
  portfolioShotsTable,
  reviewsTable,
  vendorViewsTable,
} from "@casa-corona/db";
import { eq, and, ilike, desc, asc, or, SQL, sql, isNull } from "drizzle-orm";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../lib/errors";
import { z } from "zod";
import { createVendorSchema, vendorQuerySchema } from "./vendor.schema";
import { uploadImage } from "../../lib/cloudinary";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateSlug(businessName: string) {
  let baseSlug = slugify(businessName);
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await db
      .select()
      .from(vendorsTable)
      .where(eq(vendorsTable.slug, slug))
      .limit(1);
    if (existing.length === 0) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

export async function createVendor(userId: string, data: z.infer<typeof createVendorSchema>) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) throw new NotFoundError("User not found");
  if (user.role !== "vendor") throw new UnauthorizedError("Only vendors can create a vendor profile");

  const existingVendor = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.userId, userId))
    .limit(1);
  if (existingVendor.length > 0)
    throw new ConflictError("Vendor profile already exists for this user");

  const slug = await generateSlug(data.businessName);
  const [vendor] = await db
    .insert(vendorsTable)
    .values({ ...data, userId, slug })
    .returning();
  return vendor;
}

export async function getVendorBySlug(slug: string) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(and(eq(vendorsTable.slug, slug), isNull(vendorsTable.deletedAt)))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");

  let category;
  if (vendor.categoryId) {
    const [cat] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, vendor.categoryId))
      .limit(1);
    category = cat;
  }
  const [user] = await db
    .select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, vendor.userId))
    .limit(1);
  const services = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.vendorId, vendor.id), eq(servicesTable.active, true)))
    .orderBy(asc(servicesTable.displayOrder), desc(servicesTable.createdAt));
  const products = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.vendorId, vendor.id), eq(productsTable.active, true)));
  const portfolioShots = await db
    .select()
    .from(portfolioShotsTable)
    .where(eq(portfolioShotsTable.vendorId, vendor.id))
    .orderBy(desc(portfolioShotsTable.createdAt))
    .limit(12);

  return {
    ...vendor,
    category,
    user,
    services,
    products,
    portfolioShots,
    reviewsSummary: {
      averageRating: vendor.averageRating,
      reviewCount: vendor.reviewCount,
    },
  };
}

export async function getVendorById(id: string) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(and(eq(vendorsTable.id, id), isNull(vendorsTable.deletedAt)))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");

  let category;
  if (vendor.categoryId) {
    const [cat] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, vendor.categoryId))
      .limit(1);
    category = cat;
  }
  const [user] = await db
    .select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, vendor.userId))
    .limit(1);
  const services = await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.vendorId, vendor.id), eq(servicesTable.active, true)))
    .orderBy(asc(servicesTable.displayOrder), desc(servicesTable.createdAt));
  const products = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.vendorId, vendor.id), eq(productsTable.active, true)));
  const portfolioShots = await db
    .select()
    .from(portfolioShotsTable)
    .where(eq(portfolioShotsTable.vendorId, vendor.id))
    .orderBy(desc(portfolioShotsTable.createdAt))
    .limit(12);

  return {
    ...vendor,
    category,
    user,
    services,
    products,
    portfolioShots,
    reviewsSummary: {
      averageRating: vendor.averageRating,
      reviewCount: vendor.reviewCount,
    },
  };
}

export async function getMyVendor(userId: string) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.userId, userId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor profile not found");

  let category;
  if (vendor.categoryId) {
    const [cat] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, vendor.categoryId))
      .limit(1);
    category = cat;
  }
  const [user] = await db
    .select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, vendor.userId))
    .limit(1);
  const services = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.vendorId, vendor.id))
    .orderBy(asc(servicesTable.displayOrder), desc(servicesTable.createdAt));
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.vendorId, vendor.id));
  const portfolioShots = await db
    .select()
    .from(portfolioShotsTable)
    .where(eq(portfolioShotsTable.vendorId, vendor.id))
    .orderBy(desc(portfolioShotsTable.createdAt));

  return {
    ...vendor,
    category,
    user,
    services,
    products,
    portfolioShots,
    reviewsSummary: {
      averageRating: vendor.averageRating,
      reviewCount: vendor.reviewCount,
    },
  };
}

export async function updateVendor(userId: string, vendorId: string, data: any) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) throw new NotFoundError("User not found");
  const isOwner = vendor.userId === userId;
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isOwner && !isAdmin)
    throw new UnauthorizedError("You are not authorized to update this vendor");

  const [updated] = await db
    .update(vendorsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(vendorsTable.id, vendorId))
    .returning();
  return updated;
}

export async function softDeleteVendor(userId: string, vendorId: string) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to delete this vendor");

  await db
    .update(vendorsTable)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(vendorsTable.id, vendorId));
}

export async function uploadLogo(userId: string, vendorId: string, file: Express.Multer.File) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to upload a logo for this vendor");

  const result = (await uploadImage(file, "vendors/logos")) as { url: string; publicId: string };
  const [updated] = await db
    .update(vendorsTable)
    .set({ logoUrl: result.url, updatedAt: new Date() })
    .where(eq(vendorsTable.id, vendorId))
    .returning();
  return { logoUrl: updated.logoUrl };
}

export async function uploadCover(userId: string, vendorId: string, file: Express.Multer.File) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to upload a cover for this vendor");

  const result = (await uploadImage(file, "vendors/covers")) as { url: string; publicId: string };
  const [updated] = await db
    .update(vendorsTable)
    .set({ coverUrl: result.url, updatedAt: new Date() })
    .where(eq(vendorsTable.id, vendorId))
    .returning();
  return { coverUrl: updated.coverUrl };
}

export async function trackView(vendorId: string) {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  await db
    .update(vendorsTable)
    .set({ totalViews: sql`${vendorsTable.totalViews} + 1` })
    .where(eq(vendorsTable.id, vendorId));
  // Upsert daily bucket for analytics
  await db.execute(sql`
    INSERT INTO vendor_views (vendor_id, day, count, updated_at)
    VALUES (${vendorId}::uuid, ${day}, 1, now())
    ON CONFLICT (vendor_id, day)
    DO UPDATE SET count = vendor_views.count + 1, updated_at = now()
  `);
}

export async function getViewStats(vendorId: string) {
  // Last 7 days
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push(d);
  }
  // inArray() expands correctly with drizzle-orm; ANY + text[] is finicky.
  const rows = (await db.execute(sql`
    SELECT day, count FROM vendor_views
    WHERE vendor_id = ${vendorId}::uuid
      AND day IN (${sql.join(days.map(d => sql`${d}`), sql`, `)})
  `)).rows as Array<{ day: string; count: number }>;
  const byDay: Record<string, number> = {};
  days.forEach((d) => (byDay[d] = 0));
  rows.forEach((r) => (byDay[r.day] = (byDay[r.day] ?? 0) + Number(r.count)));
  const last7 = days.reduce((sum, d) => sum + (byDay[d] ?? 0), 0);
  const totalRes = await db.execute(sql`SELECT COALESCE(SUM(count), 0)::int AS total FROM vendor_views WHERE vendor_id = ${vendorId}::uuid`);
  const total = (totalRes.rows as Array<{ total: number }>)[0]?.total ?? 0;
  return {
    totalViews: Number(total),
    last7Days: last7,
    byDay: days.map((d) => ({ day: d, count: byDay[d] ?? 0 })),
  };
}

export async function listVendors(query: z.infer<typeof vendorQuerySchema>) {
  const { page, limit, category, state, city, q, featured, verified, sort, priceRange } = query;

  const offset = (page - 1) * limit;
  const whereClauses: SQL[] = [isNull(vendorsTable.deletedAt)];

  if (category) {
    const [cat] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, category))
      .limit(1);
    if (cat) {
      whereClauses.push(eq(vendorsTable.categoryId, cat.id));
    }
  }
  if (state) whereClauses.push(eq(vendorsTable.state, state));
  if (city) whereClauses.push(eq(vendorsTable.city, city));
  if (q) {
    const conditions = [
      ilike(vendorsTable.businessName, `%${q}%`),
      ilike(vendorsTable.city, `%${q}%`),
    ] as SQL[];
    whereClauses.push(or(...conditions) as SQL);
  }
  if (featured !== undefined) whereClauses.push(eq(vendorsTable.featured, featured));
  if (verified !== undefined) whereClauses.push(eq(vendorsTable.verified, verified));
  if (priceRange) whereClauses.push(eq(vendorsTable.priceRange, priceRange));

  let orderByClause: SQL[];
  switch (sort) {
    case "oldest":
      orderByClause = [asc(vendorsTable.createdAt)];
      break;
    case "rating":
      orderByClause = [desc(vendorsTable.averageRating)];
      break;
    case "popular":
      orderByClause = [desc(vendorsTable.totalViews)];
      break;
    default:
      orderByClause = [desc(vendorsTable.createdAt)];
  }

  const vendors = await db
    .select()
    .from(vendorsTable)
    .where(whereClauses.length ? and(...whereClauses) : undefined)
    .orderBy(...orderByClause)
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vendorsTable)
    .where(whereClauses.length ? and(...whereClauses) : undefined);
  const total = countResult.count;
  const pages = Math.ceil(total / limit);

  return { vendors, total, page, pages };
}

export async function getVendorServices(vendorId: string) {
  return await db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.vendorId, vendorId), eq(servicesTable.active, true)))
    .orderBy(asc(servicesTable.displayOrder), desc(servicesTable.createdAt));
}

export async function getVendorProducts(vendorId: string) {
  return await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.vendorId, vendorId), eq(productsTable.active, true)));
}

export async function getVendorPortfolio(
  vendorId: string,
  { page = 1, limit = 20 }: { page: number; limit: number },
) {
  const offset = (page - 1) * limit;
  const portfolioShots = await db
    .select()
    .from(portfolioShotsTable)
    .where(eq(portfolioShotsTable.vendorId, vendorId))
    .orderBy(desc(portfolioShotsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(portfolioShotsTable)
    .where(eq(portfolioShotsTable.vendorId, vendorId));
  const total = countResult.count;
  const pages = Math.ceil(total / limit);

  return { portfolioShots, total, page, pages };
}

export async function getVendorReviews(
  vendorId: string,
  { page = 1, limit = 20, sort }: { page: number; limit: number; sort?: string },
) {
  const offset = (page - 1) * limit;
  let orderByClause: SQL[] = [desc(reviewsTable.createdAt)];
  if (sort === "rating") {
    orderByClause = [desc(reviewsTable.rating)];
  } else if (sort === "helpful") {
    orderByClause = [desc(reviewsTable.helpfulCount)];
  }

  const reviews = await db
    .select({
      id: reviewsTable.id,
      rating: reviewsTable.rating,
      content: reviewsTable.content,
      photos: reviewsTable.photos,
      vendorReply: reviewsTable.vendorReply,
      vendorReplyAt: reviewsTable.vendorReplyAt,
      helpfulCount: reviewsTable.helpfulCount,
      reported: reviewsTable.reported,
      hidden: reviewsTable.hidden,
      createdAt: reviewsTable.createdAt,
      user: {
        id: usersTable.id,
        name: usersTable.name,
        avatarUrl: usersTable.avatarUrl,
      },
    })
    .from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.vendorId, vendorId))
    .orderBy(...orderByClause)
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviewsTable)
    .where(eq(reviewsTable.vendorId, vendorId));
  const total = countResult.count;
  const pages = Math.ceil(total / limit);

  return { reviews, total, page, pages };
}

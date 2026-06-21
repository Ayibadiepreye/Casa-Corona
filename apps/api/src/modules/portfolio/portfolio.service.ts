
import { db, portfolioShotsTable, vendorsTable } from "@casa-corona/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { NotFoundError, UnauthorizedError, ConflictError } from "../../lib/errors.js";
import { z } from "zod";
import { createPortfolioSchema, updatePortfolioSchema } from "./portfolio.schema.js";
import { uploadImage, deleteImage } from "../../lib/cloudinary.js";

export async function addPortfolioShot(
  userId: string,
  vendorId: string,
  file: Express.Multer.File,
  data: z.infer<typeof createPortfolioSchema>,
) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to add portfolio shots to this vendor");

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(portfolioShotsTable)
    .where(eq(portfolioShotsTable.vendorId, vendorId));
  if (countResult.count >= 20)
    throw new ConflictError("Maximum 20 portfolio shots allowed");

  const result = (await uploadImage(file, "vendors/portfolio")) as { url: string; publicId: string };
  const [portfolioShot] = await db
    .insert(portfolioShotsTable)
    .values({
      ...data,
      vendorId,
      imageUrl: result.url,
      publicId: result.publicId,
    })
    .returning();
  return portfolioShot;
}

export async function updatePortfolioShot(
  userId: string,
  shotId: string,
  data: z.infer<typeof updatePortfolioSchema>,
) {
  const [shot] = await db
    .select()
    .from(portfolioShotsTable)
    .where(eq(portfolioShotsTable.id, shotId))
    .limit(1);
  if (!shot) throw new NotFoundError("Portfolio shot not found");

  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, shot.vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to update this portfolio shot");

  const [updated] = await db
    .update(portfolioShotsTable)
    .set(data)
    .where(eq(portfolioShotsTable.id, shotId))
    .returning();
  return updated;
}

export async function deletePortfolioShot(userId: string, shotId: string) {
  const [shot] = await db
    .select()
    .from(portfolioShotsTable)
    .where(eq(portfolioShotsTable.id, shotId))
    .limit(1);
  if (!shot) throw new NotFoundError("Portfolio shot not found");

  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, shot.vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to delete this portfolio shot");

  if (shot.publicId) {
    await deleteImage(shot.publicId);
  }
  await db.delete(portfolioShotsTable).where(eq(portfolioShotsTable.id, shotId));
}

export async function getPortfolioShotById(shotId: string) {
  const [shot] = await db
    .select()
    .from(portfolioShotsTable)
    .where(eq(portfolioShotsTable.id, shotId))
    .limit(1);
  if (!shot) throw new NotFoundError("Portfolio shot not found");
  return shot;
}

export async function listPortfolioByVendor(
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

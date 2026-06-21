
import { db, productsTable, vendorsTable } from "@casa-corona/db";
import { eq } from "drizzle-orm";
import { NotFoundError, UnauthorizedError } from "../../lib/errors";
import { z } from "zod";
import { createProductSchema, updateProductSchema } from "./product.schema";

export async function createProduct(
  userId: string,
  vendorId: string,
  data: z.infer<typeof createProductSchema>,
) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to add products to this vendor");

  const [product] = await db.insert(productsTable).values({ ...data, vendorId }).returning();
  return product;
}

export async function updateProduct(
  userId: string,
  productId: string,
  data: z.infer<typeof updateProductSchema>,
) {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);
  if (!product) throw new NotFoundError("Product not found");

  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, product.vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to update this product");

  const [updated] = await db
    .update(productsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(productsTable.id, productId))
    .returning();
  return updated;
}

export async function deleteProduct(userId: string, productId: string) {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);
  if (!product) throw new NotFoundError("Product not found");

  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, product.vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to delete this product");

  await db.update(productsTable).set({ active: false, updatedAt: new Date() }).where(eq(productsTable.id, productId));
}

export async function getProductById(productId: string) {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);
  if (!product) throw new NotFoundError("Product not found");
  return product;
}

export async function listProductsByVendor(vendorId: string) {
  return await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.vendorId, vendorId));
}

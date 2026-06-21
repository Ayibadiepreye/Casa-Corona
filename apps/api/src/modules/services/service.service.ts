
import { db, servicesTable, vendorsTable } from "@casa-corona/db";
import { eq } from "drizzle-orm";
import { NotFoundError, UnauthorizedError } from "../../lib/errors.js";
import { z } from "zod";
import { createServiceSchema, updateServiceSchema } from "./service.schema.js";

export async function createService(
  userId: string,
  vendorId: string,
  data: z.infer<typeof createServiceSchema>,
) {
  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to add services to this vendor");

  const [service] = await db.insert(servicesTable).values({ ...data, vendorId }).returning();
  return service;
}

export async function updateService(
  userId: string,
  serviceId: string,
  data: z.infer<typeof updateServiceSchema>,
) {
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, serviceId))
    .limit(1);
  if (!service) throw new NotFoundError("Service not found");

  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, service.vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to update this service");

  const [updated] = await db
    .update(servicesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(servicesTable.id, serviceId))
    .returning();
  return updated;
}

export async function deleteService(userId: string, serviceId: string) {
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, serviceId))
    .limit(1);
  if (!service) throw new NotFoundError("Service not found");

  const [vendor] = await db
    .select()
    .from(vendorsTable)
    .where(eq(vendorsTable.id, service.vendorId))
    .limit(1);
  if (!vendor) throw new NotFoundError("Vendor not found");
  if (vendor.userId !== userId)
    throw new UnauthorizedError("You are not authorized to delete this service");

  await db.update(servicesTable).set({ active: false, updatedAt: new Date() }).where(eq(servicesTable.id, serviceId));
}

export async function getServiceById(serviceId: string) {
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, serviceId))
    .limit(1);
  if (!service) throw new NotFoundError("Service not found");
  return service;
}

export async function listServicesByVendor(vendorId: string) {
  return await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.vendorId, vendorId));
}

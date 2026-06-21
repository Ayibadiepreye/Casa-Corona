
import { z } from "zod";

export const suspendUserSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const updateUserSchema = z.object({
  role: z.enum(["customer", "vendor", "moderator", "admin", "super_admin"]).optional(),
  suspended: z.boolean().optional(),
  suspendedReason: z.string().optional().nullable(),
});

export const updateVendorAdminSchema = z.object({
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  featuredUntil: z.string().transform((val) => val ? new Date(val) : undefined).optional(),
  suspended: z.boolean().optional(),
  suspendedReason: z.string().optional().nullable(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be kebab-case"),
  icon: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const approveCustomCategorySchema = z.object({
  categoryId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export const platformSettingsUpdateSchema = z.object({
  category: z.string(),
  updates: z.record(z.any()),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  targetRole: z.array(z.enum(["customer", "vendor", "moderator", "admin", "super_admin"])).optional(),
  startsAt: z.string().transform((val) => new Date(val)),
  endsAt: z.string().transform((val) => val ? new Date(val) : undefined).optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export const createFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

export const updateFaqSchema = createFaqSchema.partial();

export const listUsersQuerySchema = z.object({
  page: z.string().transform(Number).default("1").pipe(z.number().int().positive()),
  limit: z.string().transform(Number).default("20").pipe(z.number().int().positive().max(100)),
  role: z.enum(["customer", "vendor", "moderator", "admin", "super_admin"]).optional(),
  suspended: z.string().transform((val) => val === "true").optional(),
  q: z.string().optional(),
});

export const listVendorsQuerySchema = z.object({
  page: z.string().transform(Number).default("1").pipe(z.number().int().positive()),
  limit: z.string().transform(Number).default("20").pipe(z.number().int().positive().max(100)),
  status: z.enum(["inactive", "active", "expired", "cancelled"]).optional(),
  categoryId: z.string().uuid().optional(),
  verified: z.string().transform((val) => val === "true").optional(),
  featured: z.string().transform((val) => val === "true").optional(),
  q: z.string().optional(),
});

export const bulkApproveVendorsSchema = z.object({
  vendorIds: z.array(z.string().uuid()),
});

export const listAuditLogsQuerySchema = z.object({
  page: z.string().transform(Number).default("1").pipe(z.number().int().positive()),
  limit: z.string().transform(Number).default("20").pipe(z.number().int().positive().max(100)),
  actorId: z.string().uuid().optional(),
  resourceType: z.string().optional(),
});


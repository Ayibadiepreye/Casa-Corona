
import { z } from "zod";

const priceRangeEnum = z.enum(["budget", "mid", "premium", "luxury"]);

export const createVendorSchema = z.object({
  businessName: z.string().min(1).max(100),
  categoryId: z.string().uuid(),
  description: z.string().max(2000).optional(),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  instagram: z.string().url().optional(),
  twitter: z.string().url().optional(),
  facebook: z.string().url().optional(),
  tiktok: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string(),
  state: z.string(),
  country: z.string().default("Nigeria"),
  serviceArea: z.string().optional(),
  priceRange: priceRangeEnum.optional(),
  yearsInBusiness: z.string().optional(),
  teamSize: z.string().optional(),
  hours: z.any().optional(),
  holidays: z.any().optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

const sortEnum = z.enum(["newest", "oldest", "rating", "popular"]);

export const vendorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  q: z.string().optional(),
  featured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  verified: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  sort: sortEnum.default("newest"),
  priceRange: priceRangeEnum.optional(),
});

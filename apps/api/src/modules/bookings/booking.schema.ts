import { z } from "zod";

const statusEnum = z.enum(["pending", "confirmed", "completed", "cancelled"]);
const typeEnum = z.enum(["upcoming", "past", "all"]);

export const createBookingSchema = z.object({
  vendorId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledFor: z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Invalid ISO datetime string" }),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string(),
  customerEmail: z.string().email(),
  notes: z.string().max(500).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: statusEnum,
  vendorNotes: z.string().optional(),
});

export const bookingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: statusEnum.optional(),
  type: typeEnum.optional(),
});
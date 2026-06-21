
import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  priceMin: z.number().int().min(0),
  priceMax: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(0).optional(),
  popular: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
});

export const updateServiceSchema = createServiceSchema.partial();

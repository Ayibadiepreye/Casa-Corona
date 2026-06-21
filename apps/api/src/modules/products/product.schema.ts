
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().min(0),
  buyLink: z.string().url().optional(),
  images: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();


import { z } from "zod";

export const createPortfolioSchema = z.object({
  caption: z.string().max(500).optional(),
  category: z.string().optional(),
});

export const updatePortfolioSchema = createPortfolioSchema.partial();

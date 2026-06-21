import { z } from "zod";

const sortEnum = z.enum(["newest", "highest", "helpful"]);

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  // Accept either `content` (preferred) or `comment` (legacy alias)
  content: z.string().min(1).max(1000).optional(),
  comment: z.string().min(1).max(1000).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
}).transform((d) => ({ ...d, content: d.content ?? d.comment }));

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  content: z.string().min(1).max(1000).optional(),
  photos: z.array(z.string()).optional(),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: sortEnum.default("newest"),
});
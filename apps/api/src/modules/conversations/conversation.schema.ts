
import { z } from "zod";

export const createConversationSchema = z.object({
  vendorId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(["text", "image", "file"]).default("text"),
  attachmentUrl: z.string().url().optional(),
});


import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/requireAuth";
import { ok, notFound, forbidden } from "../../lib/response";
import { db } from "@casa-corona/db";
import { notificationsTable } from "@casa-corona/db";
import { and, eq, desc } from "drizzle-orm";

const router: IRouter = Router();

// GET /notifications — list current user's notifications (newest first)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    return ok(res, { notifications: rows });
  } catch (e) {
    return next(e);
  }
});

// PATCH /notifications/:id/read
router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id as string;
    const [row] = await db
      .select()
      .from(notificationsTable)
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
    if (!row) return notFound(res, "Notification not found");
    await db
      .update(notificationsTable)
      .set({ readAt: new Date(), read: true })
      .where(eq(notificationsTable.id, id));
    return ok(res, { success: true });
  } catch (e) {
    return next(e);
  }
});

// PATCH /notifications/read-all
router.patch("/read-all", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    await db
      .update(notificationsTable)
      .set({ readAt: new Date(), read: true })
      .where(eq(notificationsTable.userId, userId));
    return ok(res, { success: true });
  } catch (e) {
    return next(e);
  }
});

const createSchema = z.object({
  userId: z.string().uuid(),
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  data: z.record(z.any()).optional(),
});

// POST /notifications — admin/system create
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const role = (req as any).user.role;
    if (role !== "admin" && role !== "super_admin") return forbidden(res, "Admin only");
    const body = createSchema.parse(req.body);
    const [row] = await db
      .insert(notificationsTable)
      .values({ ...body })
      .returning();
    return ok(res, { notification: row });
  } catch (e) {
    if (e instanceof z.ZodError) return (await import("../../lib/response")).badRequest(res, e.errors[0]?.message ?? "Bad request");
    return next(e);
  }
});

export default router;

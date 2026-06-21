
import { Router } from "express";
import * as settingsController from "./settings.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";

const router = Router();

router.get("/", settingsController.getPublicSettings);
router.get("/public", settingsController.getPublicSettings);

router.get("/admin", requireAuth, requireRole("admin", "super_admin"), settingsController.getAdminSettings);
router.put("/admin", requireAuth, requireRole("admin", "super_admin"), settingsController.updateSettings);

export default router;

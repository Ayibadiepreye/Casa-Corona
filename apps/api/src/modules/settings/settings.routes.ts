
import { Router } from "express";
import * as settingsController from "./settings.controller.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

router.get("/", settingsController.getPublicSettings);
router.get("/public", settingsController.getPublicSettings);

router.get("/admin", requireAuth, requireRole("admin", "super_admin"), settingsController.getAdminSettings);
router.put("/admin", requireAuth, requireRole("admin", "super_admin"), settingsController.updateSettings);

export default router;

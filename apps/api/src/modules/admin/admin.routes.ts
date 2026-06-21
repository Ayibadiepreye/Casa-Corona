
import { Router } from "express";
import * as adminController from "./admin.controller.js";
import * as settingsController from "../settings/settings.controller.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin", "super_admin"));

router.get("/settings", settingsController.getAdminSettings);
router.put("/settings", settingsController.updateSettings);

router.get("/stats", adminController.getPlatformStats);

router.get("/users", adminController.listAllUsers);
router.get("/users/:id", adminController.getUserDetail);
router.patch("/users/:id/suspend", adminController.suspendUser);
router.patch("/users/:id/unsuspend", adminController.unsuspendUser);
router.delete("/users/:id", adminController.deleteUser);
router.post("/users/:id/impersonate", requireRole("super_admin"), adminController.impersonateUser);

router.get("/vendors", adminController.listAllVendors);
router.get("/vendors/pending", adminController.listPendingVendors);
router.post("/vendors/bulk-approve", adminController.bulkApproveVendors);
router.patch("/vendors/:id", adminController.updateVendor);
router.delete("/vendors/:id", adminController.suspendVendor);

router.post("/categories", adminController.createCategory);
router.patch("/categories/:id", adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

router.get("/announcements", adminController.listAnnouncements);
router.post("/announcements", adminController.createAnnouncement);
router.patch("/announcements/:id", adminController.updateAnnouncement);
router.delete("/announcements/:id", adminController.deleteAnnouncement);

router.get("/faqs", adminController.listFaqs);
router.post("/faqs", adminController.createFaq);
router.patch("/faqs/:id", adminController.updateFaq);
router.delete("/faqs/:id", adminController.deleteFaq);

router.get("/audit-logs", requireRole("super_admin"), adminController.listAuditLogs);

router.get("/system-health", adminController.getSystemHealth);

router.get("/export/:table", adminController.exportDataAsCsv);

export default router;

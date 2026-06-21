
import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { validate } from "../../middlewares/validate.js";
import {
  createVendorSchema,
  updateVendorSchema,
  vendorQuerySchema,
} from "./vendor.schema.js";
import { upload } from "../../lib/upload.js";
import * as vendorController from "./vendor.controller.js";
import * as savedController from "../saved/saved.controller.js";
import * as followController from "../follows/follow.controller.js";

const router = Router();

// IMPORTANT: static + slug-based routes must be declared BEFORE the
// parametric `/:id` routes so Express matches them first. Otherwise
// `GET /vendors/:slug` is captured by `/:id` and getVendorBySlug never runs.
router.get(
  "/",
  validate({ query: vendorQuerySchema }),
  vendorController.listVendors,
);
router.get("/me", requireAuth, requireRole("vendor"), vendorController.getMyVendor);
router.get("/:slug", vendorController.getVendorBySlug);

// Save / Follow — must come before /:id to avoid swallowing save/follow paths
router.post("/:vendorId/save", requireAuth, savedController.saveVendor);
router.delete("/:vendorId/save", requireAuth, savedController.unsaveVendor);
router.get("/:vendorId/is-saved", requireAuth, savedController.isSaved);
router.post("/:vendorId/follow", requireAuth, followController.followVendor);
router.delete("/:vendorId/follow", requireAuth, followController.unfollowVendor);
router.get("/:vendorId/is-following", requireAuth, followController.isFollowing);

router.post(
  "/",
  requireAuth,
  requireRole("vendor"),
  validate({ body: createVendorSchema }),
  vendorController.createVendor,
);
router.patch(
  "/:id",
  requireAuth,
  validate({ body: updateVendorSchema }),
  vendorController.updateVendor,
);
router.delete("/:id", requireAuth, vendorController.deleteVendor);
router.post(
  "/:id/logo",
  requireAuth,
  upload.single("logo"),
  vendorController.uploadLogo,
);
router.post(
  "/:id/cover",
  requireAuth,
  upload.single("cover"),
  vendorController.uploadCover,
);
router.post("/:id/track-view", vendorController.trackView);
router.get("/:id/view-stats", vendorController.getViewStats);
router.get("/:id/services", vendorController.getVendorServices);
router.get("/:id/products", vendorController.getVendorProducts);
router.get("/:id/portfolio", vendorController.getVendorPortfolio);
router.get("/:id/reviews", vendorController.getVendorReviews);

export default router;

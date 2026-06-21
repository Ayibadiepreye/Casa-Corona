import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { validate } from "../../middlewares/validate.js";
import * as reviewController from "./review.controller.js";
import { createReviewSchema, updateReviewSchema, reviewQuerySchema } from "./review.schema.js";

const router = Router();

router.post(
  "/vendors/:vendorId/reviews",
  requireAuth,
  requireRole("customer"),
  validate({ body: createReviewSchema }),
  reviewController.createReview
);
router.get(
  "/vendors/:vendorId/reviews",
  validate({ query: reviewQuerySchema }),
  reviewController.listVendorReviews
);
router.get("/reviews/me", requireAuth, reviewController.listMyReviews);
router.patch(
  "/reviews/:id",
  requireAuth,
  validate({ body: updateReviewSchema }),
  reviewController.updateReview
);
router.delete("/reviews/:id", requireAuth, reviewController.deleteReview);
router.post("/reviews/:id/reply", requireAuth, reviewController.replyToReview);
router.post("/reviews/:id/helpful", requireAuth, reviewController.toggleHelpful);
router.post("/reviews/:id/report", requireAuth, reviewController.reportReview);

export default router;
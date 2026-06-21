import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import * as recommendationController from "./recommendation.controller.js";

const router = Router();

router.get("/recommendations/for-you", requireAuth, recommendationController.getForYou);
router.get("/recommendations/similar/:vendorId", recommendationController.getSimilar);
router.get("/recommendations/trending-near-you", recommendationController.getTrendingNearYou);

export default router;
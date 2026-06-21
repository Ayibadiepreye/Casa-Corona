
import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { validate } from "../../middlewares/validate";
import { createPortfolioSchema, updatePortfolioSchema } from "./portfolio.schema";
import { upload } from "../../lib/upload";
import * as portfolioController from "./portfolio.controller";

const router = Router();

router.post(
  "/vendors/:vendorId/portfolio",
  requireAuth,
  upload.single("image"),
  validate({ body: createPortfolioSchema }),
  portfolioController.addPortfolioShot,
);
router.patch(
  "/portfolio/:id",
  requireAuth,
  validate({ body: updatePortfolioSchema }),
  portfolioController.updatePortfolioShot,
);
router.delete(
  "/portfolio/:id",
  requireAuth,
  portfolioController.deletePortfolioShot,
);
router.get("/portfolio/:id", portfolioController.getPortfolioShotById);

export default router;

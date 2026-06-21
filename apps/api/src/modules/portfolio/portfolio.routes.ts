
import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { validate } from "../../middlewares/validate.js";
import { createPortfolioSchema, updatePortfolioSchema } from "./portfolio.schema.js";
import { upload } from "../../lib/upload.js";
import * as portfolioController from "./portfolio.controller.js";

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

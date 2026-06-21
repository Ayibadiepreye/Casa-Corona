
import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { validate } from "../../middlewares/validate.js";
import { createServiceSchema, updateServiceSchema } from "./service.schema.js";
import * as serviceController from "./service.controller.js";

const router = Router();

router.post(
  "/vendors/:vendorId/services",
  requireAuth,
  validate({ body: createServiceSchema }),
  serviceController.createService,
);
router.patch(
  "/services/:id",
  requireAuth,
  validate({ body: updateServiceSchema }),
  serviceController.updateService,
);
router.delete(
  "/services/:id",
  requireAuth,
  serviceController.deleteService,
);
router.get("/services/:id", serviceController.getServiceById);

export default router;

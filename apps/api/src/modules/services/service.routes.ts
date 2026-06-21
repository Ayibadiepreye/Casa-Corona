
import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { validate } from "../../middlewares/validate";
import { createServiceSchema, updateServiceSchema } from "./service.schema";
import * as serviceController from "./service.controller";

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

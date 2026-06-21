
import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { validate } from "../../middlewares/validate.js";
import { createProductSchema, updateProductSchema } from "./product.schema.js";
import * as productController from "./product.controller.js";

const router = Router();

router.post(
  "/vendors/:vendorId/products",
  requireAuth,
  validate({ body: createProductSchema }),
  productController.createProduct,
);
router.patch(
  "/products/:id",
  requireAuth,
  validate({ body: updateProductSchema }),
  productController.updateProduct,
);
router.delete(
  "/products/:id",
  requireAuth,
  productController.deleteProduct,
);
router.get("/products/:id", productController.getProductById);

export default router;

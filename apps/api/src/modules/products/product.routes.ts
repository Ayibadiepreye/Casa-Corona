
import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { validate } from "../../middlewares/validate";
import { createProductSchema, updateProductSchema } from "./product.schema";
import * as productController from "./product.controller";

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

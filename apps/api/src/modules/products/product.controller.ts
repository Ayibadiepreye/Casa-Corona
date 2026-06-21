
import { Request, Response, NextFunction } from "express";
import { ok, created } from "../../lib/response.js";
import { AuthRequest } from "../../middlewares/requireAuth.js";
import * as productService from "./product.service.js";
import { createProductSchema, updateProductSchema } from "./product.schema.js";

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = createProductSchema.parse(req.body);
    const product = await productService.createProduct(
      req.user.userId,
      req.params.vendorId as string,
      data
    );
    created(res, product);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(
      req.user.userId,
      req.params.id as string,
      data
    );
    ok(res, product);
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    await productService.deleteProduct(req.user.userId, req.params.id as string);
    ok(res, { success: true });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getProductById(req.params.id as string);
    ok(res, product);
  } catch (err) {
    next(err);
  }
}


import { Request, Response, NextFunction } from "express";
import { ok } from "../../lib/response.js";
import * as categoryService from "./category.service.js";

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.listCategories();
    ok(res, categories);
  } catch (err) {
    next(err);
  }
}

export async function getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.getCategoryBySlug(req.params.slug as string);
    ok(res, category);
  } catch (err) {
    next(err);
  }
}

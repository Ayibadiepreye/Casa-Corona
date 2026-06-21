
import { Router } from "express";
import * as categoryController from "./category.controller";

const router = Router();

router.get("/", categoryController.listCategories);
router.get("/slug/:slug", categoryController.getCategoryBySlug);
router.get("/:slug", categoryController.getCategoryBySlug);

export default router;

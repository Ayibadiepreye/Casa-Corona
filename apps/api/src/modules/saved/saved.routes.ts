import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import * as savedController from "./saved.controller.js";

const router = Router();

router.get("/saved", requireAuth, savedController.getMySaved);

export default router;
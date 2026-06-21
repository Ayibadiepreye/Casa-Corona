import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import * as savedController from "./saved.controller";

const router = Router();

router.get("/saved", requireAuth, savedController.getMySaved);

export default router;
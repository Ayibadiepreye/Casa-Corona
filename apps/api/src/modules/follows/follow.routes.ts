import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import * as followController from "./follow.controller.js";

const router = Router();

router.get("/follows", requireAuth, followController.getMyFollows);

export default router;
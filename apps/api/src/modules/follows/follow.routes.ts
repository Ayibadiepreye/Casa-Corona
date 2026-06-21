import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import * as followController from "./follow.controller";

const router = Router();

router.get("/follows", requireAuth, followController.getMyFollows);

export default router;
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middlewares/requireAuth.js";
import * as recommendationService from "./recommendation.service.js";
import { ok } from "../../lib/response.js";

export async function getForYou(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const vendors = await recommendationService.getForYou(req.user.userId);
    ok(res, vendors);
  } catch (e) {
    next(e);
  }
}

export async function getSimilar(req: Request, res: Response, next: NextFunction) {
  try {
    const vendors = await recommendationService.getSimilar(req.params.vendorId as string);
    ok(res, vendors);
  } catch (e) {
    next(e);
  }
}

export async function getTrendingNearYou(req: Request, res: Response, next: NextFunction) {
  try {
    const vendors = await recommendationService.getTrendingNearYou();
    ok(res, vendors);
  } catch (e) {
    next(e);
  }
}
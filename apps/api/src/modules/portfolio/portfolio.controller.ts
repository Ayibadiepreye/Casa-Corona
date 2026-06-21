
import { Request, Response, NextFunction } from "express";
import { ok, created } from "../../lib/response";
import { AuthRequest } from "../../middlewares/requireAuth";
import * as portfolioService from "./portfolio.service";
import { createPortfolioSchema, updatePortfolioSchema } from "./portfolio.schema";

export async function addPortfolioShot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    if (!req.file) throw new Error("No file uploaded");
    const data = createPortfolioSchema.parse(req.body);
    const shot = await portfolioService.addPortfolioShot(
      req.user.userId,
      req.params.vendorId as string,
      req.file,
      data
    );
    created(res, shot);
  } catch (err) {
    next(err);
  }
}

export async function updatePortfolioShot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = updatePortfolioSchema.parse(req.body);
    const shot = await portfolioService.updatePortfolioShot(
      req.user.userId,
      req.params.id as string,
      data
    );
    ok(res, shot);
  } catch (err) {
    next(err);
  }
}

export async function deletePortfolioShot(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    await portfolioService.deletePortfolioShot(req.user.userId, req.params.id as string);
    ok(res, { success: true });
  } catch (err) {
    next(err);
  }
}

export async function getPortfolioShotById(req: Request, res: Response, next: NextFunction) {
  try {
    const shot = await portfolioService.getPortfolioShotById(req.params.id as string);
    ok(res, shot);
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middlewares/requireAuth.js";
import * as savedService from "./saved.service.js";
import { ok } from "../../lib/response.js";

export async function getMySaved(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const result = await savedService.getMySaved(req.user.userId);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function saveVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    await savedService.saveVendor(req.user.userId, req.params.vendorId as string);
    ok(res, { success: true });
  } catch (e) {
    next(e);
  }
}

export async function unsaveVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    await savedService.unsaveVendor(req.user.userId, req.params.vendorId as string);
    ok(res, { success: true });
  } catch (e) {
    next(e);
  }
}

export async function isSaved(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const isSaved = await savedService.isSaved(req.user.userId, req.params.vendorId as string);
    ok(res, { isSaved });
  } catch (e) {
    next(e);
  }
}
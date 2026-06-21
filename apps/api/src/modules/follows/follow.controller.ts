import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middlewares/requireAuth";
import * as followService from "./follow.service";
import { ok } from "../../lib/response";

export async function getMyFollows(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const result = await followService.getMyFollows(req.user.userId);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function followVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    await followService.followVendor(req.user.userId, req.params.vendorId as string);
    ok(res, { success: true });
  } catch (e) {
    next(e);
  }
}

export async function unfollowVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    await followService.unfollowVendor(req.user.userId, req.params.vendorId as string);
    ok(res, { success: true });
  } catch (e) {
    next(e);
  }
}

export async function isFollowing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const isFollowing = await followService.isFollowing(req.user.userId, req.params.vendorId as string);
    ok(res, { isFollowing });
  } catch (e) {
    next(e);
  }
}
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middlewares/requireAuth";
import * as reviewService from "./review.service";
import { ok, created } from "../../lib/response";
import { createReviewSchema, updateReviewSchema, reviewQuerySchema } from "./review.schema";
import { requireRole } from "../../middlewares/requireRole";
import { z } from "zod";

export async function createReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = createReviewSchema.parse(req.body);
    const review = await reviewService.createReview(
      req.user.userId,
      req.params.vendorId as string,
      data
    );
    created(res, review);
  } catch (e) {
    next(e);
  }
}

export async function listVendorReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const query = reviewQuerySchema.parse(req.query);
    const result = await reviewService.listVendorReviews(req.params.vendorId as string, query);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function listMyReviews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const reviews = await reviewService.listMyReviews(req.user.userId);
    ok(res, reviews);
  } catch (e) {
    next(e);
  }
}

export async function updateReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = updateReviewSchema.parse(req.body);
    const review = await reviewService.updateReview(req.user.userId, req.params.id as string, data);
    ok(res, review);
  } catch (e) {
    next(e);
  }
}

export async function deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    await reviewService.deleteReview(req.user.userId, req.params.id as string);
    ok(res, { success: true });
  } catch (e) {
    next(e);
  }
}

export async function replyToReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const { content } = req.body as { content: string };
    const review = await reviewService.replyToReview(
      req.user.userId,
      req.params.id as string,
      content
    );
    ok(res, review);
  } catch (e) {
    next(e);
  }
}

export async function toggleHelpful(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const review = await reviewService.toggleHelpful(req.user.userId, req.params.id as string);
    ok(res, review);
  } catch (e) {
    next(e);
  }
}

export async function reportReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const { reason } = req.body as { reason: string };
    await reviewService.reportReview(req.user.userId, req.params.id as string, reason);
    ok(res, { success: true });
  } catch (e) {
    next(e);
  }
}
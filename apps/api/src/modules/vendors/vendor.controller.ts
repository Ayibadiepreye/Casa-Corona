
import { Request, Response, NextFunction } from "express";
import { ok, created } from "../../lib/response.js";
import { AuthRequest } from "../../middlewares/requireAuth.js";
import * as vendorService from "./vendor.service.js";
import { z } from "zod";
import { createVendorSchema, updateVendorSchema, vendorQuerySchema } from "./vendor.schema.js";

export async function listVendors(req: Request, res: Response, next: NextFunction) {
  try {
    const query = vendorQuerySchema.parse(req.query);
    const result = await vendorService.listVendors(query);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getVendorBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await vendorService.getVendorBySlug(req.params.slug as string);
    ok(res, vendor);
  } catch (err) {
    next(err);
  }
}

export async function getMyVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const vendor = await vendorService.getMyVendor(req.user.userId);
    ok(res, vendor);
  } catch (err) {
    next(err);
  }
}

export async function createVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = createVendorSchema.parse(req.body);
    const vendor = await vendorService.createVendor(req.user.userId, data);
    created(res, vendor);
  } catch (err) {
    next(err);
  }
}

export async function updateVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = updateVendorSchema.parse(req.body);
    const vendor = await vendorService.updateVendor(
      req.user.userId,
      req.params.id as string,
      data
    );
    ok(res, vendor);
  } catch (err) {
    next(err);
  }
}

export async function deleteVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    await vendorService.softDeleteVendor(req.user.userId, req.params.id as string);
    ok(res, { success: true });
  } catch (err) {
    next(err);
  }
}

export async function uploadLogo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    if (!req.file) throw new Error("No file uploaded");
    const result = await vendorService.uploadLogo(
      req.user.userId,
      req.params.id as string,
      req.file
    );
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function uploadCover(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    if (!req.file) throw new Error("No file uploaded");
    const result = await vendorService.uploadCover(
      req.user.userId,
      req.params.id as string,
      req.file
    );
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function trackView(req: Request, res: Response, next: NextFunction) {
  try {
    await vendorService.trackView(req.params.id as string);
    ok(res, { success: true });
  } catch (err) {
    next(err);
  }
}

export async function getViewStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await vendorService.getViewStats(req.params.id as string);
    ok(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function getVendorServices(req: Request, res: Response, next: NextFunction) {
  try {
    const services = await vendorService.getVendorServices(req.params.id as string);
    ok(res, services);
  } catch (err) {
    next(err);
  }
}

export async function getVendorProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const products = await vendorService.getVendorProducts(req.params.id as string);
    ok(res, products);
  } catch (err) {
    next(err);
  }
}

export async function getVendorPortfolio(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const portfolio = await vendorService.getVendorPortfolio(req.params.id as string, { page, limit });
    ok(res, portfolio);
  } catch (err) {
    next(err);
  }
}

export async function getVendorReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sort = req.query.sort as string;
    const reviews = await vendorService.getVendorReviews(req.params.id as string, { page, limit, sort });
    ok(res, reviews);
  } catch (err) {
    next(err);
  }
}

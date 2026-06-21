
import { Request, Response, NextFunction } from "express";
import { ok, created } from "../../lib/response";
import { AuthRequest } from "../../middlewares/requireAuth";
import * as serviceService from "./service.service";
import { createServiceSchema, updateServiceSchema } from "./service.schema";

export async function createService(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = createServiceSchema.parse(req.body);
    const service = await serviceService.createService(
      req.user.userId,
      req.params.vendorId as string,
      data
    );
    created(res, service);
  } catch (err) {
    next(err);
  }
}

export async function updateService(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    const data = updateServiceSchema.parse(req.body);
    const service = await serviceService.updateService(
      req.user.userId,
      req.params.id as string,
      data
    );
    ok(res, service);
  } catch (err) {
    next(err);
  }
}

export async function deleteService(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error("User not found");
    await serviceService.deleteService(req.user.userId, req.params.id as string);
    ok(res, { success: true });
  } catch (err) {
    next(err);
  }
}

export async function getServiceById(req: Request, res: Response, next: NextFunction) {
  try {
    const service = await serviceService.getServiceById(req.params.id as string);
    ok(res, service);
  } catch (err) {
    next(err);
  }
}

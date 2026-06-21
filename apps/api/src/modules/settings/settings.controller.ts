
import { Response, NextFunction } from "express";
import * as settingsService from "./settings.service";
import { AuthRequest } from "../../middlewares/requireAuth";
import { ok } from "../../lib/response";

export const getPublicSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getPublicSettings();
    ok(res, settings);
  } catch (e) {
    next(e);
  }
};

export const getAdminSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getAdminSettings();
    ok(res, settings);
  } catch (e) {
    next(e);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, updates } = req.body;
    const settings = await settingsService.updateSettings(category, updates, req.user!.userId);
    ok(res, settings);
  } catch (e) {
    next(e);
  }
};

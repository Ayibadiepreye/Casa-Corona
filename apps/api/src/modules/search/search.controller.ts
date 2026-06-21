import { Request, Response, NextFunction } from "express";
import * as searchService from "./search.service.js";
import { ok } from "../../lib/response.js";

export async function searchVendors(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await searchService.searchVendors(req.query);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function searchSuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { q } = req.query as { q?: string };
    if (!q) {
      ok(res, []);
      return;
    }
    const suggestions = await searchService.searchSuggestions(q);
    ok(res, suggestions);
  } catch (e) {
    next(e);
  }
}

export async function getTrendingVendors(req: Request, res: Response, next: NextFunction) {
  try {
    const vendors = await searchService.getTrendingVendors();
    ok(res, vendors);
  } catch (e) {
    next(e);
  }
}
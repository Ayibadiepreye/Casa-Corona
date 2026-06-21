import type { Request, Response, NextFunction } from "express";
import { env } from "../lib/env.js";

/**
 * If MAINTENANCE_MODE=true, return 503 for all non-admin routes.
 * Admin routes (requireRole admin) are exempted so admins can use the
 * platform during maintenance.
 */
export function maintenanceGate(req: Request, res: Response, next: NextFunction) {
  if (!env.MAINTENANCE_MODE) return next();

  // Allow admin and super_admin through (their role is set by requireAuth)
  const user = (req as any).user;
  if (user && (user.role === "admin" || user.role === "super_admin" || user.role === "moderator")) {
    return next();
  }

  // Public surface that we still want to answer during maintenance
  if (req.path === "/healthz" || req.path === "/api/healthz") return next();

  return res.status(503).json({
    success: false,
    error: {
      code: "MAINTENANCE",
      message: env.MAINTENANCE_MESSAGE || "Casa Corona is undergoing maintenance. We'll be back soon.",
      contact: env.SUPPORT_EMAIL || "support@casacorona.org",
    },
  });
}
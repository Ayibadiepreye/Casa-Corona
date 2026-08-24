import { Response, NextFunction } from "express";
import { AuthRequest } from "./requireAuth.js";
import { ForbiddenError } from "../lib/errors.js";

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ForbiddenError("Not authenticated");
    }
    const userRole = req.user.role;
    const isSuperAdmin = userRole === "super_admin";
    const hasRole =
      roles.includes(userRole) ||
      (isSuperAdmin && (roles.includes("admin") || roles.includes("moderator")));

    if (!hasRole) {
      throw new ForbiddenError("Insufficient permissions");
    }
    next();
  };
}

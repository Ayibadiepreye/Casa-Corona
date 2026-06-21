import { Response, NextFunction } from "express";
import { AuthRequest } from "./requireAuth";
import { ForbiddenError } from "../lib/errors";

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ForbiddenError("Not authenticated");
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }
    next();
  };
}

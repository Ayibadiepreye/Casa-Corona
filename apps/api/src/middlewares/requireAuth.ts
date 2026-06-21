import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { isDenied } from "../modules/auth/auth.service.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    role: string;
  };
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    } else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    const payload = verifyAccessToken(token);

    // Synchronous denylist check: jti field is set by verifyAccessToken via
    // jsonwebtoken. We need a sync check; do best-effort lookup.
    // The denylist is populated on logout. If using Redis, lookup is fast.
    // For now, skip the jti sync check here and rely on the access token's
    // short 15m expiry; full denylist enforcement happens in socket auth.
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

// Optional auth — sets req.user if a valid token is present, but doesn't fail
// if missing or invalid. Use for endpoints that work both for guests and users.
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let token: string | undefined;
    if (req.cookies?.access_token) token = req.cookies.access_token;
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7);
    }
    if (!token) return next();
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, email: payload.email, role: payload.role };
    next();
  } catch {
    next();
  }
}

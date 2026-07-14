import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "./env.js";
import type { Response } from "express";

export interface JwtPayload {
  userId: string;
  role: string;
  email?: string;
  jti?: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });
}

export function signRefreshToken(payload: JwtPayload): string {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}

export function signImpersonationToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload, impersonation: true }, env.JWT_SECRET, { expiresIn: "30m" });
}

/**
 * Secure cookie configuration for production
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: Only sent over HTTPS in production
 * - sameSite: CSRF protection ('strict' for production, 'none' for cross-origin dev)
 */
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProduction = env.NODE_ENV === "production";
  
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "none",
    maxAge: 60 * 60 * 1000, // 1 hour
    path: "/",
  });
  
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "none",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/api/v1/auth", // Restrict refresh token to auth endpoints only
  });
}

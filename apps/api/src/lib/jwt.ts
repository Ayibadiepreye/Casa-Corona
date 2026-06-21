import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "./env.js";

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

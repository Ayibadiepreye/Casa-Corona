import rateLimit from "express-rate-limit";

/**
 * General IP-based rate limiter for any sensitive endpoint.
 * Default: 30 requests / 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." } },
});

/**
 * Tighter limiter for authentication endpoints — 10 attempts / 15 min.
 * Returns a 429 once exceeded.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed logins toward the limit
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many login attempts. Please try again later." } },
});

/**
 * Per-account lockout. After 5 consecutive failed logins for the SAME email
 * within 15 minutes, that email is locked out for 30 minutes regardless of IP.
 * Stored in Redis (or in-memory fallback) so it survives across instances.
 */
const FAILED_ATTEMPT_LIMIT = 5;
const FAILED_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 min
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 min

import { get, setEx, del } from "../lib/redis.js";

interface FailedRecord {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

export async function getFailedLoginRecord(email: string): Promise<FailedRecord | null> {
  const key = `failed_login:${email.toLowerCase()}`;
  return (await get(key)) as FailedRecord | null;
}

export async function recordFailedLogin(email: string): Promise<{ locked: boolean; until?: Date }> {
  const key = `failed_login:${email.toLowerCase()}`;
  const now = Date.now();
  const existing = (await get(key)) as FailedRecord | null;
  let next: FailedRecord;
  if (!existing || now - existing.firstAttempt > FAILED_ATTEMPT_WINDOW_MS) {
    next = { count: 1, firstAttempt: now };
  } else {
    next = { ...existing, count: existing.count + 1 };
  }
  if (next.count >= FAILED_ATTEMPT_LIMIT) {
    next.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  // Store with TTL slightly longer than window so it auto-expires
  await setEx(key, next, Math.ceil((FAILED_ATTEMPT_WINDOW_MS + LOCKOUT_DURATION_MS) / 1000));
  if (next.lockedUntil && next.lockedUntil > now) {
    return { locked: true, until: new Date(next.lockedUntil) };
  }
  return { locked: false };
}

export async function clearFailedLogins(email: string): Promise<void> {
  await del(`failed_login:${email.toLowerCase()}`);
}

export async function isAccountLocked(email: string): Promise<{ locked: boolean; until?: Date }> {
  const rec = await getFailedLoginRecord(email);
  if (!rec || !rec.lockedUntil) return { locked: false };
  if (rec.lockedUntil <= Date.now()) {
    // Expired; clear
    await clearFailedLogins(email);
    return { locked: false };
  }
  return { locked: true, until: new Date(rec.lockedUntil) };
}
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
 * Login limiter — 10 attempts / 15 min.
 * Prevents brute force password attacks.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many login attempts. Please try again later." } },
});

/**
 * Register limiter — 3 accounts / hour per IP.
 * Prevents spam account creation and automated registration abuse.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many signup attempts. Please try again in an hour." } },
});

/**
 * Payment limiter — 10 attempts / 15 min.
 * Prevents payment abuse, card testing, and transaction spam.
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many payment attempts. Please wait before trying again." } },
});

/**
 * Forgot password limiter — 3 requests / hour per IP.
 * Prevents email bombing and password reset abuse.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many password reset requests. Please check your email or try again later." } },
});

/**
 * OTP send limiter — 3 sends / 15 min per IP.
 * Protects email quota and prevents OTP spam.
 */
export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many OTP requests. Please wait before requesting another code." } },
});

/**
 * OTP verify limiter — 5 verification attempts / 15 min.
 * Prevents OTP brute force guessing.
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many verification attempts. Please request a new code." } },
});

/**
 * Content creation limiter — 10 submissions / hour.
 * Prevents spam reviews, contact forms, and content abuse.
 */
export const contentCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many submissions. Please wait before submitting again." } },
});

// Legacy aliases for backward compatibility
export const authLimiter = loginLimiter;

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
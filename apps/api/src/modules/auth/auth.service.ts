import { db, usersTable, loginHistoryTable } from '@casa-corona/db';
import { logger } from "../../lib/logger.js";
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword, comparePasswords } from '../../lib/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../../lib/errors.js';
import * as emailService from '../../lib/email.js';
import * as redisService from '../../lib/redis.js';
import { env } from '../../lib/env.js';
import crypto from 'crypto';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function signup({ email, password, name, role, phone }: any) {
  const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existingUser.length > 0) throw new ConflictError('Email already in use');

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    email, passwordHash, name, role, phone, emailVerified: false
  }).returning();

  const otp = generateOtp();
  await redisService.setEx('otp:' + email, otp, 600);
  await redisService.setEx('otp_meta:' + email, JSON.stringify({ userId: user.id, attempts: 0 }), 600);
  const emailResult = await emailService.sendOtp(email, { otp, name });

  // In dev mode without RESEND_API_KEY the OTP is logged to console AND
  // returned in the response for convenience. In prod with Resend configured
  // the user receives it via email only.
  const devOtpEcho = env.NODE_ENV === 'development' && !env.RESEND_API_KEY ? otp : undefined;

  if (devOtpEcho) {
    logger.info(`\n[DEV OTP] ${email} → ${otp}\n`);
  }

  return {
    userId: user.id,
    requiresVerification: true,
    ...(devOtpEcho ? { devOtp: devOtpEcho } : {}),
    emailSent: emailResult.success,
  };
}

export async function verifyOtp({ email, otp }: any) {
  // Always verify the real OTP. In development, the OTP is logged to the
  // server console AND returned in the response for convenience — but never
  // accepted as the value `000000` automatically. Real email sends happen via
  // Resend when RESEND_API_KEY is configured.

  const storedOtp = await redisService.get('otp:' + email);
  const otpMetaRaw = await redisService.get('otp_meta:' + email);
  if (!storedOtp || !otpMetaRaw) throw new BadRequestError('OTP expired or invalid — please request a new one');

  const otpMeta = JSON.parse(otpMetaRaw);
  otpMeta.attempts = (otpMeta.attempts || 0) + 1;
  if (otpMeta.attempts > 5) {
    await redisService.del('otp:' + email);
    await redisService.del('otp_meta:' + email);
    throw new BadRequestError('Too many attempts — please request a new code');
  }

  const isValidOtp = String(storedOtp) === String(otp);
  if (!isValidOtp) {
    await redisService.setEx('otp_meta:' + email, JSON.stringify(otpMeta), 600);
    throw new BadRequestError('Invalid OTP — please check your email and try again');
  }

  const [user] = await db.update(usersTable)
    .set({ emailVerified: true, emailVerifiedAt: new Date() })
    .where(eq(usersTable.id, otpMeta.userId)).returning();

  // Create vendor profile if user is vendor
  if (user.role === 'vendor') {
    const { vendorsTable } = await import('@casa-corona/db');
    const existingVendor = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, user.id)).limit(1);
    if (existingVendor.length === 0) {
      await db.insert(vendorsTable).values({
        userId: user.id,
        businessName: user.name + "'s Business",
        slug: user.email.split('@')[0] + '-' + Math.random().toString(36).substring(2, 8),
        city: user.city || '',
        state: user.state || '',
        verified: false,
        subscriptionStatus: 'inactive',
      });
      logger.info(`[auth] Created vendor profile for user ${user.id}`);
    }
  }

  await redisService.del('otp:' + email);
  await redisService.del('otp_meta:' + email);

  const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
  const newRefreshToken = signRefreshToken({ userId: user.id, role: user.role, email: user.email });

  await db.update(usersTable).set({ refreshToken: newRefreshToken }).where(eq(usersTable.id, user.id));
  await emailService.sendWelcome(user.email, { name: user.name });

  const { passwordHash, refreshToken, resetToken, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken: newRefreshToken };
}

export async function resendOtp({ email }: any) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) throw new NotFoundError('User not found');

  const rateLimitKey = 'resend:' + email;
  const isRateLimited = await redisService.get(rateLimitKey);
  if (isRateLimited) throw new BadRequestError('Please wait 60 seconds before resending');

  const otp = generateOtp();
  await redisService.setEx('otp:' + email, otp, 600);
  await redisService.setEx('otp_meta:' + email, JSON.stringify({ userId: user.id, attempts: 0 }), 600);
  await redisService.setEx(rateLimitKey, '1', 60);
  await emailService.sendOtp(email, { otp, name: user.name });

  return { success: true };
}

export async function login({ email, password }: any) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !user.passwordHash) throw new UnauthorizedError('Invalid credentials');

  const validPassword = await comparePasswords(password, user.passwordHash);
  if (!validPassword) throw new UnauthorizedError('Invalid credentials');
  if (user.suspended) throw new UnauthorizedError('Account suspended');
  if (!user.emailVerified) return { requiresVerification: true, userId: user.id };

  await db.insert(loginHistoryTable).values({ userId: user.id, success: true });
  await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));

  const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
  const newRefreshToken = signRefreshToken({ userId: user.id, role: user.role, email: user.email });
  await db.update(usersTable).set({ refreshToken: newRefreshToken }).where(eq(usersTable.id, user.id));

  const { passwordHash, refreshToken, resetToken, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken: newRefreshToken };
}

export async function refresh({ refreshToken }: any) {
  const payload = verifyRefreshToken(refreshToken);
  const [user] = await db.select().from(usersTable)
    .where(and(eq(usersTable.id, payload.userId), eq(usersTable.refreshToken, refreshToken))).limit(1);
  if (!user) throw new UnauthorizedError('Invalid refresh token');

  const newAccessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
  const newRefreshToken = signRefreshToken({ userId: user.id, role: user.role, email: user.email });
  await db.update(usersTable).set({ refreshToken: newRefreshToken }).where(eq(usersTable.id, user.id));
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string, jti?: string) {
  await db.update(usersTable).set({ refreshToken: null }).where(eq(usersTable.id, userId));
  if (jti) {
    // Add this token's jti to denylist with same TTL as access token (15m)
    await redisService.setEx(`denylist:${jti}`, "1", 15 * 60);
  }
}

export async function isDenied(jti: string): Promise<boolean> {
  return redisService.exists(`denylist:${jti}`);
}

export async function forgotPassword({ email }: any) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) return { success: true };

  const token = crypto.randomBytes(16).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 3600000);

  await db.update(usersTable).set({ resetToken: tokenHash, resetTokenExpiresAt: expiresAt }).where(eq(usersTable.id, user.id));
  const resetLink = env.FRONTEND_URL + '/reset-password?token=' + token;
  await emailService.sendPasswordReset(email, { link: resetLink, name: user.name });

  return { success: true };
}

export async function resetPassword({ token, newPassword }: any) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const [user] = await db.select().from(usersTable)
    .where(and(eq(usersTable.resetToken, tokenHash), gt(usersTable.resetTokenExpiresAt, new Date()))).limit(1);
  if (!user) throw new BadRequestError('Invalid or expired reset token');

  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({
    passwordHash, resetToken: null, resetTokenExpiresAt: null, refreshToken: null
  }).where(eq(usersTable.id, user.id));

  return { success: true };
}

export async function setPassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, userId));
  return { success: true };
}

export async function logoutAll(userId: string) {
  await db.update(usersTable).set({ refreshToken: null }).where(eq(usersTable.id, userId));
}

export async function me(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) throw new NotFoundError('User not found');
  const { passwordHash, refreshToken, resetToken, ...safeUser } = user;
  return safeUser;
}

export async function googleLogin(profile: { email: string; name: string; avatarUrl?: string; googleId?: string }) {
  // Find existing user by email
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, profile.email)).limit(1);

  if (!user) {
    // Create a new account — but mark email as UNVERIFIED so the user is
    // prompted to verify via OTP in their dashboard (per project requirement:
    // OAuth users should still go through OTP verification).
    [user] = await db.insert(usersTable).values({
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl || null,
      role: 'customer',
      emailVerified: false,
    }).returning();
  }
  
  // Create vendor profile if user is vendor and doesn't have one
  if (user.role === 'vendor') {
    const { vendorsTable } = await import('@casa-corona/db');
    const existingVendor = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, user.id)).limit(1);
    if (existingVendor.length === 0) {
      await db.insert(vendorsTable).values({
        userId: user.id,
        businessName: user.name + "'s Business",
        slug: user.email.split('@')[0] + '-' + Math.random().toString(36).substring(2, 8),
        city: user.city || '',
        state: user.state || '',
        verified: false,
        subscriptionStatus: 'inactive',
      });
      logger.info(`[auth] Created vendor profile for OAuth user ${user.id}`);
    }
  }
  
  // Note: we do NOT auto-verify on Google login. User is prompted to verify
  // via OTP in their dashboard.

  await db.insert(loginHistoryTable).values({ userId: user.id, success: true });
  await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));

  const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
  const newRefreshToken = signRefreshToken({ userId: user.id, role: user.role, email: user.email });
  await db.update(usersTable).set({ refreshToken: newRefreshToken }).where(eq(usersTable.id, user.id));

  const { passwordHash, refreshToken, resetToken, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken: newRefreshToken };
}

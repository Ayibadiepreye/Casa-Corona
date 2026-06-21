import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { ok, created, badRequest } from '../../lib/response';
import { env } from '../../lib/env';
import { AuthRequest } from '../../middlewares/requireAuth';
import { isAccountLocked, recordFailedLogin, clearFailedLogins } from '../../middlewares/rateLimit';

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signup(req.body);
    created(res, result);
  } catch (e) {
    next(e);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.verifyOtp(req.body);
    if ('accessToken' in result && 'refreshToken' in result) {
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000, // 1h — access token
      });
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }

    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function resendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resendOtp(req.body);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const email = (req.body?.email || "").toString().toLowerCase().trim();

    // Per-account lockout check
    const lock = await isAccountLocked(email);
    if (lock.locked) {
      return res.status(423).json({
        success: false,
        error: {
          code: "ACCOUNT_LOCKED",
          message: `Too many failed login attempts. Account is locked until ${lock.until?.toISOString()}.`,
          retryAfter: lock.until,
        },
      });
    }

    let result: any;
    try {
      result = await authService.login(req.body);
    } catch (loginErr: any) {
      // Login failed — record attempt and possibly lock the account
      const record = await recordFailedLogin(email);
      if (record.locked) {
        return res.status(423).json({
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: `Too many failed login attempts. Account is locked until ${record.until?.toISOString()}.`,
            retryAfter: record.until,
          },
        });
      }
      throw loginErr; // bubble to global error handler for 401
    }
    if ('accessToken' in result && 'refreshToken' in result) {
      // Successful login — clear the failure counter
      await clearFailedLogins(email);
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000, // 1h — access token
      });
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    } else {
      // Soft failure (e.g. requiresVerification) — also count toward the lockout
      const record = await recordFailedLogin(email);
      if (record.locked) {
        return res.status(423).json({
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: `Too many failed login attempts. Account is locked until ${record.until?.toISOString()}.`,
            retryAfter: record.until,
          },
        });
      }
    }

    return ok(res, result);
  } catch (e) {
    return next(e);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    // Accept refreshToken from body OR from cookie. The frontend's api-client
    // sends an empty body, so we must also check cookies to avoid 400s.
    const refreshToken = req.body?.refreshToken || req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new Error("No refresh token provided");
    }
    const result = await authService.refresh({ refreshToken });
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1h — access token
    });
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      await authService.logout(req.user.userId);
    }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    ok(res, { success: true });
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.forgotPassword(req.body);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resetPassword(req.body);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function setPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 8) {
      return badRequest(res, "Password must be at least 8 characters");
    }
    const userId = req.user?.userId;
    if (!userId) return badRequest(res, "User not authenticated");
    
    await authService.setPassword(userId, newPassword);
    return ok(res, { set: true });
  } catch (e) {
    return next(e);
  }
}

export async function logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      await authService.logoutAll(req.user.userId);
    }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    ok(res, { success: true });
  } catch (e) {
    next(e);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    const user = await authService.me(req.user.userId);
    ok(res, user);
  } catch (e) {
    next(e);
  }
}

export async function googleLogin(profile: { email: string; name: string; avatarUrl?: string; googleId?: string }) {
  // Find or create user, then issue tokens like login()
  return authService.googleLogin(profile);
}

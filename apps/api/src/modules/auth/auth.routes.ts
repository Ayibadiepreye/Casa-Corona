import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/requireAuth';
import { authLimiter, generalLimiter } from '../../middlewares/rateLimit';
import { env } from '../../lib/env';
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
} from './auth.schema';

const router = Router();

router.post('/signup', validate({ body: signupSchema }), authController.signup);
router.post('/verify-otp', validate({ body: verifyOtpSchema }), authController.verifyOtp);
router.post('/resend-otp', validate({ body: resendOtpSchema }), authController.resendOtp);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
// No schema validation — the controller reads from body OR cookie
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), authController.resetPassword);
router.post('/set-password', requireAuth, authController.setPassword);
router.post('/logout', requireAuth, authController.logout);
router.post('/logout-all', requireAuth, authController.logoutAll);
router.get('/me', requireAuth, authController.me);

// Google OAuth — only registered if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
// are present in env. Redirects browser to Google's consent screen.
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', (req, res) => {
    const redirectUri = env.GOOGLE_CALLBACK_URL || `http://localhost:${env.PORT}/api/v1/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  router.get('/google/callback', async (req, res) => {
    const code = req.query.code as string | undefined;
    if (!code) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No code' } });

    try {
      const redirectUri = env.GOOGLE_CALLBACK_URL || `http://localhost:${env.PORT}/api/v1/auth/google/callback`;

      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID!,
          client_secret: env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokenData: any = await tokenRes.json();
      if (!tokenData.access_token) {
        return res.status(401).json({ success: false, error: { code: 'OAUTH_FAILED', message: 'No access_token from Google' } });
      }

      // Fetch user profile
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile: any = await profileRes.json();
      if (!profile.email) {
        return res.status(401).json({ success: false, error: { code: 'OAUTH_FAILED', message: 'No email from Google' } });
      }

      const result = await authController.googleLogin({
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        avatarUrl: profile.picture,
        googleId: profile.id,
      });

      // Set cookies + redirect to frontend
      if ('accessToken' in result && result.accessToken) {
        res.cookie('access_token', result.accessToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000,
        });
      }
      if ('refreshToken' in result && result.refreshToken) {
        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
      const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/account?oauth=google`);
    } catch (e: any) {
      return res.status(500).json({ success: false, error: { code: 'OAUTH_ERROR', message: e?.message || 'OAuth failed' } });
    }
  });
} else {
  // Placeholder so the route isn't 404 if user clicks the button before OAuth is configured
  router.get('/google', (_req, res) => {
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
      },
    });
  });
}

export default router;

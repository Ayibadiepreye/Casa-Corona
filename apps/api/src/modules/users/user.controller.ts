import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import { env } from "../../lib/env";
import { ok, created } from "../../lib/response";
import { AuthRequest } from '../../middlewares/requireAuth';

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const user = await userService.getMe(req.user.userId);
    ok(res, user);
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const user = await userService.updateProfile(req.user.userId, req.body);
    ok(res, user);
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const result = await userService.changePassword(req.user.userId, req.body);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const result = await userService.deleteAccount(req.user.userId);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function exportData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const data = await userService.exportData(req.user.userId);
    ok(res, data);
  } catch (e) {
    next(e);
  }
}

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const { page, limit, unreadOnly } = req.query;
    const result = await userService.getNotifications(req.user.userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      unreadOnly: unreadOnly === 'true',
    });
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const result = await userService.markNotificationRead(req.user.userId, req.params.id as string);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const result = await userService.markAllNotificationsRead(req.user.userId);
    ok(res, result);
  } catch (e) {
    next(e);
  }
}

export async function updateNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const user = await userService.updateNotificationPreferences(req.user.userId, req.body);
    ok(res, user);
  } catch (e) {
    next(e);
  }
}

export async function subscribePush(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'endpoint and keys.p256dh, keys.auth required' } });
    }
    const sub = await userService.subscribePush(req.user.userId, { endpoint, keys });
    return ok(res, sub);
  } catch (e) {
    return next(e);
  }
}

export async function unsubscribePush(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('User not found');
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'endpoint required' } });
    await userService.unsubscribePush(req.user.userId, endpoint);
    return ok(res, { success: true });
  } catch (e) {
    return next(e);
  }
}

export async function getVapidPublicKey(_req: Request, res: Response) {
  if (!env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ success: false, error: { code: 'PUSH_DISABLED', message: 'Push notifications are not configured on this server.' } });
  }
  return res.json({ success: true, data: { publicKey: env.VAPID_PUBLIC_KEY } });
}

import { Router } from 'express';
import * as userController from './user.controller.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { updateProfileSchema, changePasswordSchema, updateNotificationPrefsSchema } from './user.schema.js';

const router = Router();

router.get('/me', requireAuth, userController.getMe);
router.patch('/me', requireAuth, validate({ body: updateProfileSchema }), userController.updateProfile);
router.post('/me/change-password', requireAuth, validate({ body: changePasswordSchema }), userController.changePassword);
router.delete('/me', requireAuth, userController.deleteAccount);
router.get('/me/export', requireAuth, userController.exportData);
router.get('/me/notifications', requireAuth, userController.getNotifications);
router.patch('/me/notifications/:id/read', requireAuth, userController.markNotificationRead);
router.post('/me/notifications/read-all', requireAuth, userController.markAllNotificationsRead);
router.patch('/me/notification-preferences', requireAuth, validate({ body: updateNotificationPrefsSchema }), userController.updateNotificationPreferences);

// Push notification subscription management
router.post('/me/push-subscribe', requireAuth, userController.subscribePush);
router.delete('/me/push-subscribe', requireAuth, userController.unsubscribePush);
// Public — returns the VAPID public key so the browser can subscribe
router.get('/me/push-subscribe/vapid-public-key', userController.getVapidPublicKey);

export default router;

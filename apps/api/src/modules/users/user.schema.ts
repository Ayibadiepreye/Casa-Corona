import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  notificationPreferences: z.record(z.boolean()).optional(),
  privacySettings: z.record(z.boolean()).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const updateNotificationPrefsSchema = z.record(z.boolean());

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateNotificationPrefsInput = z.infer<typeof updateNotificationPrefsSchema>;

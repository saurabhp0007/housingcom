import { z } from 'zod';
import { Platform } from '../enums/ota.enums.js';

export const firebaseLoginSchema = z.object({
  idToken: z.string().min(1),
  device: z
    .object({
      id: z.string().min(1).max(128),
      platform: z.enum([Platform.Ios, Platform.Android]),
      pushToken: z.string().max(512).optional(),
    })
    .optional(),
});
export type FirebaseLoginInput = z.infer<typeof firebaseLoginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

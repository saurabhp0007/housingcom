import { z } from 'zod';
import { Platform } from '../enums/ota.enums.js';
import { phoneSchema } from './common.schema.js';

export const OTP_LENGTH = 6;

const deviceSchema = z.object({
  id: z.string().min(1).max(128),
  platform: z.enum([Platform.Ios, Platform.Android]),
  pushToken: z.string().max(512).optional(),
});

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});
export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`)),
  device: deviceSchema.optional(),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

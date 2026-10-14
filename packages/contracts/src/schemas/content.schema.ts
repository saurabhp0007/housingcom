import { z } from 'zod';

export const faqSchema = z.object({
  question: z.string().trim().min(5).max(200),
  answer: z.string().trim().min(2).max(2000),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isPublished: z.boolean(),
});
export type FaqInput = z.infer<typeof faqSchema>;

export const contentPageSchema = z.object({
  title: z.string().trim().min(2).max(100),
  /** Plain text; blank lines separate paragraphs. */
  body: z.string().trim().min(1).max(50_000),
});
export type ContentPageInput = z.infer<typeof contentPageSchema>;

/** Home-screen banner. `linkUrl` is an in-app route (e.g. /search) or an https URL. */
export const bannerSchema = z.object({
  title: z.string().trim().min(2).max(80),
  subtitle: z.string().trim().max(160).nullable().optional(),
  linkUrl: z
    .string()
    .trim()
    .max(255)
    .regex(/^(\/|https:\/\/)/, 'Use an app route like /search or an https:// link')
    .nullable()
    .optional(),
  cityId: z.uuid().nullable().optional(),
  startsAt: z.iso.datetime().nullable().optional(),
  endsAt: z.iso.datetime().nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});
export type BannerInput = z.infer<typeof bannerSchema>;

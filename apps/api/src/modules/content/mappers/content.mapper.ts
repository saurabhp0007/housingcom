import type { BannerResponse, FaqResponse } from '@housingcom/contracts';
import type { Banner } from '../entities/banner.entity.js';
import type { Faq } from '../entities/faq.entity.js';

export const toFaqResponse = (f: Faq): FaqResponse => ({
  id: f.id,
  question: f.question,
  answer: f.answer,
  sortOrder: f.sortOrder,
  isPublished: f.isPublished,
});

export const toBannerResponse = (b: Banner, imageUrl: string | null): BannerResponse => ({
  id: b.id,
  title: b.title,
  subtitle: b.subtitle,
  imageUrl,
  linkUrl: b.linkUrl,
  cityId: b.cityId,
  startsAt: b.startsAt?.toISOString() ?? null,
  endsAt: b.endsAt?.toISOString() ?? null,
  isActive: b.isActive,
  sortOrder: b.sortOrder,
});

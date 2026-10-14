import type { ContentPageSlug } from '../enums/content.enums.js';

export interface FaqResponse {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface ContentPageResponse {
  slug: ContentPageSlug;
  title: string;
  body: string;
  updatedAt: string | null;
}

export interface BannerResponse {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  cityId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  sortOrder: number;
}

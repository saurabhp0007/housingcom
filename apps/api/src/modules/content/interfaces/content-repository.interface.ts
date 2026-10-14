import type { ContentPageSlug } from '@housingcom/contracts';
import type { Banner } from '../entities/banner.entity.js';
import type { ContentPage } from '../entities/content-page.entity.js';
import type { Faq } from '../entities/faq.entity.js';

export const CONTENT_REPOSITORY = Symbol('CONTENT_REPOSITORY');

export type FaqData = Pick<Faq, 'question' | 'answer' | 'sortOrder' | 'isPublished'>;
export type BannerData = Pick<
  Banner,
  'title' | 'subtitle' | 'linkUrl' | 'cityId' | 'startsAt' | 'endsAt' | 'isActive' | 'sortOrder'
>;

export interface ContentRepository {
  faqs(publishedOnly: boolean): Promise<Faq[]>;
  findFaq(id: string): Promise<Faq | null>;
  saveFaq(id: string | null, data: Partial<FaqData>): Promise<Faq>;
  deleteFaq(id: string): Promise<void>;

  page(slug: ContentPageSlug): Promise<ContentPage | null>;
  upsertPage(
    slug: ContentPageSlug,
    title: string,
    body: string,
    updatedBy: string,
  ): Promise<ContentPage>;

  banners(): Promise<Banner[]>;
  /** Active, inside their date window, for everyone or this city. */
  liveBanners(cityId: string | null, now: Date): Promise<Banner[]>;
  findBanner(id: string): Promise<Banner | null>;
  saveBanner(
    id: string | null,
    data: Partial<BannerData> & { imageKey?: string | null },
  ): Promise<Banner>;
  deleteBanner(id: string): Promise<void>;
}

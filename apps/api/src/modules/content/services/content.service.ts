import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CONTENT_PAGE_TITLES,
  type BannerInput,
  type BannerResponse,
  type ContentPageInput,
  type ContentPageResponse,
  type ContentPageSlug,
  type FaqInput,
  type FaqResponse,
} from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { ImageProcessingService } from '../../../core/media/image-processing.service.js';
import { PublicUrlService } from '../../../core/media/public-url.service.js';
import { CacheService } from '../../../core/redis/cache.service.js';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../core/storage/object-storage.interface.js';
import type { Banner } from '../entities/banner.entity.js';
import {
  CONTENT_REPOSITORY,
  type BannerData,
  type ContentRepository,
} from '../interfaces/content-repository.interface.js';
import { toBannerResponse, toFaqResponse } from '../mappers/content.mapper.js';

const CACHE_TTL_SECONDS = 300;
const FAQ_KEY = 'content:faqs:v1';
const pageKey = (slug: string) => `content:page:v1:${slug}`;
const BANNERS_PREFIX = 'content:banners:v1:';
const bannersKey = (cityId: string | null) => `${BANNERS_PREFIX}${cityId ?? 'all'}`;

const bannerData = (i: Partial<BannerInput>): Partial<BannerData> => ({
  ...(i.title !== undefined ? { title: i.title } : {}),
  ...(i.subtitle !== undefined ? { subtitle: i.subtitle || null } : {}),
  ...(i.linkUrl !== undefined ? { linkUrl: i.linkUrl || null } : {}),
  ...(i.cityId !== undefined ? { cityId: i.cityId } : {}),
  ...(i.startsAt !== undefined ? { startsAt: i.startsAt ? new Date(i.startsAt) : null } : {}),
  ...(i.endsAt !== undefined ? { endsAt: i.endsAt ? new Date(i.endsAt) : null } : {}),
  ...(i.isActive !== undefined ? { isActive: i.isActive } : {}),
  ...(i.sortOrder !== undefined ? { sortOrder: i.sortOrder } : {}),
});

/**
 * Admin-editable app content (PRD §5 "Basic content"): FAQs, terms, privacy policy, banners.
 * Public reads are cached; every admin write clears the cache, so edits show up within a request.
 */
@Injectable()
export class ContentService {
  constructor(
    @Inject(CONTENT_REPOSITORY) private readonly repo: ContentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly images: ImageProcessingService,
    private readonly urls: PublicUrlService,
    private readonly cache: CacheService,
  ) {}

  // ── Public ────────────────────────────────────────────

  faqs(): Promise<FaqResponse[]> {
    return this.cache.wrap(FAQ_KEY, CACHE_TTL_SECONDS, async () =>
      (await this.repo.faqs(true)).map(toFaqResponse),
    );
  }

  page(slug: ContentPageSlug): Promise<ContentPageResponse> {
    return this.cache.wrap(pageKey(slug), CACHE_TTL_SECONDS, async () => {
      const page = await this.repo.page(slug);
      return {
        slug,
        title: page?.title ?? CONTENT_PAGE_TITLES[slug],
        body: page?.body ?? '',
        updatedAt: page?.updatedAt.toISOString() ?? null,
      };
    });
  }

  banners(cityId: string | null): Promise<BannerResponse[]> {
    // Short TTL: banners have start/end times.
    return this.cache.wrap(bannersKey(cityId), 60, async () =>
      (await this.repo.liveBanners(cityId, new Date())).map((b) => this.banner(b)),
    );
  }

  // ── Admin ─────────────────────────────────────────────

  async allFaqs(): Promise<FaqResponse[]> {
    return (await this.repo.faqs(false)).map(toFaqResponse);
  }

  async saveFaq(id: string | null, input: Partial<FaqInput>): Promise<FaqResponse> {
    if (id && !(await this.repo.findFaq(id))) throw AppException.notFound('FAQ');
    const faq = await this.repo.saveFaq(id, input);
    await this.cache.del(FAQ_KEY);
    return toFaqResponse(faq);
  }

  async deleteFaq(id: string): Promise<void> {
    await this.repo.deleteFaq(id);
    await this.cache.del(FAQ_KEY);
  }

  async savePage(
    slug: ContentPageSlug,
    input: ContentPageInput,
    adminId: string,
  ): Promise<ContentPageResponse> {
    await this.repo.upsertPage(slug, input.title, input.body, adminId);
    await this.cache.del(pageKey(slug));
    return this.page(slug);
  }

  async allBanners(): Promise<BannerResponse[]> {
    return (await this.repo.banners()).map((b) => this.banner(b));
  }

  async saveBanner(id: string | null, input: Partial<BannerInput>): Promise<BannerResponse> {
    if (id && !(await this.repo.findBanner(id))) throw AppException.notFound('Banner');
    const data = bannerData(input);
    if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
      throw AppException.badRequest(ErrorCode.ValidationFailed, 'The end must be after the start');
    }
    const banner = await this.repo.saveBanner(id, data);
    await this.clearBanners();
    return this.banner(banner);
  }

  async setBannerImage(id: string, file: Buffer): Promise<BannerResponse> {
    const banner = await this.repo.findBanner(id);
    if (!banner) throw AppException.notFound('Banner');
    const key = `banners/${randomUUID()}.webp`;
    await this.storage.put(key, await this.images.banner(file), 'image/webp');
    const updated = await this.repo.saveBanner(id, { imageKey: key });
    if (banner.imageKey) await this.storage.delete(banner.imageKey).catch(() => undefined);
    await this.clearBanners();
    return this.banner(updated);
  }

  async deleteBanner(id: string): Promise<void> {
    const banner = await this.repo.findBanner(id);
    if (!banner) return;
    await this.repo.deleteBanner(id);
    if (banner.imageKey) await this.storage.delete(banner.imageKey).catch(() => undefined);
    await this.clearBanners();
  }

  private banner(b: Banner): BannerResponse {
    return toBannerResponse(b, this.urls.url(b.imageKey));
  }

  /** City lists include global banners, so any change clears every city's cached list. */
  private clearBanners(): Promise<void> {
    return this.cache.delPrefix(BANNERS_PREFIX);
  }
}

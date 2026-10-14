import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import type { ContentPageSlug } from '@housingcom/contracts';
import { Banner } from '../entities/banner.entity.js';
import { ContentPage } from '../entities/content-page.entity.js';
import { Faq } from '../entities/faq.entity.js';
import type {
  BannerData,
  ContentRepository,
  FaqData,
} from '../interfaces/content-repository.interface.js';

@Injectable()
export class TypeOrmContentRepository implements ContentRepository {
  constructor(
    @InjectRepository(Faq) private readonly faqsRepo: Repository<Faq>,
    @InjectRepository(ContentPage) private readonly pages: Repository<ContentPage>,
    @InjectRepository(Banner) private readonly bannersRepo: Repository<Banner>,
  ) {}

  faqs(publishedOnly: boolean): Promise<Faq[]> {
    return this.faqsRepo.find({
      where: publishedOnly ? { isPublished: true } : {},
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  findFaq(id: string): Promise<Faq | null> {
    return this.faqsRepo.findOneBy({ id });
  }

  async saveFaq(id: string | null, data: Partial<FaqData>): Promise<Faq> {
    if (id) {
      await this.faqsRepo.update({ id }, data);
      return this.faqsRepo.findOneByOrFail({ id });
    }
    return this.faqsRepo.save(this.faqsRepo.create(data));
  }

  async deleteFaq(id: string): Promise<void> {
    await this.faqsRepo.delete({ id });
  }

  page(slug: ContentPageSlug): Promise<ContentPage | null> {
    return this.pages.findOneBy({ slug });
  }

  async upsertPage(
    slug: ContentPageSlug,
    title: string,
    body: string,
    updatedBy: string,
  ): Promise<ContentPage> {
    await this.pages.upsert({ slug, title, body, updatedBy }, { conflictPaths: ['slug'] });
    return this.pages.findOneByOrFail({ slug });
  }

  banners(): Promise<Banner[]> {
    return this.bannersRepo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  liveBanners(cityId: string | null, now: Date): Promise<Banner[]> {
    const qb = this.bannersRepo
      .createQueryBuilder('b')
      .where('b.is_active = true')
      .andWhere('(b.starts_at IS NULL OR b.starts_at <= :now)', { now })
      .andWhere('(b.ends_at IS NULL OR b.ends_at > :now)', { now })
      .orderBy('b.sort_order', 'ASC')
      .addOrderBy('b.created_at', 'DESC');
    qb.andWhere(
      new Brackets((w) => {
        w.where('b.city_id IS NULL');
        if (cityId) w.orWhere('b.city_id = :cityId', { cityId });
      }),
    );
    return qb.getMany();
  }

  findBanner(id: string): Promise<Banner | null> {
    return this.bannersRepo.findOneBy({ id });
  }

  async saveBanner(
    id: string | null,
    data: Partial<BannerData> & { imageKey?: string | null },
  ): Promise<Banner> {
    if (id) {
      await this.bannersRepo.update({ id }, data);
      return this.bannersRepo.findOneByOrFail({ id });
    }
    return this.bannersRepo.save(this.bannersRepo.create(data));
  }

  async deleteBanner(id: string): Promise<void> {
    await this.bannersRepo.delete({ id });
  }
}

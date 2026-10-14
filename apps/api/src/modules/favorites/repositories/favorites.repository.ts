import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../../../core/utils/pagination.util.js';
import { Favorite } from '../entities/favorite.entity.js';
import type { FavoritesRepository } from '../interfaces/favorites-repository.interface.js';

/** Upper bound for the "ids" endpoint the app uses to paint hearts. */
const MAX_IDS = 1000;

@Injectable()
export class TypeOrmFavoritesRepository implements FavoritesRepository {
  constructor(@InjectRepository(Favorite) private readonly favorites: Repository<Favorite>) {}

  async add(userId: string, listingId: string): Promise<boolean> {
    const result = await this.favorites
      .createQueryBuilder()
      .insert()
      .values({ userId, listingId })
      .orIgnore()
      .execute();
    return (result.raw as unknown[]).length > 0;
  }

  async remove(userId: string, listingId: string): Promise<void> {
    await this.favorites.delete({ userId, listingId });
  }

  async pageListingIds(userId: string, page: number, limit: number): Promise<Paginated<string>> {
    const [rows, total] = await this.favorites.findAndCount({
      select: { listingId: true },
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: rows.map((r) => r.listingId), meta: buildPaginationMeta(page, limit, total) };
  }

  async allListingIds(userId: string): Promise<string[]> {
    const rows = await this.favorites.find({
      select: { listingId: true },
      where: { userId },
      order: { createdAt: 'DESC' },
      take: MAX_IDS,
    });
    return rows.map((r) => r.listingId);
  }
}

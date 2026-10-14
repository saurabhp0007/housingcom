import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { MediaKind } from '@housingcom/contracts';
import { ListingMedia } from '../entities/listing-media.entity.js';
import type {
  CreateMediaData,
  ListingMediaRepository,
} from '../interfaces/listing-media-repository.interface.js';

@Injectable()
export class TypeOrmListingMediaRepository implements ListingMediaRepository {
  constructor(@InjectRepository(ListingMedia) private readonly media: Repository<ListingMedia>) {}

  list(listingId: string): Promise<ListingMedia[]> {
    return this.media.find({ where: { listingId }, order: { position: 'ASC', createdAt: 'ASC' } });
  }

  countByKind(listingId: string, kind: MediaKind): Promise<number> {
    return this.media.countBy({ listingId, kind });
  }

  async add(data: CreateMediaData): Promise<ListingMedia> {
    const { max } = (await this.media
      .createQueryBuilder('m')
      .select('COALESCE(MAX(m.position), -1)', 'max')
      .where('m.listing_id = :listingId', { listingId: data.listingId })
      .getRawOne<{ max: number }>()) ?? { max: -1 };
    return this.media.save(this.media.create({ ...data, position: Number(max) + 1 }));
  }

  findOne(listingId: string, mediaId: string): Promise<ListingMedia | null> {
    return this.media.findOneBy({ id: mediaId, listingId });
  }

  async remove(mediaId: string): Promise<void> {
    await this.media.delete({ id: mediaId });
  }

  async reorder(listingId: string, mediaIds: string[]): Promise<void> {
    await this.media.manager.transaction(async (m) => {
      for (const [position, id] of mediaIds.entries()) {
        await m.update(ListingMedia, { id, listingId }, { position });
      }
    });
  }
}

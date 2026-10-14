import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity.js';
import type {
  RatingAggregate,
  ReviewsRepository,
} from '../interfaces/reviews-repository.interface.js';

@Injectable()
export class TypeOrmReviewsRepository implements ReviewsRepository {
  constructor(@InjectRepository(Review) private readonly reviews: Repository<Review>) {}

  async upsert(
    listingId: string,
    authorId: string,
    rating: number,
    comment: string | null,
  ): Promise<Review> {
    await this.reviews.upsert(
      { listingId, authorId, rating, comment },
      {
        conflictPaths: ['listingId', 'authorId'],
      },
    );
    return this.reviews.findOneOrFail({
      where: { listingId, authorId },
      relations: { author: true },
    });
  }

  async delete(listingId: string, authorId: string): Promise<boolean> {
    return ((await this.reviews.delete({ listingId, authorId })).affected ?? 0) > 0;
  }

  findMine(listingId: string, authorId: string): Promise<Review | null> {
    return this.reviews.findOne({ where: { listingId, authorId }, relations: { author: true } });
  }

  latest(listingId: string, limit: number): Promise<Review[]> {
    return this.reviews.find({
      where: { listingId },
      relations: { author: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async aggregate(listingId: string): Promise<RatingAggregate> {
    const row = await this.reviews
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('r.listing_id = :listingId', { listingId })
      .getRawOne<{ average: string | null; count: string }>();
    const count = Number(row?.count ?? 0);
    return {
      average: count > 0 && row?.average ? Math.round(Number(row.average) * 100) / 100 : null,
      count,
    };
  }
}

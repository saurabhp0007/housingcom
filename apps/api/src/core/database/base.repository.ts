import type {
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import type { Paginated } from '@housingcom/contracts';
import { buildPaginationMeta } from '../utils/pagination.util.js';

/**
 * Generic data-access helpers. Module repositories extend this and expose
 * intention-revealing methods; services never touch TypeORM directly.
 */
export abstract class BaseRepository<T extends ObjectLiteral & { id: string }> {
  protected constructor(protected readonly repo: Repository<T>) {}

  findById(id: string): Promise<T | null> {
    return this.repo.findOneBy({ id } as FindOptionsWhere<T>);
  }

  create(data: DeepPartial<T>): Promise<T> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    const entity = await this.findById(id);
    if (!entity) return null;
    return this.repo.save(this.repo.merge(entity, data));
  }

  protected async paginate<R = T>(
    qb: SelectQueryBuilder<T>,
    page: number,
    limit: number,
    map?: (row: T) => R,
  ): Promise<Paginated<R>> {
    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      items: map ? rows.map(map) : (rows as unknown as R[]),
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}

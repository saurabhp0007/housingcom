import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

/** `?page=&limit=` for any paginated list. */
export class PageQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}

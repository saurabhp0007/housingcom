import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, type Observable } from 'rxjs';
import type { ApiResponse, Paginated } from '@housingcom/contracts';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator.js';

const isPaginated = (value: unknown): value is Paginated<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as Paginated<unknown>).items) &&
  typeof (value as Paginated<unknown>).meta === 'object';

/** Wraps every successful response in the shared ApiResponse envelope. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const raw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (raw) return next.handle();

    return next.handle().pipe(
      map((body): ApiResponse<unknown> => {
        if (isPaginated(body)) return { success: true, data: body.items, meta: body.meta };
        return { success: true, data: body ?? null };
      }),
    );
  }
}

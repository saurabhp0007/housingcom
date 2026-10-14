import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import type { ApiError } from '@housingcom/contracts';
import { AppException } from '../../errors/app.exception.js';
import { ErrorCode } from '../../errors/error-codes.js';

const PG_UNIQUE_VIOLATION = '23505';

const statusToCode: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.ValidationFailed,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.Unauthorized,
  [HttpStatus.FORBIDDEN]: ErrorCode.Forbidden,
  [HttpStatus.NOT_FOUND]: ErrorCode.NotFound,
  [HttpStatus.CONFLICT]: ErrorCode.Conflict,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RateLimited,
};

/** Converts every error into the shared ApiError shape. Internals never leak to clients. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const { status, body } = this.toResponse(exception);

    if (status >= 500) {
      this.logger.error({ err: exception, path: req.url }, 'Unhandled error');
    }

    res.status(status).json({ ...body, requestId: req.id } satisfies ApiError);
  }

  private toResponse(exception: unknown): { status: number; body: ApiError } {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        body: {
          success: false,
          error: { code: exception.code, message: exception.message, details: exception.details },
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      // class-validator errors arrive as { message: string[] }.
      const details =
        typeof response === 'object' &&
        response !== null &&
        Array.isArray((response as { message?: unknown }).message)
          ? (response as { message: string[] }).message
          : undefined;
      return {
        status,
        body: {
          success: false,
          error: {
            code: statusToCode[status] ?? ErrorCode.Internal,
            message: details
              ? 'Validation failed'
              : status === HttpStatus.TOO_MANY_REQUESTS
                ? 'Too many requests. Please try again shortly.'
                : exception.message,
            details,
          },
        },
      };
    }

    if (
      exception instanceof QueryFailedError &&
      (exception.driverError as { code?: string })?.code === PG_UNIQUE_VIOLATION
    ) {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          success: false,
          error: { code: ErrorCode.Conflict, message: 'Resource already exists' },
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: { code: ErrorCode.Internal, message: 'Something went wrong' },
      },
    };
  }
}

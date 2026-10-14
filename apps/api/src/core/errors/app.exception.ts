import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.js';

/** Domain error with a stable code. Services throw these; the global filter shapes the response. */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
    readonly details?: unknown,
  ) {
    super(message, status);
  }

  static notFound(entity: string): AppException {
    return new AppException(ErrorCode.NotFound, `${entity} not found`, HttpStatus.NOT_FOUND);
  }

  static unauthorized(
    code: ErrorCode = ErrorCode.Unauthorized,
    message = 'Authentication required',
  ): AppException {
    return new AppException(code, message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(code: ErrorCode = ErrorCode.Forbidden, message = 'Not allowed'): AppException {
    return new AppException(code, message, HttpStatus.FORBIDDEN);
  }

  static conflict(code: ErrorCode, message: string): AppException {
    return new AppException(code, message, HttpStatus.CONFLICT);
  }

  static badRequest(code: ErrorCode, message: string, details?: unknown): AppException {
    return new AppException(code, message, HttpStatus.BAD_REQUEST, details);
  }
}

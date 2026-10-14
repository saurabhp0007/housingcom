import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { ApiError } from '@housingcom/contracts';

export interface AppError {
  status: number | 'NETWORK' | 'UNKNOWN';
  code: string;
  message: string;
}

const FRIENDLY: Record<string, string> = {
  NETWORK: 'You seem to be offline. Check your connection and try again.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
};

/** Normalises RTK Query / API errors into one shape the UI can show directly. */
export function toAppError(error: unknown): AppError {
  const e = error as FetchBaseQueryError | undefined;
  if (!e || typeof e !== 'object' || !('status' in e)) {
    return { status: 'UNKNOWN', code: 'UNKNOWN', message: FRIENDLY.INTERNAL_ERROR! };
  }
  if (e.status === 'FETCH_ERROR' || e.status === 'TIMEOUT_ERROR') {
    return { status: 'NETWORK', code: 'NETWORK', message: FRIENDLY.NETWORK! };
  }
  const body = e.data as ApiError | undefined;
  const code = body?.error?.code ?? 'UNKNOWN';
  return {
    status: typeof e.status === 'number' ? e.status : 'UNKNOWN',
    code,
    message: FRIENDLY[code] ?? body?.error?.message ?? FRIENDLY.INTERNAL_ERROR!,
  };
}

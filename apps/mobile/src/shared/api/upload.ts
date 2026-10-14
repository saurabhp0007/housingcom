import type { ApiError, ApiResponse } from '@housingcom/contracts';
import { env } from '../config/env';
import { store } from '../store/store';
import { refreshAccessToken } from './token-refresh';

export interface UploadFilePart {
  field: string;
  uri: string;
  name: string;
  type: string;
}

export interface UploadTextPart {
  field: string;
  value: string;
}

export type UploadPart = UploadFilePart | UploadTextPart;

export class UploadError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

/**
 * Multipart upload with progress (XHR; fetch has no upload progress in RN).
 * Refreshes an expired access token once, like the RTK Query base query.
 */
export async function uploadMultipart<T>(
  path: string,
  parts: UploadPart[],
  onProgress?: (fraction: number) => void,
): Promise<T> {
  const send = (token: string | null) =>
    new Promise<{ status: number; body: ApiResponse<T> | ApiError | null }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${env.apiUrl}${path}`);
      if (token) xhr.setRequestHeader('authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
      xhr.onerror = () => reject(new UploadError('Upload failed. Check your connection.', 0));
      xhr.onload = () => {
        let body = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          // non-JSON error page
        }
        resolve({ status: xhr.status, body });
      };
      const form = new FormData();
      // React Native's FormData accepts { uri, name, type } file descriptors.
      for (const p of parts) {
        if ('value' in p) form.append(p.field, p.value);
        else form.append(p.field, { uri: p.uri, name: p.name, type: p.type } as unknown as Blob);
      }
      xhr.send(form);
    });

  let res = await send(store.getState().session.accessToken);
  if (res.status === 401) {
    const token = await refreshAccessToken(store.dispatch);
    if (token) res = await send(token);
  }

  if (res.status >= 200 && res.status < 300 && res.body && res.body.success) return res.body.data;
  const error = res.body && !res.body.success ? res.body.error : undefined;
  throw new UploadError(
    error?.message ?? 'Upload failed. Please try again.',
    res.status,
    error?.code,
  );
}

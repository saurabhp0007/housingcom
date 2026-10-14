import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { appConfig } from '../../config/configuration.js';

/** Storage keys that may be served publicly. Everything else (e.g. `private/…`) never is. */
export const PUBLIC_KEY_PREFIXES = ['listings/', 'banners/'] as const;

/** Builds client-facing URLs for stored files, served by the API's /files route. */
@Injectable()
export class PublicUrlService {
  constructor(@Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>) {}

  url(key: string): string;
  url(key: string | null): string | null;
  url(key: string | null): string | null {
    if (!key) return null;
    if (!PUBLIC_KEY_PREFIXES.some((p) => key.startsWith(p)))
      throw new Error(`Key is not public: ${key}`);
    return `${this.app.publicBaseUrl}/${this.app.apiPrefix}/files/${key}`;
  }
}

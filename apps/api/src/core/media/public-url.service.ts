import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { appConfig } from '../../config/configuration.js';
import { OBJECT_STORAGE, type ObjectStorage } from '../storage/object-storage.interface.js';

/** Storage keys that may be served publicly. Everything else (e.g. `private/…`) never is. */
export const PUBLIC_KEY_PREFIXES = ['listings/', 'banners/'] as const;

/** Builds client-facing URLs for stored files: CDN when configured, else the API's /files route. */
@Injectable()
export class PublicUrlService {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  url(key: string): string;
  url(key: string | null): string | null;
  url(key: string | null): string | null {
    if (!key) return null;
    if (!PUBLIC_KEY_PREFIXES.some((p) => key.startsWith(p)))
      throw new Error(`Key is not public: ${key}`);
    return (
      this.storage.publicUrl(key) ?? `${this.app.publicBaseUrl}/${this.app.apiPrefix}/files/${key}`
    );
  }
}

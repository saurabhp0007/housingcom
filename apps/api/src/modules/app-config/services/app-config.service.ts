import { Inject, Injectable } from '@nestjs/common';
import type { AppConfigResponse, Platform } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { CacheService } from '../../../core/redis/cache.service.js';
import {
  APP_CONFIG_REPOSITORY,
  type AppConfigRepository,
} from '../interfaces/app-config-repository.interface.js';

const CACHE_TTL_SECONDS = 60;

@Injectable()
export class AppConfigService {
  constructor(
    @Inject(APP_CONFIG_REPOSITORY) private readonly configs: AppConfigRepository,
    private readonly cache: CacheService,
  ) {}

  getForPlatform(platform: Platform): Promise<AppConfigResponse> {
    return this.cache.wrap(`app-config:${platform}`, CACHE_TTL_SECONDS, async () => {
      const config = await this.configs.findByPlatform(platform);
      if (!config) throw AppException.notFound('App config');
      return {
        platform: config.platform,
        minSupportedVersion: config.minSupportedVersion,
        latestVersion: config.latestVersion,
        storeUrl: config.storeUrl,
        featureFlags: config.featureFlags,
        supportPhone: config.supportPhone,
      };
    });
  }
}

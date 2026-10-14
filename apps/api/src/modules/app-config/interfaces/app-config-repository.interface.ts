import type { Platform } from '@housingcom/contracts';
import type { AppPlatformConfig } from '../entities/app-platform-config.entity.js';

export const APP_CONFIG_REPOSITORY = Symbol('APP_CONFIG_REPOSITORY');

export interface AppConfigRepository {
  findByPlatform(platform: Platform): Promise<AppPlatformConfig | null>;
}

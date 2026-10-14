import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Platform } from '@housingcom/contracts';
import { AppPlatformConfig } from '../entities/app-platform-config.entity.js';
import type { AppConfigRepository } from '../interfaces/app-config-repository.interface.js';

@Injectable()
export class TypeOrmAppConfigRepository implements AppConfigRepository {
  constructor(
    @InjectRepository(AppPlatformConfig) private readonly configs: Repository<AppPlatformConfig>,
  ) {}

  findByPlatform(platform: Platform): Promise<AppPlatformConfig | null> {
    return this.configs.findOneBy({ platform });
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AppConfigResponse } from '@housingcom/contracts';
import { Public } from '../../../core/http/decorators/index.js';
import { AppConfigQueryDto } from '../dto/app-config-query.dto.js';
import { AppConfigService } from '../services/app-config.service.js';

@ApiTags('App config')
@Public()
@Controller('app-config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  /** Fetched on launch: minimum native version, feature flags, support details. */
  @Get()
  get(@Query() query: AppConfigQueryDto): Promise<AppConfigResponse> {
    return this.appConfigService.getForPlatform(query.platform);
  }
}

import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public, RawResponse } from '../../../core/http/decorators/index.js';
import { AssetParamsDto } from '../dto/asset-params.dto.js';
import { HealthReportDto } from '../dto/health-report.dto.js';
import { OtaClientHeadersDto } from '../dto/ota-client-headers.dto.js';
import { OtaAssetsService } from '../services/ota-assets.service.js';
import { OtaHealthService } from '../services/ota-health.service.js';
import { OtaManifestService } from '../services/ota-manifest.service.js';
import { toClientRequest } from '../mappers/ota-client-request.mapper.js';
import { OtaClientHeaders } from './ota-client.decorators.js';

/** Endpoints called by the expo-updates runtime inside the app. */
@ApiTags('OTA (client)')
@Public()
@Controller('ota')
export class OtaClientController {
  constructor(
    private readonly manifests: OtaManifestService,
    private readonly assets: OtaAssetsService,
    private readonly health: OtaHealthService,
  ) {}

  /** Expo Updates protocol v1 manifest endpoint (set as `updates.url` in app config). */
  // Not rate-limited: many devices share one IP behind carrier-grade NAT, and an update
  // check must never fail because a neighbour checked first.
  @Get('manifest')
  @SkipThrottle()
  @RawResponse()
  @ApiExcludeEndpoint()
  async manifest(
    @OtaClientHeaders() headers: OtaClientHeadersDto,
    @Res() res: Response,
  ): Promise<void> {
    const { body, contentType } = await this.manifests.respond(toClientRequest(headers));
    // Written raw: the multipart body and its content-type must reach the client byte-for-byte
    // (framework serialisation would append "; charset=utf-8" to the boundary header).
    res
      .status(200)
      .set({
        'content-type': contentType,
        'expo-protocol-version': '1',
        'expo-sfv-version': '0',
        'cache-control': 'private, max-age=0',
      })
      .end(Buffer.from(body, 'utf8'));
  }

  @Get('assets/:file')
  @SkipThrottle()
  @RawResponse()
  @ApiExcludeEndpoint()
  @Header('cache-control', 'public, max-age=31536000, immutable')
  asset(@Param() params: AssetParamsDto): Promise<StreamableFile> {
    return this.assets.open(params.file);
  }

  /** Launch / crash beacons used for crash-rate based auto-pause. */
  @Post('health')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  reportHealth(@Body() dto: HealthReportDto): Promise<void> {
    return this.health.report(dto);
  }
}

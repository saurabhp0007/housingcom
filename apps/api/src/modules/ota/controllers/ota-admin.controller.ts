import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { OtaPublishResponse, OtaUpdateResponse, Paginated } from '@housingcom/contracts';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';
import { Public } from '../../../core/http/decorators/index.js';
import { ChangeUpdateDto } from '../dto/change-update.dto.js';
import { ListUpdatesQueryDto } from '../dto/list-updates-query.dto.js';
import { PublishUpdateDto } from '../dto/publish-update.dto.js';
import { OtaAdminGuard } from '../guards/ota-admin.guard.js';
import { toOtaUpdateResponse } from '../mappers/ota-update.mapper.js';
import { OtaAdminService } from '../services/ota-admin.service.js';
import { OtaPublishService } from '../services/ota-publish.service.js';

/** Used by the OTA console page and `pnpm ota:publish` (Bearer OTA_ADMIN_TOKEN). */
@ApiTags('OTA (admin)')
@ApiBearerAuth()
@Public()
@UseGuards(OtaAdminGuard)
@Controller('ota/updates')
export class OtaAdminController {
  constructor(
    private readonly publisher: OtaPublishService,
    private readonly admin: OtaAdminService,
  ) {}

  /** Upload a bundle zip (from `pnpm ota:publish`) and publish it to a channel. */
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('bundle'))
  async publish(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PublishUpdateDto,
  ): Promise<OtaPublishResponse> {
    if (!file)
      throw AppException.badRequest(
        ErrorCode.OtaInvalidBundle,
        'Attach the bundle zip as "bundle"',
      );
    const updates = await this.publisher.publish(file.buffer, {
      channel: dto.channel,
      rolloutPercent: dto.rolloutPercent,
      isCritical: dto.isCritical,
      message: dto.message ?? null,
      publishedBy: dto.publishedBy ?? null,
    });
    return { updates: updates.map(toOtaUpdateResponse) };
  }

  @Get()
  async list(@Query() query: ListUpdatesQueryDto): Promise<Paginated<OtaUpdateResponse>> {
    const page = await this.admin.list(query);
    return { items: page.items.map(toOtaUpdateResponse), meta: page.meta };
  }

  /** Change rollout %, pause/resume, or roll back. */
  @Patch(':id')
  async change(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeUpdateDto,
  ): Promise<OtaUpdateResponse> {
    return toOtaUpdateResponse(await this.admin.change(id, dto));
  }
}

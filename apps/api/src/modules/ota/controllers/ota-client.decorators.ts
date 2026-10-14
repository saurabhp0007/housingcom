import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { OtaClientHeadersDto } from '../dto/ota-client-headers.dto.js';

/** Extracts expo-updates protocol headers (query params as fallback for manual testing). */
export const OtaClientHeaders = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Partial<OtaClientHeadersDto> => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = (name: string): string | undefined => {
      const value = req.headers[name];
      return Array.isArray(value) ? value[0] : value;
    };
    const query = (name: string): string | undefined => {
      const value = req.query[name];
      return typeof value === 'string' ? value : undefined;
    };

    const values: Partial<OtaClientHeadersDto> = {
      platform: (header('expo-platform') ?? query('platform')) as OtaClientHeadersDto['platform'],
      runtimeVersion: header('expo-runtime-version') ?? query('runtime-version'),
      channel: (header('expo-channel-name') ?? query('channel')) as OtaClientHeadersDto['channel'],
      clientId: header('eas-client-id'),
      currentUpdateId: header('expo-current-update-id'),
      embeddedUpdateId: header('expo-embedded-update-id'),
      recentFailedUpdateIds: header('expo-recent-failed-update-ids'),
      expectSignature: header('expo-expect-signature'),
    };
    // Drop absent values so DTO defaults (e.g. channel=production) apply.
    return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined));
  },
);

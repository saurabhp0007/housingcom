import { UpdateChannel } from '@housingcom/contracts';
import type { OtaClientRequest } from '../domain/ota.types.js';
import type { OtaClientHeadersDto } from '../dto/ota-client-headers.dto.js';
import { parseStructuredStringList } from '../utils/multipart.util.js';

export const toClientRequest = (h: OtaClientHeadersDto): OtaClientRequest => ({
  platform: h.platform,
  runtimeVersion: h.runtimeVersion,
  channel: h.channel ?? UpdateChannel.Production,
  clientId: h.clientId ?? '',
  currentUpdateId: h.currentUpdateId?.toLowerCase() ?? null,
  embeddedUpdateId: h.embeddedUpdateId?.toLowerCase() ?? null,
  recentFailedUpdateIds: parseStructuredStringList(h.recentFailedUpdateIds).map((id) =>
    id.toLowerCase(),
  ),
  expectSignature: !!h.expectSignature,
});

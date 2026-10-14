import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'http:raw-response';

/** Skip the { success, data } envelope (protocol endpoints like the OTA manifest, file streams). */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);

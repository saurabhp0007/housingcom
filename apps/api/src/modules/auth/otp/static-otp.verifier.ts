import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { authConfig } from '../../../config/configuration.js';
import { safeEqual } from '../../../core/utils/crypto.util.js';
import type { OtpVerifier } from '../interfaces/otp-verifier.interface.js';

/** No SMS is sent: every number signs in with the fixed code from OTP_STATIC_CODE. */
@Injectable()
export class StaticOtpVerifier implements OtpVerifier {
  constructor(@Inject(authConfig.KEY) private readonly config: ConfigType<typeof authConfig>) {}

  async send(_phone: string): Promise<void> {}

  async verify(_phone: string, code: string): Promise<boolean> {
    return safeEqual(code, this.config.staticOtp);
  }
}

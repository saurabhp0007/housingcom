import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { otaConfig } from '../../../config/configuration.js';

/**
 * Code-signs manifest/directive parts (RSA-SHA256), matching expo-updates' code signing.
 * The app embeds the matching certificate, so it refuses any update we didn't sign.
 */
@Injectable()
export class OtaSigningService implements OnModuleInit {
  private readonly logger = new Logger(OtaSigningService.name);
  private privateKey: string | null = null;

  constructor(@Inject(otaConfig.KEY) private readonly config: ConfigType<typeof otaConfig>) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.signingPrivateKeyPath) {
      this.logger.warn('OTA code signing disabled (OTA_SIGNING_PRIVATE_KEY_PATH not set)');
      return;
    }
    this.privateKey = await readFile(this.config.signingPrivateKeyPath, 'utf8');
  }

  get isEnabled(): boolean {
    return this.privateKey !== null;
  }

  /** Value for the part's `expo-signature` header. */
  signatureHeader(body: string): string {
    if (!this.privateKey) throw new Error('OTA signing key not loaded');
    const signature = createSign('RSA-SHA256').update(body, 'utf8').sign(this.privateKey, 'base64');
    return `sig="${signature}", keyid="${this.config.signingKeyId}"`;
  }
}

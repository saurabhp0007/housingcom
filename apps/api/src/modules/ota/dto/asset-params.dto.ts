import { Matches } from 'class-validator';

export class AssetParamsDto {
  /** `<sha256 hex>.<ext>` — content-addressed, so responses are immutable. */
  @Matches(/^[a-f0-9]{64}\.[a-z0-9]{1,8}$/)
  file: string;
}

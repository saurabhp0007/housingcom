import { Injectable } from '@nestjs/common';
import sharp, { type Sharp } from 'sharp';
import { AppException } from '../errors/app.exception.js';
import { ErrorCode } from '../errors/error-codes.js';

export interface ProcessedImage {
  main: Buffer;
  thumbnail: Buffer;
  width: number;
  height: number;
}

const MAX_INPUT_PIXELS = 50_000_000;

/**
 * All uploaded images go through here:
 * - decoded by sharp (anything that is not a real image is rejected, whatever its extension);
 * - auto-rotated from EXIF, then **all metadata stripped** (phone photos carry GPS coordinates);
 * - resized and re-encoded, so a 6 MB camera photo becomes ~250 KB.
 */
@Injectable()
export class ImageProcessingService {
  /** Listing photo: 1600px WebP + 480px thumbnail for cards and map previews. */
  async listingPhoto(input: Buffer): Promise<ProcessedImage> {
    const image = this.open(input);
    const [main, thumbnail] = await asInvalidMedia(Promise.all([
      image.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true }),
      image.clone().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toBuffer(),
    ]));
    return { main: main.data, thumbnail, width: main.info.width, height: main.info.height };
  }

  /** Verification document: readable JPEG, metadata stripped. */
  async document(input: Buffer): Promise<Buffer> {
    return asInvalidMedia(
      this.open(input)
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer(),
    );
  }

  private open(input: Buffer): Sharp {
    try {
      return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' }).rotate();
    } catch {
      throw AppException.badRequest(ErrorCode.InvalidMedia, 'Unsupported image file');
    }
  }
}

/** Wraps sharp failures (corrupt / non-image input) as a 400 instead of a 500. */
export async function asInvalidMedia<T>(work: Promise<T>): Promise<T> {
  try {
    return await work;
  } catch (err) {
    if (err instanceof AppException) throw err;
    throw AppException.badRequest(ErrorCode.InvalidMedia, 'That file could not be read as an image');
  }
}

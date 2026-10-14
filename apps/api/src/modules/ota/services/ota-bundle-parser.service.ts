import { Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';
import { Platform } from '@housingcom/contracts';
import { z } from 'zod';
import { AppException } from '../../../core/errors/app.exception.js';
import { ErrorCode } from '../../../core/errors/error-codes.js';

/** `metadata.json` written by `expo export`. */
const exportMetadataSchema = z.object({
  version: z.literal(0),
  bundler: z.literal('metro'),
  fileMetadata: z.partialRecord(
    z.enum([Platform.Android, Platform.Ios]),
    z.object({
      bundle: z.string().min(1),
      assets: z.array(z.object({ path: z.string().min(1), ext: z.string() })),
    }),
  ),
});

/** `ota.json` written by scripts/ota-publish.mjs. */
const otaMetaSchema = z.object({
  runtimeVersions: z.partialRecord(
    z.enum([Platform.Android, Platform.Ios]),
    z.string().min(1).max(128),
  ),
  gitCommit: z.string().max(64).optional(),
});

export interface ParsedPlatformBundle {
  platform: Platform;
  runtimeVersion: string;
  bundle: Buffer;
  assets: { file: Buffer; ext: string }[];
}

export interface ParsedOtaBundle {
  platforms: ParsedPlatformBundle[];
  expoConfig: Record<string, unknown>;
  gitCommit?: string;
}

/** Hard cap on uncompressed size: protects against zip bombs. */
const MAX_UNCOMPRESSED_BYTES = 512 * 1024 * 1024;

/**
 * Reads the zip produced by `pnpm ota:publish` (an `expo export` dist + ota.json + expoConfig.json).
 * Files are only read into memory; nothing from the archive is written to disk by path.
 */
@Injectable()
export class OtaBundleParserService {
  parse(zipBuffer: Buffer): ParsedOtaBundle {
    const files = this.readZip(zipBuffer);

    const metadata = this.parseJson(files, 'metadata.json', exportMetadataSchema);
    const otaMeta = this.parseJson(files, 'ota.json', otaMetaSchema);
    const expoConfig = this.parseJson(files, 'expoConfig.json', z.record(z.string(), z.unknown()));

    const platforms: ParsedPlatformBundle[] = [];
    for (const platform of [Platform.Android, Platform.Ios]) {
      const meta = metadata.fileMetadata[platform];
      const runtimeVersion = otaMeta.runtimeVersions[platform];
      if (!meta) continue;
      if (!runtimeVersion) throw this.invalid(`ota.json is missing runtimeVersions.${platform}`);

      platforms.push({
        platform,
        runtimeVersion,
        bundle: this.require(files, meta.bundle),
        assets: meta.assets.map((a) => ({ file: this.require(files, a.path), ext: a.ext })),
      });
    }

    if (platforms.length === 0) throw this.invalid('Bundle contains no android or ios export');
    return { platforms, expoConfig, gitCommit: otaMeta.gitCommit };
  }

  private readZip(buffer: Buffer): Map<string, Buffer> {
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      throw this.invalid('Upload is not a valid zip file');
    }

    const entries = zip.getEntries().filter((e) => !e.isDirectory);
    const totalSize = entries.reduce((sum, e) => sum + e.header.size, 0);
    if (totalSize > MAX_UNCOMPRESSED_BYTES) throw this.invalid('Bundle is too large once unzipped');

    // Accept archives zipped with or without a top-level folder (e.g. "dist/metadata.json").
    const metadataEntry = entries.find((e) => e.entryName.endsWith('metadata.json'));
    const prefix = metadataEntry ? metadataEntry.entryName.slice(0, -'metadata.json'.length) : '';

    const files = new Map<string, Buffer>();
    for (const entry of entries) {
      if (!entry.entryName.startsWith(prefix)) continue;
      files.set(entry.entryName.slice(prefix.length).replace(/^\.\//, ''), entry.getData());
    }
    return files;
  }

  private parseJson<T>(files: Map<string, Buffer>, name: string, schema: z.ZodType<T>): T {
    const raw = this.require(files, name);
    let json: unknown;
    try {
      json = JSON.parse(raw.toString('utf8'));
    } catch {
      throw this.invalid(`${name} is not valid JSON`);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) throw this.invalid(`${name} is invalid`, parsed.error.issues);
    return parsed.data;
  }

  private require(files: Map<string, Buffer>, path: string): Buffer {
    const file = files.get(path.replace(/^\.\//, ''));
    if (!file) throw this.invalid(`Missing file in bundle: ${path}`);
    return file;
  }

  private invalid(message: string, details?: unknown): AppException {
    return AppException.badRequest(ErrorCode.OtaInvalidBundle, message, details);
  }
}

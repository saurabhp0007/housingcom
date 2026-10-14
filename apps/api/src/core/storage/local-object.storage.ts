import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { storageConfig } from '../../config/configuration.js';
import type { ObjectStorage, StoredObject } from './object-storage.interface.js';

/** Stores objects as files under STORAGE_LOCAL_DIR (a mounted volume in production). */
@Injectable()
export class LocalObjectStorage implements ObjectStorage {
  private readonly root: string;

  constructor(@Inject(storageConfig.KEY) config: ConfigType<typeof storageConfig>) {
    this.root = resolve(config.localDir);
  }

  async put(key: string, body: Buffer, _contentType: string): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async get(key: string): Promise<StoredObject | null> {
    const path = this.pathFor(key);
    const info = await stat(path).catch(() => null);
    if (!info?.isFile()) return null;
    return { body: createReadStream(path), size: info.size };
  }

  async exists(key: string): Promise<boolean> {
    const info = await stat(this.pathFor(key)).catch(() => null);
    return !!info?.isFile();
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  /** Resolves a key inside the root; rejects anything that would escape it. */
  private pathFor(key: string): string {
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep)) throw new Error(`Invalid storage key: ${key}`);
    return path;
  }
}

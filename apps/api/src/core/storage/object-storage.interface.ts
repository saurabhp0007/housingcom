import type { Readable } from 'node:stream';

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface StoredObject {
  body: Readable;
  size: number;
}

/** Key/value file storage. Keys are slash-separated, e.g. `listings/<id>/<file>.webp`. */
export interface ObjectStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Null when the key does not exist. */
  get(key: string): Promise<StoredObject | null>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

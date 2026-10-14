import { Global, Module } from '@nestjs/common';
import { LocalObjectStorage } from './local-object.storage.js';
import { OBJECT_STORAGE } from './object-storage.interface.js';

@Global()
@Module({
  providers: [{ provide: OBJECT_STORAGE, useClass: LocalObjectStorage }],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}

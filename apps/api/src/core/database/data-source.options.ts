import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy.js';

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  logging: boolean;
}

/** dist/ root, so globs work identically for the app and the TypeORM CLI. */
const distRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Shared by the Nest app (TypeOrmModule) and the migration CLI (data-source.ts). */
export function buildDataSourceOptions(config: DatabaseConnectionConfig): DataSourceOptions {
  return {
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    logging: config.logging,
    namingStrategy: new SnakeNamingStrategy(),
    entities: [join(distRoot, 'modules/**/entities/*.entity.js')],
    migrations: [join(distRoot, 'core/database/migrations/*.js')],
    migrationsTableName: 'migrations',
    // Schema changes only ever go through reviewed migrations.
    synchronize: false,
    migrationsRun: false,
    extra: { max: 20 },
  };
}

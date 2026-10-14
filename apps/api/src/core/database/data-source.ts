import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../../config/configuration.js';
import { buildDataSourceOptions } from './data-source.options.js';

// The CLI runs outside Nest, so load .env here (real environments inject variables directly).
if (existsSync('.env')) process.loadEnvFile('.env');

/** Entry point for the TypeORM CLI (migration:run / generate / revert) and seeds. */
export default new DataSource(buildDataSourceOptions(databaseConfig()));

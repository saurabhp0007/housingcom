import 'reflect-metadata';
import { slugify } from '@housingcom/utils';
import { Logger } from '@nestjs/common';
import dataSource from '../data-source.js';
import { SEED_APP_CONFIGS, SEED_CITIES } from './seed-data.js';

const point = ([lat, lng]: [number, number]) => `SRID=4326;POINT(${lng} ${lat})`;

/** Idempotent reference-data seed: safe to run on every deploy. */
async function run(): Promise<void> {
  const logger = new Logger('Seeds');
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (m) => {
      for (const city of SEED_CITIES) {
        const [row] = (await m.query(
          `INSERT INTO cities (name, state, slug, center)
           VALUES ($1, $2, $3, $4::geography)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, center = EXCLUDED.center
           RETURNING id`,
          [city.name, city.state, slugify(city.name), point(city.center)],
        )) as { id: string }[];

        for (const area of city.areas) {
          await m.query(
            `INSERT INTO areas (city_id, name, slug, center, is_popular)
             VALUES ($1, $2, $3, $4::geography, $5)
             ON CONFLICT (city_id, slug) DO UPDATE
               SET name = EXCLUDED.name, center = EXCLUDED.center, is_popular = EXCLUDED.is_popular`,
            [row!.id, area.name, slugify(area.name), point(area.center), area.popular ?? false],
          );
        }
      }

      for (const c of SEED_APP_CONFIGS) {
        await m.query(
          `INSERT INTO app_platform_configs (platform, min_supported_version, latest_version, store_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (platform) DO NOTHING`,
          [c.platform, c.minSupportedVersion, c.latestVersion, c.storeUrl],
        );
      }
    });
    logger.log(`Seeded ${SEED_CITIES.length} cities and ${SEED_APP_CONFIGS.length} app configs`);
  } finally {
    await dataSource.destroy();
  }
}

await run();

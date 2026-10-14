import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import dataSource from '../data-source.js';

/**
 * Grants the admin role to an existing user (they must have signed in once).
 *   pnpm --filter @housingcom/api make-admin --phone +919876543210
 *   pnpm --filter @housingcom/api make-admin --email ops@example.com
 */
async function run(): Promise<void> {
  const logger = new Logger('make-admin');
  const args = process.argv.slice(2);
  const flag = args[0];
  const value = args[1];
  if ((flag !== '--phone' && flag !== '--email') || !value) {
    logger.error('Usage: make-admin --phone +91XXXXXXXXXX | --email you@example.com');
    process.exit(1);
  }

  await dataSource.initialize();
  try {
    const column = flag === '--phone' ? 'phone' : 'email';
    const rows = (await dataSource.query(
      `UPDATE users SET roles = array_append(roles, 'admin'), updated_at = now()
       WHERE ${column} = $1 AND NOT ('admin' = ANY(roles))
       RETURNING id`,
      [value],
    )) as [{ id: string }[], number];
    const updated = rows[0]?.length ?? 0;
    if (updated === 0) {
      logger.warn(`No change: no user with ${column} ${value}, or they are already an admin.`);
    } else {
      logger.log(`Granted admin to ${value}. They must sign in again to pick up the role.`);
    }
  } finally {
    await dataSource.destroy();
  }
}

await run();

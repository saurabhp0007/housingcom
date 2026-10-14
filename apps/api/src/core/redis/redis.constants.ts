export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/** Parses redis://user:pass@host:port/db (or rediss://) into ioredis/BullMQ connection options. */
export function parseRedisUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username || undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    db: u.pathname.length > 1 ? Number(u.pathname.slice(1)) : 0,
    tls: u.protocol === 'rediss:' ? {} : undefined,
  };
}

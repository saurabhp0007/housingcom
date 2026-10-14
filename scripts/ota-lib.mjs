// Shared helpers for the OTA scripts. Zero app dependencies; runs on Node 22+.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const MOBILE_DIR = join(ROOT, 'apps/mobile');
export const REGISTRY_PATH = join(MOBILE_DIR, 'ota/runtime-versions.json');
export const CHANNELS = ['development', 'preview', 'production'];
export const PLATFORMS = ['android', 'ios'];

/** Tiny `--key value` / `--flag` parser. */
export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[key] = true;
    else args[key] = argv[++i];
  }
  return args;
}

export function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

/** Loads apps/mobile/.env into process.env (without overriding real env vars). */
export function loadMobileEnv() {
  const envFile = join(MOBILE_DIR, '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
}

export function run(cmd, args, options = {}) {
  return execFileSync(cmd, args, {
    cwd: MOBILE_DIR,
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Native fingerprint for a platform, exactly as expo-updates computes it in the binary. */
export function resolveRuntimeVersion(platform, env) {
  const out = run('npx', ['expo-updates', 'runtimeversion:resolve', '--platform', platform], {
    capture: true,
    env,
  });
  const json = JSON.parse(out.slice(out.indexOf('{')));
  if (!json.runtimeVersion) fail(`Could not resolve runtime version for ${platform}`);
  return json.runtimeVersion;
}

export function readRegistry() {
  return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
}

export function writeRegistry(registry) {
  writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
}

export function gitCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

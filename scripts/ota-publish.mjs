#!/usr/bin/env node
/**
 * Builds and publishes an OTA update to the self-hosted update server.
 *
 *   pnpm ota:publish --channel production [--platform android|ios|all] [--rollout 20]
 *                    [--critical] [--message "Fix login crash"] [--dry-run] [--force]
 *
 * Env: OTA_API_URL (e.g. https://api.example.com/api), OTA_ADMIN_TOKEN.
 *
 * Steps: fingerprint guard → expo export → expoConfig.json + ota.json → zip → upload.
 * The same zip can be uploaded by hand on the OTA console page.
 */
import AdmZip from 'adm-zip';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHANNELS,
  fail,
  gitCommit,
  loadMobileEnv,
  parseArgs,
  PLATFORMS,
  readRegistry,
  resolveRuntimeVersion,
  ROOT,
  run,
} from './ota-lib.mjs';

const args = parseArgs(process.argv.slice(2));
loadMobileEnv();

const channel = args.channel;
if (!CHANNELS.includes(channel)) fail(`--channel must be one of: ${CHANNELS.join(', ')}`);

const platforms = !args.platform || args.platform === 'all' ? PLATFORMS : [args.platform];
if (!platforms.every((p) => PLATFORMS.includes(p))) fail('--platform must be android, ios or all');

const rollout = Number(args.rollout ?? 100);
if (!Number.isInteger(rollout) || rollout < 1 || rollout > 100)
  fail('--rollout must be an integer 1-100');

// The binary for a channel is built with APP_VARIANT=<channel>; the export must match it
// exactly, otherwise the fingerprint (and app config) would differ.
const buildEnv = { APP_VARIANT: channel, UPDATE_CHANNEL: channel };

// ── 1. Fingerprint guard ─────────────────────────────────────────────
console.log(`\n▸ Resolving runtime versions (${platforms.join(', ')})…`);
const registry = readRegistry();
const runtimeVersions = {};
for (const platform of platforms) {
  const runtimeVersion = resolveRuntimeVersion(platform, buildEnv);
  runtimeVersions[platform] = runtimeVersion;
  const shipped = registry[channel]?.[platform] ?? [];
  const known = shipped.includes(runtimeVersion);
  console.log(
    `  ${platform}: ${runtimeVersion} ${known ? '✓ matches a shipped binary' : '⚠ no shipped binary'}`,
  );
  if (!known && !args.force) {
    fail(
      `Native code or config changed for ${platform}: no ${channel} binary has runtime ${runtimeVersion}.\n` +
        `  This change needs a new native build (eas build --profile ${channel}), not an OTA update.\n` +
        `  After building, run: pnpm ota:record-runtime --channel ${channel} --platform ${platform}\n` +
        `  (Use --force only if you are sure a binary with this runtime is already installed.)`,
    );
  }
}

// ── 2. Export the JS bundle + assets ─────────────────────────────────
const outDir = join(ROOT, '.ota/dist');
rmSync(outDir, { recursive: true, force: true });
console.log('\n▸ Exporting bundle…');
run(
  'npx',
  ['expo', 'export', ...platforms.flatMap((p) => ['--platform', p]), '--output-dir', outDir],
  {
    env: buildEnv,
  },
);

// ── 3. Metadata the server needs ─────────────────────────────────────
const expoConfig = JSON.parse(
  run('npx', ['expo', 'config', '--type', 'public', '--json'], { capture: true, env: buildEnv }),
);
writeFileSync(join(outDir, 'expoConfig.json'), JSON.stringify(expoConfig));
writeFileSync(
  join(outDir, 'ota.json'),
  JSON.stringify({ runtimeVersions, gitCommit: gitCommit() }),
);

// ── 4. Zip ───────────────────────────────────────────────────────────
const zip = new AdmZip();
zip.addLocalFolder(outDir);
mkdirSync(join(ROOT, '.ota'), { recursive: true });
const zipPath = join(ROOT, `.ota/update-${channel}-${Date.now()}.zip`);
zip.writeZip(zipPath);
console.log(`\n▸ Bundle: ${zipPath}`);

if (args['dry-run']) {
  console.log(
    '\n✔ Dry run: not uploaded. Upload this zip on the OTA console, or rerun without --dry-run.\n',
  );
  process.exit(0);
}

// ── 5. Upload ────────────────────────────────────────────────────────
const apiUrl = (process.env.OTA_API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? '').replace(
  /\/$/,
  '',
);
const token = process.env.OTA_ADMIN_TOKEN;
if (!apiUrl || !token) fail('Set OTA_API_URL and OTA_ADMIN_TOKEN to upload (or use --dry-run).');

const form = new FormData();
form.set('bundle', new Blob([zip.toBuffer()], { type: 'application/zip' }), 'bundle.zip');
form.set('channel', channel);
form.set('rolloutPercent', String(rollout));
form.set('isCritical', String(!!args.critical));
if (typeof args.message === 'string') form.set('message', args.message);
form.set('publishedBy', process.env.USER ?? 'cli');

console.log(`\n▸ Uploading to ${apiUrl}/ota/updates …`);
const res = await fetch(`${apiUrl}/ota/updates`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}` },
  body: form,
});
const body = await res.json().catch(() => ({}));
if (!res.ok) fail(`Upload failed (${res.status}): ${body?.error?.message ?? res.statusText}`);

console.log('\n✔ Published:');
for (const u of body.data.updates) {
  console.log(
    `  ${u.platform.padEnd(8)} ${u.id}  runtime ${u.runtimeVersion.slice(0, 12)}  rollout ${u.rolloutPercent}%`,
  );
}
console.log(
  `\nDevices on the ${channel} channel pick it up on next launch${args.critical ? ' (critical: applied immediately)' : ''}.\n`,
);

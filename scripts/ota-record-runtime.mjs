#!/usr/bin/env node
/**
 * Records the runtime fingerprint of a native build you just shipped, so OTA updates
 * for it are allowed:   pnpm ota:record-runtime --channel production [--platform android|ios|all]
 * Run it right after `eas build` for a store/internal release (CI does this automatically).
 */
import {
  CHANNELS,
  fail,
  loadMobileEnv,
  parseArgs,
  PLATFORMS,
  readRegistry,
  resolveRuntimeVersion,
  writeRegistry,
} from './ota-lib.mjs';

const args = parseArgs(process.argv.slice(2));
loadMobileEnv();

if (!CHANNELS.includes(args.channel)) fail(`--channel must be one of: ${CHANNELS.join(', ')}`);
const platforms = !args.platform || args.platform === 'all' ? PLATFORMS : [args.platform];

const registry = readRegistry();
for (const platform of platforms) {
  const runtimeVersion = resolveRuntimeVersion(platform, {
    APP_VARIANT: args.channel,
    UPDATE_CHANNEL: args.channel,
  });
  const list = (registry[args.channel][platform] ??= []);
  if (!list.includes(runtimeVersion)) list.push(runtimeVersion);
  console.log(`✔ ${args.channel}/${platform}: ${runtimeVersion}`);
}
writeRegistry(registry);
console.log('Commit apps/mobile/ota/runtime-versions.json.');

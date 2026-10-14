# OTA updates (self-hosted)

The API implements the **Expo Updates protocol v1** (`apps/api/src/modules/ota`). The app's
`updates.url` points at `GET /api/ota/manifest`.

## What can ship over the air

OTA updates replace **JavaScript and assets only**. The app uses `runtimeVersion: { policy: 'fingerprint' }`:
a hash of all native code and config. An update is only served to binaries with the same fingerprint, so an
update can never reach an app it would crash.

`apps/mobile/ota/runtime-versions.json` lists the fingerprints of binaries you shipped.
`pnpm ota:publish` **refuses** to publish when the current fingerprint is not in that list. That means a
native change happened, and you need a new store build instead.

## Releasing

```bash
# After each store/internal build:
eas build --profile production --platform all
pnpm ota:record-runtime --channel production        # commit runtime-versions.json

# Ship a JS fix:
export OTA_API_URL=https://api.example.com/api OTA_ADMIN_TOKEN=...
pnpm ota:publish --channel production --rollout 10 --message "Fix OTP crash"
pnpm ota:publish --channel production --critical    # applied immediately on launch

# Or build only, then publish the zip from the app (Admin → App updates → Publish update), or with curl:
pnpm ota:publish --channel production --dry-run
curl -X POST "$OTA_API_URL/ota/updates" -H "Authorization: Bearer $OTA_ADMIN_TOKEN" \
  -F bundle=@.ota/update-production-<ts>.zip -F channel=production -F rolloutPercent=100
```

## Safety nets

| Situation                    | What happens                                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New update crashes on launch | expo-updates falls back to the previous bundle and reports the update ID in `Expo-Recent-Failed-Update-IDs`. The server never serves that update to that device again.                   |
| Crash rate climbs            | The app sends `launched` / `crashed` beacons. A BullMQ worker **auto-pauses** the update when the crash rate ≥ `OTA_AUTO_PAUSE_CRASH_RATE` after `OTA_AUTO_PAUSE_MIN_LAUNCHES` launches. |
| Update paused / rolled back  | Devices get the previous good update, or a `rollBackToEmbedded` directive if none remains.                                                                                               |
| Staged rollout               | `rolloutPercent` buckets devices deterministically by `EAS-Client-ID`. Raise it in the app: Admin → App updates.                                                                         |
| Native binary too old        | `/app-config` `minSupportedVersion` shows a blocking "Update from store" screen. `latestVersion` shows a soft nudge.                                                                     |

Manifest and asset endpoints are not rate-limited, because many phones share IPs behind carrier NAT.
Assets are content-addressed (`sha256.ext`) and immutable, so put a CDN in front (`STORAGE_PUBLIC_BASE_URL`).

## Code signing (recommended for production)

```bash
npx expo-updates codesigning:generate --key-output-directory keys \
  --certificate-output-directory apps/mobile/certs --certificate-validity-duration-years 10 \
  --certificate-common-name "Housing OTA"
```

- Commit `apps/mobile/certs/certificate.pem`. `app.config.ts` enables signing when it exists.
- Keep `keys/private-key.pem` secret (it is git-ignored) and set `OTA_SIGNING_PRIVATE_KEY_PATH` on the API.
- The app then rejects any manifest that this key did not sign.

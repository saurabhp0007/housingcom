#!/usr/bin/env bash
# Builds the Android app into apps/mobile/builds/. Nothing is uploaded.
#
#   apps/mobile/build.sh apk [patch|minor|major|keep]   # bump the version (default: patch) and build an APK
#   apps/mobile/build.sh ota                            # OTA bundle (.zip) for the current version
#
# Install the APK on the phone yourself. Upload the OTA zip at https://<server>/updates/
# (or in the app: Admin → App updates). An OTA only reaches APKs of the same version that were
# built by this script, because the APK build records its runtime fingerprint.
#
# Channel defaults to preview; use CHANNEL=production for store builds.
set -euo pipefail

CHANNEL="${CHANNEL:-preview}"
MOBILE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$MOBILE/../.." && pwd)"
OUT="$MOBILE/builds"
export APP_VARIANT="$CHANNEL" UPDATE_CHANNEL="$CHANNEL"

version() { node -p "require('$MOBILE/package.json').version"; }

prepare() {
  echo "▸ Installing dependencies and building shared packages"
  (cd "$ROOT" && pnpm install --frozen-lockfile >/dev/null && pnpm --filter "@housingcom/mobile^..." build >/dev/null)
  mkdir -p "$OUT"
}

build_apk() {
  local bump="${1:-patch}"
  case "$bump" in
    patch | minor | major) (cd "$MOBILE" && npm version "$bump" --no-git-tag-version >/dev/null) ;;
    keep) ;;
    *) echo "✖ Unknown bump '$bump' (patch | minor | major | keep)"; exit 1 ;;
  esac
  local v
  v="$(version)"
  echo "▸ Version $v ($CHANNEL)"
  prepare

  echo "▸ Generating the native Android project"
  (cd "$MOBILE" && npx expo prebuild --platform android --clean --no-install >/dev/null)

  echo "▸ Building the release APK (a few minutes; the first build takes longer)"
  (cd "$MOBILE/android" && ./gradlew assembleRelease --quiet)

  echo "▸ Recording the runtime fingerprint so OTA updates can target this APK"
  (cd "$ROOT" && pnpm --silent ota:record-runtime --channel "$CHANNEL" --platform android >/dev/null)

  local apk="$OUT/housing-$CHANNEL-$v.apk"
  cp "$MOBILE/android/app/build/outputs/apk/release/app-release.apk" "$apk"
  echo "✔ APK: $apk"
  echo "  Commit apps/mobile/package.json and apps/mobile/ota/runtime-versions.json for v$v."
}

build_ota() {
  local v stamp before zip
  v="$(version)"
  stamp="$(date +%Y%m%d-%H%M)"
  echo "▸ OTA bundle for v$v ($CHANNEL)"
  prepare

  before="$(ls -t "$ROOT"/.ota/update-*.zip 2>/dev/null | head -1 || true)"
  (cd "$ROOT" && pnpm --silent ota:publish --channel "$CHANNEL" --platform android --dry-run)
  zip="$(ls -t "$ROOT"/.ota/update-*.zip | head -1)"
  [[ "$zip" != "$before" ]] || { echo "✖ No bundle was produced"; exit 1; }

  mv "$zip" "$OUT/ota-$CHANNEL-$v-$stamp.zip"
  echo "✔ OTA bundle: $OUT/ota-$CHANNEL-$v-$stamp.zip"
}

case "${1:-}" in
  apk) build_apk "${2:-patch}" ;;
  ota) build_ota ;;
  *)
    echo "Usage: $0 apk [patch|minor|major|keep]"
    echo "       $0 ota"
    exit 1
    ;;
esac

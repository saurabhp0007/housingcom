#!/usr/bin/env bash
# Deploys the backend to the VPS: syncs the code and deploy/.env, rebuilds the stack,
# waits for the API to be healthy. Migrations and seeds run when the API container starts.
#
#   apps/api/deploy.sh
#
# Override the target with SERVER=root@host.
set -euo pipefail

SERVER="${SERVER:-root@129.121.171.57}"
REMOTE_DIR=/opt/housing
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

[[ -f "$ROOT/deploy/.env" ]] || { echo "✖ Missing deploy/.env"; exit 1; }
set -a; source "$ROOT/deploy/.env"; set +a
HEALTH_URL="${PUBLIC_BASE_URL%/}/${API_PREFIX:-api}/health/ready"

echo "▸ Syncing code to $SERVER:$REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules --exclude .git --exclude dist --exclude .turbo --exclude .ota \
  --exclude '.env' --exclude apps/mobile --exclude apps/api/storage \
  "$ROOT/" "$SERVER:$REMOTE_DIR/"
scp -q "$ROOT/deploy/.env" "$SERVER:$REMOTE_DIR/deploy/.env"

echo "▸ Building and restarting containers"
ssh "$SERVER" "set -e
  chmod 600 $REMOTE_DIR/deploy/.env
  cd $REMOTE_DIR/deploy
  docker compose up -d --build --remove-orphans
  docker image prune -f >/dev/null"

echo "▸ Waiting for $HEALTH_URL"
for _ in $(seq 1 40); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "✔ Deployed: ${PUBLIC_BASE_URL%/}/${API_PREFIX:-api}"
    exit 0
  fi
  sleep 3
done

echo "✖ API not healthy. Recent logs:"
ssh "$SERVER" "cd $REMOTE_DIR/deploy && docker compose logs api --tail 40 --no-log-prefix"
exit 1

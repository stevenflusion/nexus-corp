#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

DOCKER_TIMEOUT=30
PG_PORT=5432

echo "[predev] Stopping API container (if running)..."
docker compose stop api 2>/dev/null || true

# Kill orphaned docker-proxy listeners on 5432 that prevent compose from binding
echo "[predev] Checking for orphaned docker-proxy on port ${PG_PORT}..."
while true; do
  proxy_pids=$(ss -tlnp | grep ":${PG_PORT}" | grep -oP 'pid=\K[0-9]+' || true)
  if [ -z "$proxy_pids" ]; then
    break
  fi
  echo "[predev] Killing orphaned docker-proxy PIDs: $proxy_pids"
  echo "$proxy_pids" | xargs -r kill -9 2>/dev/null || true
  sleep 1
done

echo "[predev] Starting postgres..."
docker compose up -d postgres 2>/dev/null

echo "[predev] Waiting for postgres to be ready (timeout ${DOCKER_TIMEOUT}s)..."
for i in $(seq 1 "$DOCKER_TIMEOUT"); do
  if docker compose exec -T postgres pg_isready -U postgres -d nexus >/dev/null 2>&1; then
    echo "[predev] Postgres is ready."
    break
  fi
  if [ "$i" -eq "$DOCKER_TIMEOUT" ]; then
    echo "[predev] ERROR: Postgres did not become ready within ${DOCKER_TIMEOUT}s."
    exit 1
  fi
  sleep 1
done

run_migrate() {
  npm run db:migrate 2>&1
}

echo "[predev] Running migrations..."
if run_migrate; then
  echo "[predev] Migrations applied successfully."
  exit 0
fi

# If migration failed, check if it was an auth error (stale volume with old password)
migrate_output=$(run_migrate) || true
if echo "$migrate_output" | grep -q "password authentication failed"; then
  echo "[predev] Migration failed due to password mismatch. Likely stale postgres volume."
  echo "[predev] Wiping postgres volume and recreating..."
  docker compose down -v 2>/dev/null || true
  docker compose up -d postgres 2>/dev/null

  echo "[predev] Waiting for postgres to be ready again..."
  for i in $(seq 1 "$DOCKER_TIMEOUT"); do
    if docker compose exec -T postgres pg_isready -U postgres -d nexus >/dev/null 2>&1; then
      echo "[predev] Postgres is ready."
      break
    fi
    if [ "$i" -eq "$DOCKER_TIMEOUT" ]; then
      echo "[predev] ERROR: Postgres did not become ready within ${DOCKER_TIMEOUT}s after recreate."
      exit 1
    fi
    sleep 1
  done

  echo "[predev] Re-running migrations..."
  if run_migrate; then
    echo "[predev] Migrations applied successfully after recreate."
    exit 0
  else
    echo "[predev] ERROR: Migrations still failing after recreating postgres volume."
    exit 1
  fi
else
  echo "[predev] ERROR: Migration failed for an unexpected reason."
  echo "$migrate_output"
  exit 1
fi

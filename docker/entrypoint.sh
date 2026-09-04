#!/bin/sh
set -e

mkdir -p /app/data /app/uploads

cmd="${1:-app}"

run_push() {
  echo "> Applying SQLite schema (drizzle-kit push)..."
  npx drizzle-kit push
}

run_seed() {
  force="$1"
  if [ "$force" = "force" ] || [ "$force" = "--force" ]; then
    echo "> Seeding demo data (force)..."
    npx tsx scripts/seed-demo.ts --force
  else
    echo "> Seeding demo data..."
    npx tsx scripts/seed-demo.ts
  fi
}

case "$cmd" in
  push|db:push)
    run_push
    ;;
  seed|db:seed)
    run_push
    run_seed
    ;;
  seed:force|db:seed:force)
    run_push
    run_seed force
    ;;
  app|"")
    run_push
    # Default on: demo seed runs on every compose up (script skips existing rows)
    if [ "${SEED_ON_START:-1}" = "0" ] || [ "${SEED_ON_START:-}" = "false" ]; then
      echo "> Skipping demo seed (SEED_ON_START=${SEED_ON_START:-1})"
    else
      run_seed
    fi
    echo "> Starting AP Magazine on 0.0.0.0:${PORT:-3000}"
    exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
    ;;
  *)
    echo "Unknown command: $cmd"
    echo "Usage: entrypoint.sh [app|push|seed|seed:force]"
    exit 1
    ;;
esac

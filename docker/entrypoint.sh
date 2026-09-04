#!/bin/sh
set -e

mkdir -p /app/data /app/uploads

echo "> Applying SQLite schema..."
npx drizzle-kit push

echo "> Starting AP Magazine on 0.0.0.0:${PORT:-3000}"
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"

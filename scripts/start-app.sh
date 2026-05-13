#!/bin/sh
set -eu

mkdir -p /app/data

echo "[startup] Applying database migrations..."
npx prisma migrate deploy
echo "[startup] Seeding baseline data..."
npm run db:seed

echo "[startup] Starting web server on port ${PORT:-3000}..."
exec node server.js

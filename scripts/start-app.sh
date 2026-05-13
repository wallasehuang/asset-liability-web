#!/bin/sh
set -eu

mkdir -p /app/data

npx prisma migrate deploy
npm run db:seed

exec npx next start --hostname 0.0.0.0 --port "${PORT:-3000}"

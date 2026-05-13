#!/bin/sh
set -eu

SOURCE_DB="${1:-./prisma/dev.db}"
BACKUP_DIR="${2:-./backups}"

mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
cp "$SOURCE_DB" "$BACKUP_DIR/app-$STAMP.db"
echo "Backup created at $BACKUP_DIR/app-$STAMP.db"

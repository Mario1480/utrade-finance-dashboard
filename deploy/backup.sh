#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=${BACKUP_DIR:-./backups}
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILE="$BACKUP_DIR/utrade_finance_$TIMESTAMP.sql.gz"

PGPASSWORD=${POSTGRES_PASSWORD:-postgres} pg_dump \
  -h ${POSTGRES_HOST:-localhost} \
  -U ${POSTGRES_USER:-postgres} \
  -d ${POSTGRES_DB:-utrade_finance} | gzip > "$FILE"

echo "Backup erstellt: $FILE"

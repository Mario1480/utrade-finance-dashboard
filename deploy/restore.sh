#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <backup.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Datei nicht gefunden: $BACKUP_FILE"
  exit 1
fi

gunzip -c "$BACKUP_FILE" | PGPASSWORD=${POSTGRES_PASSWORD:-postgres} psql \
  -h ${POSTGRES_HOST:-localhost} \
  -U ${POSTGRES_USER:-postgres} \
  -d ${POSTGRES_DB:-utrade_finance}

echo "Restore abgeschlossen"

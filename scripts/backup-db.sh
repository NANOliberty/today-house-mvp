#!/usr/bin/env bash
# PostgreSQL 일일 백업. 홈서버 crontab 예: 0 4 * * * /path/to/today-house-mvp/scripts/backup-db.sh
# 보관: 7일. 복구: gunzip -c FILE | docker compose exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/todayhouse}"
KEEP_DAYS="${KEEP_DAYS:-7}"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/todayhouse-$STAMP.sql.gz"

docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-todayhouse}" "${POSTGRES_DB:-todayhouse}" | gzip > "$OUT"
find "$BACKUP_DIR" -name 'todayhouse-*.sql.gz' -mtime +"$KEEP_DAYS" -delete

echo "backup ok: $OUT ($(du -h "$OUT" | cut -f1))"

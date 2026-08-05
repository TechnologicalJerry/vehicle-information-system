#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore-db.sh <BACKUP_DIR>"
  exit 1
fi

BACKUP_DIR="$1"
echo "=== Starting Automated Database Restore from $BACKUP_DIR ==="

if [ -f "$BACKUP_DIR/postgres_vis_db.dump" ]; then
  echo "Restoring PostgreSQL database..."
  pg_restore -h localhost -U vis_user -d vis_db -v "$BACKUP_DIR/postgres_vis_db.dump" || true
fi

if [ -d "$BACKUP_DIR/mongo_dump" ]; then
  echo "Restoring MongoDB database..."
  mongorestore --host localhost --port 27017 --db vis_telemetry_db "$BACKUP_DIR/mongo_dump/vis_telemetry_db" || true
fi

echo "=== Database Restore Completed ==="

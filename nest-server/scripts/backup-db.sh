#!/bin/bash
set -e

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "=== Starting Automated Database Backup ==="
echo "Backing up PostgreSQL database 'vis_db'..."
pg_dump -h localhost -U vis_user -d vis_db -F c -b -v -f "$BACKUP_DIR/postgres_vis_db.dump" || echo "PostgreSQL backup warning: verify credentials or running instance."

echo "Backing up MongoDB database 'vis_telemetry_db'..."
mongodump --host localhost --port 27017 --db vis_telemetry_db --out "$BACKUP_DIR/mongo_dump" || echo "MongoDB dump warning: verify credentials or running instance."

echo "=== Database Backup Completed: $BACKUP_DIR ==="

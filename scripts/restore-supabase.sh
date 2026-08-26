#!/usr/bin/env bash
# ==============================================================================
# Supabase PostgreSQL Restore Script (Disaster Recovery)
# ==============================================================================
# Usage:
#   ./scripts/restore-supabase.sh <path_to_backup_file.sql.gz>
# ==============================================================================

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <path-to-backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[ERROR] Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# Load environment variables if .env or .env.local exists
if [ -f "${PROJECT_ROOT}/.env.local" ]; then
  export $(grep -v '^#' "${PROJECT_ROOT}/.env.local" | xargs -d '\n' 2>/dev/null || true)
elif [ -f "${PROJECT_ROOT}/.env" ]; then
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs -d '\n' 2>/dev/null || true)
fi

DB_CONN="${SUPABASE_DB_URL:-${DATABASE_URL:-${DIRECT_URL:-}}}"

if [ -z "${DB_CONN}" ]; then
  echo "[ERROR] No database connection string found."
  echo "Please set SUPABASE_DB_URL, DATABASE_URL, or DIRECT_URL in your environment."
  exit 1
fi

echo "================================================================="
echo "  WARNING: YOU ARE ABOUT TO RESTORE DATABASE STATE"
echo "  Target: ${DB_CONN}"
echo "  Source: ${BACKUP_FILE}"
echo "================================================================="
read -p "Are you sure you want to proceed? (Type 'RESTORE' to confirm): " CONFIRM

if [ "${CONFIRM}" != "RESTORE" ]; then
  echo "Restore aborted."
  exit 0
fi

echo "Restoring database from ${BACKUP_FILE}..."
gunzip -c "${BACKUP_FILE}" | psql "${DB_CONN}"

echo "Database restore completed successfully!"

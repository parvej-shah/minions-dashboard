#!/usr/bin/env bash
# ==============================================================================
# Supabase PostgreSQL Daily Backup Script (Free Tier Automated)
# ==============================================================================
# Usage:
#   ./scripts/backup-supabase.sh
# Or via crontab:
#   0 2 * * * /path/to/minions-dashboard/scripts/backup-supabase.sh >> /var/log/supabase_backup.log 2>&1
# ==============================================================================

set -euo pipefail

# Directory setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP="$(date -u +"%Y-%m-%d_%H%M%SZ")"
BACKUP_FILE="${BACKUP_DIR}/supabase_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Load environment variables if .env or .env.local exists
if [ -f "${PROJECT_ROOT}/.env.local" ]; then
  # export non-commented vars
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

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting Supabase database backup..."

# Execute pg_dump and compress on the fly
pg_dump \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --quote-all-identifiers \
  --dbname="${DB_CONN}" \
  | gzip -9 > "${BACKUP_FILE}"

FILE_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup completed successfully: ${BACKUP_FILE} (${FILE_SIZE})"

# Optional: Upload to Cloudflare R2 if AWS CLI and R2 credentials are present
if command -v aws >/dev/null 2>&1 && [ -n "${R2_ACCESS_KEY_ID:-}" ] && [ -n "${R2_SECRET_ACCESS_KEY:-}" ]; then
  R2_BUCKET="${R2_BUCKET_NAME:-minions-assets}"
  R2_EP="${R2_ENDPOINT:-https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com}"
  
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Uploading backup to Cloudflare R2 (bucket: ${R2_BUCKET}/backups)..."
  AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
  AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
  aws s3 cp "${BACKUP_FILE}" "s3://${R2_BUCKET}/backups/$(basename "${BACKUP_FILE}")" --endpoint-url "${R2_EP}"
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Successfully uploaded to Cloudflare R2."
fi

# Retention Cleanup: Delete local backups older than RETENTION_DAYS
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Cleaning up local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "supabase_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Local retention cleanup complete."

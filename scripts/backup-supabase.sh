#!/usr/bin/env bash
# ==============================================================================
# Supabase PostgreSQL Daily Backup Script (Free Tier Automated)
# ==============================================================================
# Usage:
#   npm run db:backup
#   ./scripts/backup-supabase.sh
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

# Extract DB connection string safely using Node
DB_CONN=$(node -e '
  const dotenv = require("dotenv");
  const fs = require("fs");
  let env = {};
  if (fs.existsSync(".env.local")) Object.assign(env, dotenv.parse(fs.readFileSync(".env.local")));
  if (fs.existsSync(".env")) Object.assign(env, dotenv.parse(fs.readFileSync(".env")));
  let url = process.env.SUPABASE_DB_URL || env.SUPABASE_DB_URL || process.env.DATABASE_URL || env.DATABASE_URL || process.env.DIRECT_URL || env.DIRECT_URL || "";
  url = url.replace(":6543/", ":5432/").replace("?pgbouncer=true", "");
  console.log(url);
' 2>/dev/null || echo "")

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

# Upload to Cloudflare R2 using AWS SDK via Node
node -e '
  const dotenv = require("dotenv");
  const fs = require("fs");
  const path = require("path");
  const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
  
  let env = {};
  if (fs.existsSync(".env.local")) Object.assign(env, dotenv.parse(fs.readFileSync(".env.local")));
  if (fs.existsSync(".env")) Object.assign(env, dotenv.parse(fs.readFileSync(".env")));
  
  const accountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || "minions-assets";
  const r2Endpoint = env.R2_ENDPOINT || process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const backupFilePath = "'"${BACKUP_FILE}"'";
  const fileName = path.basename(backupFilePath);

  if (accessKeyId && secretAccessKey && r2Endpoint) {
    console.log(`[${new Date().toISOString()}] Uploading to Cloudflare R2 (bucket: ${bucketName}/backups)...`);
    const r2 = new S3Client({
      region: "auto",
      endpoint: r2Endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
    r2.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: `backups/${fileName}`,
      Body: fs.readFileSync(backupFilePath),
      ContentType: "application/gzip",
    })).then(() => {
      console.log(`[${new Date().toISOString()}] Successfully uploaded to Cloudflare R2!`);
    }).catch(err => {
      console.warn(`[WARNING] Cloudflare R2 upload failed:`, err.message);
    });
  }
' 2>/dev/null || true

# Retention Cleanup: Delete local backups older than RETENTION_DAYS
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Cleaning up local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "supabase_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Local retention cleanup complete."

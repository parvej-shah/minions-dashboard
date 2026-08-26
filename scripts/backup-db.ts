import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Load environment variables
const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!dbUrl) {
  console.error("❌ Error: SUPABASE_DB_URL, DATABASE_URL, or DIRECT_URL is not set.");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.resolve(__dirname, "../backups");
const backupFileName = `supabase_backup_${timestamp}.sql.gz`;
const backupFilePath = path.join(backupDir, backupFileName);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log(`📦 Starting Supabase backup at ${new Date().toISOString()}...`);

try {
  // Execute pg_dump and pipe to gzip
  const dumpCmd = `pg_dump --clean --if-exists --no-owner --no-privileges --quote-all-identifiers --dbname="${dbUrl}" | gzip -9 > "${backupFilePath}"`;
  execSync(dumpCmd, { stdio: "inherit" });

  const stats = fs.statSync(backupFilePath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Backup created locally: ${backupFilePath} (${sizeMb} MB)`);

  // Upload to Cloudflare R2 if configured
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || "minions-assets";
  const r2Endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  if (accountId && accessKeyId && secretAccessKey) {
    console.log(`☁️  Uploading to Cloudflare R2 bucket "${bucketName}" (path: backups/${backupFileName})...`);
    const r2 = new S3Client({
      region: "auto",
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const fileStream = fs.createReadStream(backupFilePath);
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `backups/${backupFileName}`,
        Body: fileStream,
        ContentType: "application/gzip",
      })
    );
    console.log(`🚀 Backup uploaded to Cloudflare R2 successfully!`);
  } else {
    console.log(`ℹ️  Cloudflare R2 credentials not detected in env, saved locally.`);
  }
} catch (error) {
  console.error("❌ Backup failed:", error);
  process.exit(1);
}

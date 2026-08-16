import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "1f53ec1fd1cecae820c14938b7831ab3";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "51b1bea2e78f3072742677044881de99";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "e4edbe425f97782551a6aed448151c8c4a0d4694480003fba2ef546e09e0519c";
const bucketName = process.env.R2_BUCKET_NAME || "minions-assets";
const publicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Upload a file directly to Cloudflare R2
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string = "image/png"
): Promise<{ url: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: typeof body === "string" ? Buffer.from(body) : body,
    ContentType: contentType,
  });

  await r2Client.send(command);
  const publicUrl = `${publicDomain}/${key}`;

  return {
    url: publicUrl,
    key,
  };
}

/**
 * Generate a pre-signed URL for client-side direct uploads
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string = "image/png",
  expiresInSeconds: number = 3600
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
  const publicUrl = `${publicDomain}/${key}`;

  return {
    uploadUrl,
    publicUrl,
    key,
  };
}

/**
 * Delete an object from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await r2Client.send(command);
}

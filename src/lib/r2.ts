import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { assertServerOnly, requireEnv } from "./env";

/**
 * Cloudflare R2 upload client. Server-only: it holds the bucket secret key.
 */
let client: S3Client | null = null;

function getR2Client(): S3Client {
  assertServerOnly("r2");

  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${requireEnv("CLOUDFLARE_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return client;
}

/**
 * Upload a file directly to Cloudflare R2 and return its public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string = "image/png"
): Promise<{ url: string; key: string }> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: key,
      Body: typeof body === "string" ? Buffer.from(body) : body,
      ContentType: contentType,
    })
  );

  return { url: `${requireEnv("NEXT_PUBLIC_R2_PUBLIC_DOMAIN")}/${key}`, key };
}

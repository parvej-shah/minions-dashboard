import { uploadToR2 } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limit";
import { HttpError, badRequest } from "@/server/http/errors";

const MAX_BYTES = 25 * 1024 * 1024;
const UPLOADS_PER_MINUTE = 20;
const MAX_NAME_LENGTH = 50;
const DEFAULT_CONTENT_TYPE = "application/octet-stream";

export async function uploadTenantFile(clientId: string, file: File | null, callerIp: string) {
  const { allowed } = await checkRateLimit(`media-upload:${callerIp}`, UPLOADS_PER_MINUTE, 60);
  if (!allowed) throw new HttpError(429, "Rate limit exceeded. Try again shortly.");
  if (!file) throw badRequest("No file provided.");
  if (file.size > MAX_BYTES) throw new HttpError(413, "File exceeds 25MB limit.");

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const baseName = file.name.replace(/[^a-zA-Z0-9.-]/g, "").replace(/\.[^/.]+$/, "");
  const safeName = baseName ? `${baseName.substring(0, MAX_NAME_LENGTH)}-${Date.now()}` : `${Date.now()}`;
  const key = `uploads/${clientId}/${safeName}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || DEFAULT_CONTENT_TYPE;
  const { url } = await uploadToR2(key, buffer, contentType);
  return { url, key, bytes: buffer.byteLength, content_type: contentType };
}

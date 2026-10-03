import sharp from "sharp";
import { uploadToR2 } from "@/lib/r2";
import { assertSafeFetchTarget } from "@/lib/ssrf-guard";
import { HttpError } from "@/server/http/errors";

// Qwen returns lossless PNG; WebP cuts 60-80% off flat editorial covers without blocking text edges the way JPEG does.
const COMPRESSIBLE_TYPES = new Set(["image/png", "image/jpeg"]);
const WEBP_QUALITY = 82;
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_REDIRECTS = 1;

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Each redirect hop is re-validated so a public URL cannot redirect into an internal one.
async function fetchSafely(url: string): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeFetchTarget(current);
    const response = await fetch(current, { redirect: "manual" });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }
  throw new Error("Too many redirects.");
}

function safeSegment(value: string, fallback: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || fallback;
}

async function downloadImage(sourceUrl: string) {
  const upstream = await fetchSafely(sourceUrl);
  if (!upstream.ok) {
    throw new HttpError(502, `Could not download the image (HTTP ${upstream.status}). The signed URL may have expired.`);
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  if (buffer.byteLength === 0) throw new HttpError(502, "The image downloaded as 0 bytes.");
  if (buffer.byteLength > MAX_BYTES) {
    throw new HttpError(413, `Image is ${Math.round(buffer.byteLength / 1e6)} MB, over the ${MAX_BYTES / 1e6} MB limit.`);
  }

  // An expired signed URL often answers 200 with an XML or HTML error page; storing it would publish a broken cover.
  const contentType = (upstream.headers.get("content-type") || "image/png").split(";")[0].trim();
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) throw new HttpError(422, `Source returned ${contentType}, not an image. The signed URL has probably expired.`);
  return { buffer, contentType, ext };
}

async function compress({ buffer, contentType, ext }: Awaited<ReturnType<typeof downloadImage>>) {
  if (!COMPRESSIBLE_TYPES.has(contentType)) return { buffer, contentType, ext };
  try {
    return { buffer: await sharp(buffer).webp({ quality: WEBP_QUALITY }).toBuffer(), contentType: "image/webp", ext: "webp" };
  } catch {
    return { buffer, contentType, ext };
  }
}

export async function ingestImage(sourceUrl: string, keyPrefix?: string, filename?: string) {
  const image = await compress(await downloadImage(sourceUrl));
  const timestamp = `${Date.now()}`;
  const key = `${safeSegment(keyPrefix || "assets", "assets")}/${safeSegment(filename || timestamp, timestamp)}.${image.ext}`;
  const { url } = await uploadToR2(key, image.buffer, image.contentType);
  return { url, key, bytes: image.buffer.byteLength, content_type: image.contentType };
}

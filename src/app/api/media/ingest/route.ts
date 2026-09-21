import { NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToR2 } from "@/lib/r2";
import { assertSafeFetchTarget } from "@/lib/ssrf-guard";
import { checkRateLimit } from "@/lib/rate-limit";

// Qwen hands back raw PNG for every cover -- lossless, and wasteful for a flat
// editorial design (solid cream background, big flat text, one small icon).
// Re-encoding to WebP typically cuts 60-80% off the bytes with no visible
// loss for this kind of graphic, unlike JPEG which blocks up sharp text edges.
// GIF is skipped (an animation would break under a single-frame re-encode),
// and anything already WebP is left alone.
const COMPRESSIBLE_TYPES = new Set(["image/png", "image/jpeg"]);
const WEBP_QUALITY = 82;

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_REDIRECTS = 1;

/**
 * Fetches `url` after verifying it doesn't resolve to an internal address,
 * following at most MAX_REDIRECTS hops -- each hop is itself re-validated
 * before being followed, so a public URL can't redirect its way into an
 * internal one.
 */
async function fetchSafely(url: string): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeFetchTarget(current);
    const res = await fetch(current, { redirect: "manual" });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, current).toString();
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects.");
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif"
};

function safeSegment(value: string, fallback: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || fallback;
}

/**
 * Copies a remote image into the R2 bucket and returns a permanent public URL.
 *
 * Image generators hand back signed URLs that expire within a day. Anything we
 * store in the registry or publish to the blog has to outlive that, so every
 * generated image is re-hosted here before its URL is written anywhere.
 *
 * Body: { source_url, key_prefix?, filename? }
 * Returns: { url, key, bytes, content_type }
 */
export async function POST(request: Request) {
  let body: { source_url?: string; key_prefix?: string; filename?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const sourceUrl = body.source_url?.trim();
  if (!sourceUrl) {
    return NextResponse.json({ error: "source_url is required." }, { status: 400 });
  }

  // This route relies on src/proxy.ts's global gate (session or the internal
  // webhook secret) for auth -- it has no per-route auth call of its own,
  // consistent with a few other n8n-callback routes in this codebase. Rate
  // limit by caller IP as a second line of defense against a leaked secret or
  // compromised session being used to hammer this (SSRF-adjacent) endpoint.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(`media-ingest:${ip}`, 60, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  try {
    const upstream = await fetchSafely(sourceUrl);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Could not download the image (HTTP ${upstream.status}). The signed URL may have expired.` },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: "The image downloaded as 0 bytes." }, { status: 502 });
    }
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: `Image is ${Math.round(buffer.byteLength / 1e6)} MB, over the ${MAX_BYTES / 1e6} MB limit.` },
        { status: 413 }
      );
    }

    const contentType = (upstream.headers.get("content-type") || "image/png").split(";")[0].trim();
    // An expired signed URL often answers 200 with an XML or HTML error page. Storing
    // that as a .png would publish a broken cover, so reject anything that is not an image.
    const ext = EXT_BY_TYPE[contentType];
    if (!ext) {
      return NextResponse.json(
        { error: `Source returned ${contentType}, not an image. The signed URL has probably expired.` },
        { status: 422 }
      );
    }
    let outBuffer = buffer;
    let outContentType = contentType;
    let outExt = ext;

    if (COMPRESSIBLE_TYPES.has(contentType)) {
      try {
        outBuffer = await sharp(buffer).webp({ quality: WEBP_QUALITY }).toBuffer();
        outContentType = "image/webp";
        outExt = "webp";
      } catch {
        // Malformed/unsupported source image: fall back to storing the
        // original bytes rather than failing the whole ingest.
      }
    }

    const prefix = safeSegment(body.key_prefix || "assets", "assets");
    const name = safeSegment(body.filename || `${Date.now()}`, `${Date.now()}`);
    const key = `${prefix}/${name}.${outExt}`;

    const { url } = await uploadToR2(key, outBuffer, outContentType);

    return NextResponse.json({
      url,
      key,
      bytes: outBuffer.byteLength,
      content_type: outContentType
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}

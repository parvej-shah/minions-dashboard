import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

const MAX_BYTES = 25 * 1024 * 1024;

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

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return NextResponse.json({ error: `source_url is not a valid URL: ${sourceUrl}` }, { status: 400 });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ error: "source_url must be http or https." }, { status: 400 });
  }

  try {
    const upstream = await fetch(sourceUrl, { redirect: "follow" });
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
    const prefix = safeSegment(body.key_prefix || "assets", "assets");
    const name = safeSegment(body.filename || `${Date.now()}`, `${Date.now()}`);
    const key = `${prefix}/${name}.${ext}`;

    const { url } = await uploadToR2(key, buffer, contentType);

    return NextResponse.json({
      url,
      key,
      bytes: buffer.byteLength,
      content_type: contentType
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}

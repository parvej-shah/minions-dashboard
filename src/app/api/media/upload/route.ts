import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireClientId } from "@/lib/tenant";

export async function POST(request: Request) {
  // Enforce auth and grab tenant
  const auth = await requireClientId();
  if ("error" in auth) return auth.error;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(`media-upload:${ip}`, 20, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 25MB limit." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const name = file.name.replace(/[^a-zA-Z0-9.-]/g, "").replace(/\.[^/.]+$/, "");
    const safeName = name ? `${name.substring(0, 50)}-${Date.now()}` : `${Date.now()}`;
    const key = `uploads/${auth.clientId}/${safeName}.${ext}`;

    const { url } = await uploadToR2(key, buffer, file.type || "application/octet-stream");

    return NextResponse.json({
      url,
      key,
      bytes: buffer.byteLength,
      content_type: file.type || "application/octet-stream"
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}

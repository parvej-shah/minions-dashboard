import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Validates incoming webhook requests against BLOG_API_SECRET / MINIONS_WEBHOOK_SECRET
 * Uses constant-time comparison to protect against side-channel timing attacks.
 */
export function verifyWebhookSecret(request: Request): { isValid: boolean; response?: NextResponse } {
  const secretHeader = request.headers.get("x-webhook-secret") || request.headers.get("x-minions-secret");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

  const validSecret = (process.env.BLOG_API_SECRET || process.env.MINIONS_WEBHOOK_SECRET || "minions-publish-secret-2026").trim();
  const provided = (secretHeader || bearerToken || "").trim();

  if (!provided) {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: "Unauthorized: Missing webhook authentication token. Provide X-Webhook-Secret header." },
        { status: 401 }
      ),
    };
  }

  // Constant-time comparison using SHA-256 hash digests to prevent timing attacks
  const hashProvided = crypto.createHash("sha256").update(provided).digest();
  const hashValid = crypto.createHash("sha256").update(validSecret).digest();

  if (!crypto.timingSafeEqual(hashProvided, hashValid)) {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: "Unauthorized: Invalid webhook secret token" },
        { status: 401 }
      ),
    };
  }

  return { isValid: true };
}

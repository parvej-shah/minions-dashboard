import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireEnv } from "./env";
import { checkRateLimit } from "./rate-limit";

/**
 * Constant-time string equality, via SHA-256 digests so `timingSafeEqual` never
 * sees mismatched buffer lengths (which itself would throw / leak length info).
 * Use this anywhere a secret is compared against a caller-supplied value --
 * a plain `===` here is a timing side-channel.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Calls a minute the webhook secret may make. Every n8n workflow shares the one
 * secret, and a scheduled harvest makes about nine calls per workspace, all in
 * the same minute: at 60, ten workspaces got 429s (2026-09-29, 04:00). A wrong
 * secret is refused before this count, so the cap only bounds a leaked one.
 */
const WEBHOOK_CALLS_PER_MINUTE = 600;

/**
 * Validates incoming webhook requests against MINIONS_WEBHOOK_SECRET.
 *
 * Deliberately NOT BLOG_API_SECRET any more: that variable held a value that
 * was committed to the public getminions.ai repo, so it authenticated this
 * API for anyone. n8n holds the same secret in its "Minions Cockpit API
 * (webhook secret)" credential; rotate both together.
 * Uses constant-time comparison to protect against side-channel timing attacks, and
 * rate-limits by the hash of the provided secret so a leaked/brute-forced token can't
 * be hammered without limit.
 */
export async function verifyWebhookSecret(
  request: Request
): Promise<{ isValid: boolean; response?: NextResponse }> {
  const secretHeader =
    request.headers.get("x-webhook-secret") || request.headers.get("x-minions-secret");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

  const validSecret = requireEnv("MINIONS_WEBHOOK_SECRET");
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

  if (!constantTimeEqual(provided, validSecret)) {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: "Unauthorized: Invalid webhook secret token" },
        { status: 401 }
      ),
    };
  }

  // Bucket by a hash of the secret, never the raw value, so it never lands in logs/DB.
  const bucketKey = `webhook:${crypto.createHash("sha256").update(provided).digest("hex")}`;
  const { allowed } = await checkRateLimit(bucketKey, WEBHOOK_CALLS_PER_MINUTE, 60);
  if (!allowed) {
    return {
      isValid: false,
      response: NextResponse.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 }),
    };
  }

  return { isValid: true };
}

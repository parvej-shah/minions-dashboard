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

// Every n8n workflow shares one secret and a scheduled harvest makes about nine calls per workspace in the same minute.
// A wrong secret is refused before this count, so the cap only bounds a leaked one.
const WEBHOOK_CALLS_PER_MINUTE = 600;

/**
 * Validates a request against MINIONS_WEBHOOK_SECRET, which n8n holds in its "Minions Cockpit API (webhook secret)" credential;
 * rotate both together. The comparison is constant-time and the rate limit is keyed by a hash of the secret.
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

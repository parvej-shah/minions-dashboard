import { NextResponse } from "next/server";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseDisclosure, parseMemoryContent } from "@/lib/authorInput";
import { checkMemory } from "@/lib/ai/memoryCheck";

/**
 * The generalization check the Experience editor runs before saving: flags
 * names, places, figures and anything confidential, and offers a rewrite with
 * the specifics removed (decision D4). Advisory except for contact details
 * and secrets, which POST /api/brand/memory also refuses.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { allowed } = await checkRateLimit(`memory-check:${ctx.clientId}`, 30, 60);
    if (!allowed) return apiFailure("Too many checks in a minute. Try again shortly.", 429);

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return apiFailure("Expected a JSON object.", 400);
    const content = parseMemoryContent(body.content);
    if (typeof content !== "string") return apiFailure(content.error, 400);
    const disclosure = parseDisclosure(body.disclosure);
    if (!disclosure) return apiFailure("disclosure must be PUBLIC or GENERALIZE.", 400);

    return NextResponse.json(await checkMemory(content, disclosure));
  } catch (error) {
    return apiError(error, "Could not check that text");
  }
}

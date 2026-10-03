import type { BrandProfileInput } from "@/types";
import { resolveWriterExpertise } from "@/constants/writerExpertise";
import { parseArtStyle } from "@/lib/covers/artStyles";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const MAX_BYLINE_LENGTH = 120;
const COLOR_DEFAULTS = {
  primary_ink: "#0B0F14",
  brand_teal: "#00D4AA",
  brand_coral: "#FF6B4A",
  brand_cream: "#F5F7FA",
  accent_blue: "#7C8CFF",
} as const;

export function parseBrandProfileInput(body: JsonObject): BrandProfileInput {
  const brandName = asString(body.brand_name);
  if (!brandName) throw badRequest("brand_name is required");
  if (typeof body.positioning !== "string") throw badRequest("positioning must be a string");

  const colors = {} as Record<keyof typeof COLOR_DEFAULTS, string>;
  for (const field of Object.keys(COLOR_DEFAULTS) as (keyof typeof COLOR_DEFAULTS)[]) {
    const value = body[field];
    if (value && (typeof value !== "string" || !HEX_COLOR.test(value))) throw badRequest(`${field} must be a valid hex color like #12242A`);
    colors[field] = (value as string) || COLOR_DEFAULTS[field];
  }

  const coverArt = parseArtStyle(body.cover_art);
  return {
    brand_name: brandName,
    company_domain: asString(body.company_domain),
    positioning: body.positioning.trim(),
    primary_logo_url: asString(body.primary_logo_url),
    ...(typeof body.cover_byline === "string" ? { cover_byline: body.cover_byline.trim().slice(0, MAX_BYLINE_LENGTH) } : {}),
    ...(coverArt ? { cover_art: coverArt } : {}),
    ...colors,
    tone_formality: (body.tone_formality as string) || "Technical & Direct",
    tone_cadence: asString(body.tone_cadence),
    allowed_proof_claims: Array.isArray(body.allowed_proof_claims) ? body.allowed_proof_claims.map((claim) => String(claim).trim()).filter(Boolean) : [],
    writer_expertise: resolveWriterExpertise(body.writer_expertise),
  };
}

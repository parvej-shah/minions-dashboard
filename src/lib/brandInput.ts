import type { BrandProfileInput } from "@/types";
import { resolveWriterExpertise } from "@/constants/writerExpertise";
import { parseArtStyle } from "@/lib/covers/artStyles";
import { DEFAULT_COVER_THEME } from "@/lib/covers/themes";
import { asString, type JsonObject } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const MAX_BYLINE_LENGTH = 120;
const COLOR_DEFAULTS = {
  primary_ink: DEFAULT_COVER_THEME.primary_ink,
  brand_teal: DEFAULT_COVER_THEME.brand_teal,
  brand_coral: DEFAULT_COVER_THEME.brand_coral,
  brand_cream: DEFAULT_COVER_THEME.brand_cream,
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
    ...(typeof body.cover_cutout_url === "string" ? { cover_cutout_url: parseCutoutUrl(body.cover_cutout_url) } : {}),
    ...colors,
    tone_formality: (body.tone_formality as string) || "Technical & Direct",
    tone_cadence: asString(body.tone_cadence),
    allowed_proof_claims: Array.isArray(body.allowed_proof_claims) ? body.allowed_proof_claims.map((claim) => String(claim).trim()).filter(Boolean) : [],
    writer_expertise: resolveWriterExpertise(body.writer_expertise),
  };
}

/** An uploaded cut-out's https address, or empty to remove it. */
function parseCutoutUrl(value: string): string {
  const url = value.trim();
  if (url && !/^https:\/\/\S+$/.test(url)) throw badRequest("cover_cutout_url must be an https address");
  return url.slice(0, 1000);
}

import { NextResponse } from "next/server";
import { getBrandSettings, updateBrandSettings } from "@/services/brand";
import { apiError, apiFailure } from "@/lib/api-response";
import type { BrandProfileInput } from "@/types";

export async function GET() {
  try {
    return NextResponse.json(await getBrandSettings());
  } catch (error) {
    return apiError(error, "Failed to fetch brand settings");
  }
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const REQUIRED_STRING_FIELDS: (keyof BrandProfileInput)[] = [
  "brand_name",
  "company_domain",
  "positioning",
  "primary_logo_url",
  "tone_cadence",
];
const COLOR_FIELDS: (keyof BrandProfileInput)[] = [
  "primary_ink",
  "brand_teal",
  "brand_coral",
  "brand_cream",
  "accent_blue",
];
const TONE_FORMALITY_VALUES = ["technical_direct", "tactile_operator", "conversational_peer"];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    for (const field of REQUIRED_STRING_FIELDS) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return apiFailure(`${field} is required`, 400);
      }
    }
    for (const field of COLOR_FIELDS) {
      if (typeof body[field] !== "string" || !HEX_COLOR.test(body[field])) {
        return apiFailure(`${field} must be a hex color like #12242A`, 400);
      }
    }
    if (!TONE_FORMALITY_VALUES.includes(body.tone_formality)) {
      return apiFailure(`tone_formality must be one of ${TONE_FORMALITY_VALUES.join(", ")}`, 400);
    }
    if (!Array.isArray(body.allowed_proof_claims) || !body.allowed_proof_claims.every((c: unknown) => typeof c === "string")) {
      return apiFailure("allowed_proof_claims must be an array of strings", 400);
    }

    const input: BrandProfileInput = {
      brand_name: body.brand_name.trim(),
      company_domain: body.company_domain.trim(),
      positioning: body.positioning.trim(),
      primary_logo_url: body.primary_logo_url.trim(),
      primary_ink: body.primary_ink,
      brand_teal: body.brand_teal,
      brand_coral: body.brand_coral,
      brand_cream: body.brand_cream,
      accent_blue: body.accent_blue,
      tone_formality: body.tone_formality,
      tone_cadence: body.tone_cadence.trim(),
      allowed_proof_claims: body.allowed_proof_claims.map((c: string) => c.trim()).filter(Boolean),
    };

    return NextResponse.json(await updateBrandSettings(input));
  } catch (error) {
    return apiError(error, "Failed to update brand settings");
  }
}

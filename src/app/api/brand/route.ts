import { NextResponse } from "next/server";
import { getBrandSettings, updateBrandSettings } from "@/services/brand";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";
import type { BrandProfileInput } from "@/types";

export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    return NextResponse.json(await getBrandSettings(ctx.clientId));
  } catch (error) {
    return apiError(error, "Failed to fetch brand settings");
  }
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();

    if (!body.brand_name || typeof body.brand_name !== "string" || !body.brand_name.trim()) {
      return apiFailure("brand_name is required", 400);
    }
    if (typeof body.positioning !== "string") {
      return apiFailure("positioning must be a string", 400);
    }

    const COLOR_FIELDS: (keyof BrandProfileInput)[] = [
      "primary_ink",
      "brand_teal",
      "brand_coral",
      "brand_cream",
      "accent_blue",
    ];

    for (const field of COLOR_FIELDS) {
      if (body[field] && (typeof body[field] !== "string" || !HEX_COLOR.test(body[field]))) {
        return apiFailure(`${field} must be a valid hex color like #12242A`, 400);
      }
    }

    const input: BrandProfileInput = {
      brand_name: body.brand_name.trim(),
      company_domain: (body.company_domain || "").trim(),
      positioning: (body.positioning || "").trim(),
      primary_logo_url: (body.primary_logo_url || "").trim(),
      primary_ink: body.primary_ink || "#0B0F14",
      brand_teal: body.brand_teal || "#00D4AA",
      brand_coral: body.brand_coral || "#FF6B4A",
      brand_cream: body.brand_cream || "#F5F7FA",
      accent_blue: body.accent_blue || "#7C8CFF",
      tone_formality: body.tone_formality || "Technical & Direct",
      tone_cadence: (body.tone_cadence || "").trim(),
      allowed_proof_claims: Array.isArray(body.allowed_proof_claims)
        ? body.allowed_proof_claims.map((c: unknown) => String(c).trim()).filter(Boolean)
        : [],
    };

    return NextResponse.json(await updateBrandSettings(ctx.clientId, input));
  } catch (error) {
    return apiError(error, "Failed to update brand settings");
  }
}

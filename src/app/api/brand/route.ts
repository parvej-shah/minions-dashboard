import { NextResponse } from "next/server";
import { getBrandSettings } from "@/services/brand";
import { apiError } from "@/lib/api-response";

export async function GET() {
  try {
    return NextResponse.json(await getBrandSettings());
  } catch (error) {
    return apiError(error, "Failed to fetch brand settings");
  }
}

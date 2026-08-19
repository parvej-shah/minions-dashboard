import { NextResponse } from "next/server";
import { getPipelineFleet } from "@/services/agents";
import { apiError } from "@/lib/api-response";

export async function GET() {
  try {
    return NextResponse.json(await getPipelineFleet());
  } catch (error) {
    return apiError(error, "Failed to fetch agents");
  }
}

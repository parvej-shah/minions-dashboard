import { NextResponse } from "next/server";
import { fetchAgentFleet } from "@/lib/api";

export async function GET() {
  const fleet = await fetchAgentFleet();
  return NextResponse.json(fleet);
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, ...body, updated_at: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update agent fleet" }, { status: 500 });
  }
}

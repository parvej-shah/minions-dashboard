import { NextResponse } from "next/server";
import { fetchBrandSettings } from "@/lib/api";

export async function GET() {
  const brand = await fetchBrandSettings();
  return NextResponse.json(brand);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, ...body, updated_at: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update brand settings" }, { status: 500 });
  }
}

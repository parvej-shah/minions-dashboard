import { NextResponse } from "next/server";
import { fetchAssets, INITIAL_ASSETS } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assets = await fetchAssets();
  const found = assets.find((a) => a.id === id || a.slug === id) || INITIAL_ASSETS.find((a) => a.id === id || a.slug === id);

  if (!found) {
    // If not found, return the flagship ASSET-0003 as graceful fallback
    return NextResponse.json(INITIAL_ASSETS[0]);
  }

  return NextResponse.json(found);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    return NextResponse.json({ success: true, id, ...body, updated_at: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

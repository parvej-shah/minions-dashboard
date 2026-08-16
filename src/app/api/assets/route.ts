import { NextResponse } from "next/server";
import { fetchAssets, INITIAL_ASSETS } from "@/lib/api";

export async function GET() {
  const assets = await fetchAssets();
  return NextResponse.json(assets);
}

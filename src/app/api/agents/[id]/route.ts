import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      id,
      ...body,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

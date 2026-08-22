import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "linkedin_post_id" TEXT;
      ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "linkedin_published_at" TIMESTAMP(3);
    `);
    return NextResponse.json({ success: true, message: "Migration applied successfully: linkedin_post_id and linkedin_published_at added to assets table." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}

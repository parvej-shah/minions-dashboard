import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BrandDirectiveItem } from "@/lib/types";

function toItem(row: {
  id: string;
  category: string;
  ruleKey: string;
  instruction: string;
  priority: number;
  audienceScope: string;
  isActive: boolean;
  updatedAt: Date;
}): BrandDirectiveItem {
  return {
    id: row.id,
    category: row.category as BrandDirectiveItem["category"],
    key: row.ruleKey,
    content: row.instruction,
    priority: row.priority as 1 | 2 | 3,
    audience_scope: row.audienceScope as BrandDirectiveItem["audience_scope"],
    is_active: row.isActive,
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const rows = await prisma.brandDirective.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(rows.map(toItem));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.category || !body.key || !body.content) {
      return NextResponse.json(
        { error: "category, key, and content are required" },
        { status: 400 }
      );
    }

    const count = await prisma.brandDirective.count();
    const id = `DIR-${String(count + 1).padStart(3, "0")}`;

    const created = await prisma.brandDirective.create({
      data: {
        id,
        category: body.category,
        ruleKey: String(body.key).toLowerCase().replace(/\s+/g, "_"),
        instruction: body.content,
        priority: body.priority || 1,
        audienceScope: body.audience_scope || "ALL",
        isActive: true,
      },
    });

    return NextResponse.json(toItem(created), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

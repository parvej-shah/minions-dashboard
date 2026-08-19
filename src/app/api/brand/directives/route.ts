import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDirectiveDTO } from "@/lib/mappers/directive";
import { apiError, apiFailure } from "@/lib/api-response";

export async function GET() {
  try {
    const rows = await prisma.brandDirective.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json(rows.map(toDirectiveDTO));
  } catch (error) {
    return apiError(error, "Failed to fetch brand directives");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.category || !body.key || !body.content) {
      return apiFailure("category, key, and content are required", 400);
    }

    const count = await prisma.brandDirective.count();

    const created = await prisma.brandDirective.create({
      data: {
        id: `DIR-${String(count + 1).padStart(3, "0")}`,
        category: body.category,
        ruleKey: String(body.key).toLowerCase().replace(/\s+/g, "_"),
        instruction: body.content,
        priority: body.priority || 1,
        audienceScope: body.audience_scope || "ALL",
        isActive: true,
      },
    });

    return NextResponse.json(toDirectiveDTO(created), { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create brand directive");
  }
}

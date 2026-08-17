import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSecret } from "@/lib/security";

export async function POST(request: Request) {
  const authCheck = verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) {
    return authCheck.response;
  }

  try {
    const body = await request.json();
    const assetId = body.assetId || body.id;

    if (assetId) {
      await prisma.asset.updateMany({
        where: { id: assetId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          publishedUrls: JSON.stringify(body.posts || [])
        }
      });
    }

    // If blog post payload included, ensure blog record exists
    if (body.blog || body.slug) {
      const slug = body.slug || body.blog?.slug;
      if (slug) {
        await prisma.blog.upsert({
          where: { slug },
          update: {
            title: body.title || body.blog?.title,
            content: body.content || body.blog?.content,
            publishedAt: new Date()
          },
          create: {
            slug,
            title: body.title || body.blog?.title || "Untitled Post",
            subtitle: body.subtitle || body.hook || "",
            hook: body.hook || "",
            coreArgument: body.core_argument || "",
            content: body.content || body.blog?.content || "",
            audience: body.audience || "ICP",
            pillar: body.pillar || "Contractor Realities",
            author: body.author || { name: "Minions Editorial Staff", role: "AI Operations Partner" },
            tags: body.tags || [],
            metaDescription: body.meta_description || body.hook || "",
            readingTimeMinutes: body.reading_time_minutes || 4,
            assetId: assetId || null,
            publishedAt: new Date()
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Asset marked as published and synchronized" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

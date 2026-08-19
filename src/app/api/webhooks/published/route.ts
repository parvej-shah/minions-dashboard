import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
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

    // `published_urls` is read back with a comma split (see mappers/asset.ts).
    // This used to store a JSON array string, which that split then tore into
    // fragments like `["https://a"`. Normalise on the comma form on write.
    const postUrls: string[] = Array.isArray(body.posts)
      ? body.posts
          .map((post: unknown) =>
            typeof post === "string"
              ? post
              : typeof post === "object" && post !== null && "url" in post
                ? String((post as { url: unknown }).url)
                : ""
          )
          .filter(Boolean)
      : [];

    let assetUpdated = 0;
    if (assetId) {
      const { count } = await prisma.asset.updateMany({
        where: { id: assetId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          publishedUrls: postUrls.length > 0 ? postUrls.join(",") : null,
        },
      });
      assetUpdated = count;
    }

    // If blog post payload included, ensure blog record exists
    let blogAction: "created" | "updated" | "reslugged" | "none" = "none";
    if (body.blog || body.slug) {
      const slug = body.slug || body.blog?.slug;
      if (slug) {
        // `slug` is the blog primary key, so an upsert keyed on it alone would
        // create a SECOND row whenever a republish changes the title-derived
        // slug — two live posts for one asset. Rebind the asset's existing row
        // instead, so one asset always maps to exactly one blog post.
        const existingForAsset = assetId
          ? await prisma.blog.findFirst({ where: { assetId } })
          : null;

        if (existingForAsset && existingForAsset.slug !== slug) {
          await prisma.blog.update({
            where: { slug: existingForAsset.slug },
            data: {
              slug,
              title: body.title || body.blog?.title || existingForAsset.title,
              content: body.content || body.blog?.content || existingForAsset.content,
              publishedAt: new Date(),
            },
          });
          blogAction = "reslugged";
        } else {
          const existing = await prisma.blog.findUnique({
            where: { slug },
            select: { slug: true },
          });
          blogAction = existing ? "updated" : "created";
          await prisma.blog.upsert({
            where: { slug },
            update: {
              title: body.title || body.blog?.title,
              content: body.content || body.blog?.content,
              // Backfills the link on a row that predates asset attribution,
              // which is what leaves orphan posts the cockpit cannot match.
              assetId: assetId || undefined,
              publishedAt: new Date(),
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
              author: body.author || {
                name: "Minions Editorial Staff",
                role: "AI Operations Partner",
              },
              tags: body.tags || [],
              metaDescription: body.meta_description || body.hook || "",
              readingTimeMinutes: body.reading_time_minutes || 4,
              assetId: assetId || null,
              publishedAt: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Asset marked as published and synchronized",
      // Reported so a run that silently matched no asset is visible in n8n
      // rather than looking like a success.
      asset_id: assetId ?? null,
      asset_updated: assetUpdated,
      blog: blogAction,
    });
  } catch (error) {
    return apiError(error, "Webhook processing failed");
  }
}

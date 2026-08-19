import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DISTRIBUTION_CHANNELS,
  findChannelById,
  findChannelByKey,
} from "@/constants/channels";
import { apiError, apiFailure } from "@/lib/api-response";
import type { DistributionChannelConfig, DistributionChannelsPayload } from "@/types";

export async function GET() {
  try {
    const existing = await prisma.brandDirective.findMany({
      where: { category: "DISTRIBUTION" },
    });
    const byId = new Map(existing.map((row) => [row.id, row]));

    // Seed any missing default channel directive
    for (const def of DISTRIBUTION_CHANNELS) {
      if (!byId.has(def.id)) {
        byId.set(
          def.id,
          await prisma.brandDirective.create({
            data: {
              id: def.id,
              category: "DISTRIBUTION",
              ruleKey: def.ruleKey,
              instruction: def.description,
              priority: 1,
              audienceScope: "ALL",
              isActive: def.defaultActive,
            },
          })
        );
      }
    }

    const channels: DistributionChannelConfig[] = DISTRIBUTION_CHANNELS.map((def) => ({
      id: def.id,
      key: def.key,
      name: def.name,
      platform: def.platform,
      description: def.description,
      is_active: byId.get(def.id)?.isActive ?? def.defaultActive,
      target_destination: def.target_destination,
      badge: def.badge,
    }));

    const payload: DistributionChannelsPayload = {
      channels,
      summary: {
        blog: channels.find((c) => c.key === "blog")?.is_active ?? true,
        facebook: channels.find((c) => c.key === "facebook")?.is_active ?? true,
        linkedin: channels.find((c) => c.key === "linkedin")?.is_active ?? false,
        x: channels.find((c) => c.key === "x")?.is_active ?? false,
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    return apiError(error, "Failed to fetch channel directives");
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, channel, is_active } = await request.json();
    const targetId: string | undefined = id ?? (channel ? findChannelByKey(channel)?.id : undefined);

    if (!targetId || typeof is_active !== "boolean") {
      return apiFailure("Valid 'id' or 'channel' and boolean 'is_active' required.", 400);
    }

    const def = findChannelById(targetId);
    const updated = await prisma.brandDirective.upsert({
      where: { id: targetId },
      update: { isActive: is_active },
      create: {
        id: targetId,
        category: "DISTRIBUTION",
        ruleKey: def?.ruleKey ?? targetId,
        instruction: def?.description ?? "Channel broadcast directive",
        priority: 1,
        audienceScope: "ALL",
        isActive: is_active,
      },
    });

    return NextResponse.json({
      success: true,
      id: updated.id,
      is_active: updated.isActive,
      rule_key: updated.ruleKey,
    });
  } catch (error) {
    return apiError(error, "Failed to update channel directive");
  }
}

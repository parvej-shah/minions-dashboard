import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DISTRIBUTION_CHANNELS,
  findChannelById,
  findChannelByKey,
} from "@/constants/channels";
import { apiError, apiFailure } from "@/server/http/respond";
import { requireClientId } from "@/lib/tenant";
import type { DistributionChannelConfig, DistributionChannelsPayload } from "@/types";
import type { ClientChannel } from "@prisma/client";

/**
 * Per-tenant, not the catalogue's static copy -- DISTRIBUTION_CHANNELS used
 * to be served verbatim here, which meant every tenant's channel cards
 * showed getminions.ai's own blog/social handles ("facebook.com/
 * getminionsai") regardless of whose tenant it was. Blog has no readable
 * destination to show even once connected (the webhook URL is vaulted, not
 * stored in Postgres), so this only ever distinguishes "connected" from
 * "not yet."
 */
function targetDestinationFor(key: string, row: ClientChannel | undefined): string {
  if (key === "blog") {
    return row?.credentialRef ? "Your own site (connected)" : "Shared hosted blog";
  }
  if (row?.externalId) return `Connected (${row.externalId})`;
  return row?.credentialRef ? "Connected" : "Not connected yet";
}

/**
 * Distribution channels, one `client_channels` row per (tenant, channel).
 *
 * This used to be `brand_directives` rows with category "DISTRIBUTION" and a
 * fixed global id per channel (e.g. "DIR-DIST-BLOG") — fine for one tenant,
 * but every tenant would collide on the same primary key once more than one
 * existed. `ClientChannel` is unique on (client_id, channel_key) instead, so
 * each tenant gets its own row per channel with no shared id.
 */
export async function GET() {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const existing = await prisma.clientChannel.findMany({
      where: { clientId: ctx.clientId },
    });
    const byKey = new Map(existing.map((row) => [row.channelKey, row]));

    // Seed any missing default channel row for this tenant.
    for (const def of DISTRIBUTION_CHANNELS) {
      if (!byKey.has(def.key)) {
        byKey.set(
          def.key,
          await prisma.clientChannel.create({
            data: {
              clientId: ctx.clientId,
              channelKey: def.key,
              isActive: def.defaultActive,
            },
          })
        );
      }
    }

    const channels: DistributionChannelConfig[] = DISTRIBUTION_CHANNELS.map((def) => {
      const row = byKey.get(def.key);
      return {
        id: def.id,
        key: def.key,
        name: def.name,
        platform: def.platform,
        description: def.description,
        is_active: row?.isActive ?? def.defaultActive,
        target_destination: targetDestinationFor(def.key, row),
        badge: def.badge,
        has_credential: !!row?.credentialRef,
        external_id: row?.externalId ?? null,
      };
    });

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
    return apiError(error, "Failed to fetch channel settings");
  }
}

export async function PATCH(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { id, channel, is_active } = await request.json();
    // The DistributionControlPanel UI sends the old-style `id` (e.g.
    // "DIR-DIST-BLOG"); newer/direct callers can send `channel` (the key,
    // e.g. "blog") instead. Either resolves to the same channel definition.
    const def = channel ? findChannelByKey(channel) : id ? findChannelById(id) : undefined;

    if (!def || typeof is_active !== "boolean") {
      return apiFailure("Valid 'id' or 'channel', and boolean 'is_active', required.", 400);
    }

    const updated = await prisma.clientChannel.upsert({
      where: { clientId_channelKey: { clientId: ctx.clientId, channelKey: def.key } },
      update: { isActive: is_active },
      create: { clientId: ctx.clientId, channelKey: def.key, isActive: is_active },
    });

    return NextResponse.json({
      success: true,
      id: def.id,
      is_active: updated.isActive,
      channel: updated.channelKey,
    });
  } catch (error) {
    return apiError(error, "Failed to update channel setting");
  }
}

export async function DELETE(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const { channel } = await request.json();
    const def = findChannelByKey(channel);

    if (!def) {
      return apiFailure("Valid 'channel' key required.", 400);
    }

    await prisma.clientChannel.upsert({
      where: { clientId_channelKey: { clientId: ctx.clientId, channelKey: def.key } },
      update: { isActive: false, credentialRef: null, externalId: null },
      create: { clientId: ctx.clientId, channelKey: def.key, isActive: false, credentialRef: null, externalId: null },
    });

    return NextResponse.json({
      success: true,
      channel: def.key,
      disconnected: true,
    });
  } catch (error) {
    return apiError(error, "Failed to disconnect channel");
  }
}

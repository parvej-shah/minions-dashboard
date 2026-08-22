import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireClientId } from "@/lib/tenant";

/**
 * Manual channel-token entry: a client pastes their own Facebook/LinkedIn
 * access token directly, rather than an OAuth "Connect Facebook" popup.
 * Standing in for OAuth until we have verified Facebook/LinkedIn developer
 * apps (OAuth needs a registered app + redirect URI before any client can
 * click "Connect"; a pasted token needs neither). The token itself is never
 * stored in Postgres — it's written into Supabase Vault (see
 * phase3_vault_setup.sql) and only the vault secret id is kept, as
 * ClientChannel.credentialRef.
 */
export async function POST(request: Request) {
  const ctx = await requireClientId();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();
    const channel = (body.channel || "").toString().trim();
    const token = (body.token || "").toString().trim();
    const externalId = (body.external_id || "").toString().trim() || null;

    if (!["facebook", "linkedin", "x"].includes(channel)) {
      return apiFailure("channel must be one of: facebook, linkedin, x", 400);
    }
    if (!token) {
      return apiFailure("token is required", 400);
    }

    const { data: secretId, error } = await getSupabaseAdmin().rpc("create_channel_secret", {
      secret: token,
      name: `${ctx.clientId}:${channel}`,
    });
    if (error) throw new Error(error.message);

    await prisma.clientChannel.upsert({
      where: { clientId_channelKey: { clientId: ctx.clientId, channelKey: channel } },
      update: { isActive: true, credentialRef: secretId, externalId },
      create: { clientId: ctx.clientId, channelKey: channel, isActive: true, credentialRef: secretId, externalId },
    });

    return NextResponse.json({ success: true, channel });
  } catch (error) {
    return apiError(error, "Failed to store channel token");
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { apiError, apiFailure } from "@/lib/api-response";
import { requireRealTenantUser } from "@/lib/tenant";

/**
 * Manual channel-token entry: a client pastes their own Facebook/LinkedIn
 * access token directly, rather than an OAuth "Connect Facebook" popup.
 * Standing in for OAuth until we have verified Facebook/LinkedIn developer
 * apps (OAuth needs a registered app + redirect URI before any client can
 * click "Connect"; a pasted token needs neither). The token itself is never
 * stored in Postgres — it's written into Supabase Vault (see
 * phase3_vault_setup.sql) and only the vault secret id is kept, as
 * ClientChannel.credentialRef.
 *
 * For channel="blog", "token" holds a webhook URL instead of an access
 * token: 03_review_publisher POSTs the published asset there directly
 * (their WordPress site, Zapier/Make hook, custom endpoint, etc.) instead
 * of writing into our own hosted blogs table, so their content lands on
 * their own domain, not ours.
 */
export async function POST(request: Request) {
  const ctx = await requireRealTenantUser();
  if ("error" in ctx) return ctx.error;

  try {
    const body = await request.json();
    const channel = (body.channel || "").toString().trim();
    const token = (body.token || "").toString().trim();
    let externalId = (body.external_id || "").toString().trim() || null;
    if (channel === "linkedin" && externalId && !externalId.startsWith("urn:li:")) {
      externalId = `urn:li:person:${externalId}`;
    }

    if (!["facebook", "linkedin", "x", "blog"].includes(channel)) {
      return apiFailure("channel must be one of: facebook, linkedin, x, blog", 400);
    }
    if (!token) {
      return apiFailure(channel === "blog" ? "webhook URL is required" : "token is required", 400);
    }
    if (channel === "blog" && !/^https:\/\/.+/.test(token)) {
      return apiFailure("webhook URL must start with https://", 400);
    }

    const { data: secretId, error } = await getSupabaseAdmin().rpc("create_channel_secret", {
      secret: token,
      name: `${ctx.clientId}:${channel}:${Date.now()}`,
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { apiError, apiFailure } from "@/server/http/respond";
import { verifyWebhookSecret } from "@/lib/security";
import { postGoesTo } from "@/constants/postChannels";

/**
 * Resolves a tenant's channel credential for n8n's publish nodes.
 *
 * `ClientChannel.credentialRef` is a Supabase Vault secret id (see
 * phase3_vault_setup.sql), never a raw token. When it's unset, `token` comes
 * back `null` — n8n falls back to its own single shared credential in that
 * case (only tenant-zero should ever hit this, since it's the only tenant
 * predating per-tenant credentials). Same server-to-server auth as
 * /api/brand/context: gated by proxy.ts's webhook-secret check, not a
 * session, since the caller is n8n.
 */
export async function GET(request: Request) {
  const authCheck = await verifyWebhookSecret(request);
  if (!authCheck.isValid && authCheck.response) return authCheck.response;

  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");
  const channel = url.searchParams.get("channel");
  const assetId = url.searchParams.get("assetId");
  if (!clientId || !channel) {
    return apiFailure("clientId and channel query params are required", 400);
  }

  try {
    // D18: a post can be kept off a channel the workspace has on. 03 passes the
    // asset; its override answers "not active" for that post, with no token.
    if (assetId) {
      const asset = await prisma.asset.findFirst({ where: { id: assetId, clientId }, select: { channels: true } });
      if (asset && !postGoesTo(asset.channels, channel)) {
        return NextResponse.json({ is_active: false, external_id: null, token: null, post_excluded: true });
      }
    }

    const channelRow = await prisma.clientChannel.findUnique({
      where: { clientId_channelKey: { clientId, channelKey: channel } },
      select: { isActive: true, credentialRef: true, externalId: true },
    });

    if (!channelRow || !channelRow.credentialRef) {
      return NextResponse.json({
        is_active: channelRow?.isActive ?? false,
        external_id: channelRow?.externalId ?? null,
        token: null,
      });
    }

    const { data, error } = await getSupabaseAdmin().rpc("get_channel_secret", {
      secret_id: channelRow.credentialRef,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({
      is_active: channelRow.isActive,
      external_id: channelRow.externalId,
      token: data ?? null,
    });
  } catch (error) {
    return apiError(error, "Failed to resolve channel credential");
  }
}

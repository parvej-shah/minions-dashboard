import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { postGoesTo } from "@/constants/postChannels";

// credentialRef is a Supabase Vault secret id, never a raw token. Without one, `token` is null and
// n8n falls back to its single shared credential (only tenant-zero predates per-tenant credentials).
export async function resolveChannelCredential(clientId: string, channel: string, assetId: string | null) {
  if (assetId) {
    const asset = await prisma.asset.findFirst({ where: { id: assetId, clientId }, select: { channels: true } });
    if (asset && !postGoesTo(asset.channels, channel)) {
      return { is_active: false, external_id: null, token: null, post_excluded: true };
    }
  }

  const row = await prisma.clientChannel.findUnique({
    where: { clientId_channelKey: { clientId, channelKey: channel } },
    select: { isActive: true, credentialRef: true, externalId: true },
  });
  if (!row?.credentialRef) {
    return { is_active: row?.isActive ?? false, external_id: row?.externalId ?? null, token: null };
  }

  const { data, error } = await getSupabaseAdmin().rpc("get_channel_secret", { secret_id: row.credentialRef });
  if (error) throw new Error(error.message);
  return { is_active: row.isActive, external_id: row.externalId, token: data ?? null };
}

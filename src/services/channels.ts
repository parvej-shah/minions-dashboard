import type { ClientChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { postGoesTo } from "@/constants/postChannels";
import { DISTRIBUTION_CHANNELS, findChannelById, findChannelByKey } from "@/constants/channels";
import type { DistributionChannelConfig, DistributionChannelsPayload } from "@/types";
import type { JsonObject } from "@/server/http/body";
import { asString } from "@/server/http/body";
import { badRequest } from "@/server/http/errors";
import { metaGraph, type GraphCall } from "@/lib/metaGraph";

// The blog's webhook URL is vaulted, not stored in Postgres, so a connected blog has no readable destination.
function targetDestinationFor(key: string, row: ClientChannel | undefined): string {
  if (key === "blog") return row?.credentialRef ? "Your own site (connected)" : "Your Minions-hosted blog";
  // The id itself (a LinkedIn URN, a Page id) means nothing to the owner; what it points at does.
  if (row?.externalId) return row.externalId.startsWith("urn:li:organization:") ? "Connected to your company page" : key === "linkedin" ? "Connected to your profile" : "Connected";
  return row?.credentialRef ? "Connected" : "Not connected yet";
}

export async function getChannelSettings(clientId: string): Promise<DistributionChannelsPayload> {
  const rows = new Map((await prisma.clientChannel.findMany({ where: { clientId } })).map((row) => [row.channelKey, row]));

  for (const def of DISTRIBUTION_CHANNELS.filter((candidate) => !rows.has(candidate.key))) {
    rows.set(def.key, await prisma.clientChannel.create({ data: { clientId, channelKey: def.key, isActive: def.defaultActive } }));
  }

  const channels: DistributionChannelConfig[] = DISTRIBUTION_CHANNELS.map((def) => {
    const row = rows.get(def.key);
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

  const isActive = (key: string, fallback: boolean) => channels.find((channel) => channel.key === key)?.is_active ?? fallback;
  return {
    channels,
    summary: { blog: isActive("blog", true), facebook: isActive("facebook", true), linkedin: isActive("linkedin", false), instagram: isActive("instagram", false), x: isActive("x", false) },
  };
}

export async function setChannelActive(clientId: string, body: JsonObject) {
  const { id, channel, is_active } = body;
  const def = channel ? findChannelByKey(channel as string) : id ? findChannelById(id as string) : undefined;
  if (!def || typeof is_active !== "boolean") throw badRequest("Valid 'id' or 'channel', and boolean 'is_active', required.");

  const updated = await prisma.clientChannel.upsert({
    where: { clientId_channelKey: { clientId, channelKey: def.key } },
    update: { isActive: is_active },
    create: { clientId, channelKey: def.key, isActive: is_active },
  });
  return { success: true, id: def.id, is_active: updated.isActive, channel: updated.channelKey };
}

export async function disconnectChannel(clientId: string, body: JsonObject) {
  const def = findChannelByKey(body.channel as string);
  if (!def) throw badRequest("Valid 'channel' key required.");

  const cleared = { isActive: false, credentialRef: null, externalId: null };
  await prisma.clientChannel.upsert({
    where: { clientId_channelKey: { clientId, channelKey: def.key } },
    update: cleared,
    create: { clientId, channelKey: def.key, ...cleared },
  });
  return { success: true, channel: def.key, disconnected: true };
}

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

  return { is_active: row.isActive, external_id: row.externalId, token: await readChannelToken(row.credentialRef) };
}

export async function readChannelToken(credentialRef: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin().rpc("get_channel_secret", { secret_id: credentialRef });
  if (error) throw new Error(error.message);
  return data ?? null;
}

// The token lives in Supabase Vault; Postgres keeps only the vault secret id as credentialRef.
export async function storeChannelCredential(clientId: string, channelKey: string, token: string, externalId: string | null) {
  const { data: secretId, error } = await getSupabaseAdmin().rpc("create_channel_secret", {
    secret: token,
    name: `${clientId}:${channelKey}:${Date.now()}`,
  });
  if (error) throw new Error(error.message);

  const connected = { isActive: true, credentialRef: secretId, externalId };
  await prisma.clientChannel.upsert({
    where: { clientId_channelKey: { clientId, channelKey } },
    update: connected,
    create: { clientId, channelKey, ...connected },
  });
}

export const clearChannelCredential = (clientId: string, channelKey: string) =>
  prisma.clientChannel.update({
    where: { clientId_channelKey: { clientId, channelKey } },
    data: { isActive: false, credentialRef: null, externalId: null },
  });

const MANUAL_TOKEN_CHANNELS = ["facebook", "linkedin", "x", "blog"];

// A pasted token stands in for OAuth until the Facebook and LinkedIn developer apps are verified.
// For "blog" the token is a webhook URL: 03_review_publisher posts the asset there instead of writing to our hosted blogs table.
export async function connectManualChannel(clientId: string, body: JsonObject) {
  const channel = asString(body.channel);
  const token = asString(body.token);
  let externalId = asString(body.external_id) || null;
  if (channel === "linkedin" && externalId && !externalId.startsWith("urn:li:")) externalId = `urn:li:person:${externalId}`;

  if (!MANUAL_TOKEN_CHANNELS.includes(channel)) throw badRequest(`channel must be one of: ${MANUAL_TOKEN_CHANNELS.join(", ")}`);
  if (!token) throw badRequest(channel === "blog" ? "webhook URL is required" : "token is required");
  if (channel === "blog" && !/^https:\/\/.+/.test(token)) throw badRequest("webhook URL must start with https://");

  await storeChannelCredential(clientId, channel, token, externalId);
  return { success: true, channel };
}

/**
 * Instagram posts through the Facebook Page's token: Meta lets a Page token publish to the
 * Instagram professional account linked to that Page. So connecting Instagram copies the
 * vaulted Page token into a vault secret of its own and records the linked account's id.
 */
export async function connectInstagram(clientId: string, deps: { graph?: GraphCall } = {}) {
  const graph = deps.graph ?? metaGraph;
  const fb = await prisma.clientChannel.findUnique({
    where: { clientId_channelKey: { clientId, channelKey: "facebook" } },
    select: { credentialRef: true, externalId: true },
  });
  const token = fb?.credentialRef && fb.externalId ? await readChannelToken(fb.credentialRef) : null;
  if (!token || !fb?.externalId) throw badRequest("Connect your Facebook Page first. Instagram posts through it.");

  const page = await graph(fb.externalId, { fields: "instagram_business_account{id,username}", access_token: token }, "GET");
  const ig = page.instagram_business_account as { id?: string; username?: string } | undefined;
  if (!ig?.id) {
    throw badRequest("No Instagram professional account is linked to this Facebook Page. Switch Instagram to a professional account and link it to the Page, then try again.");
  }

  await storeChannelCredential(clientId, "instagram", token, ig.id);
  return { success: true, channel: "instagram", username: ig.username ?? null };
}

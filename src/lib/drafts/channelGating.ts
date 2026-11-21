import type { DistributionChannelConfig, DistributionChannelKey } from "@/types";
import { postGoesTo } from "@/constants/postChannels";

export interface RequiredChannel {
  key: DistributionChannelKey;
  name: string;
  actionLabel: string;
}

const SOCIAL_CHANNEL_ORDER: readonly DistributionChannelKey[] = ["linkedin", "facebook", "instagram", "x"];

const CHANNEL_DISPLAY_NAMES: Record<DistributionChannelKey, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  blog: "Blog",
  x: "X",
};

/**
 * Returns the channel that must be connected before this post can be approved/posted,
 * or null if at least one target social channel is connected (or if the post only targets blog).
 */
export function getMissingPostChannel(
  asset: { channels?: string[] | null; follow_up_of?: string | null } | null | undefined,
  channelConfigs: DistributionChannelConfig[] | null | undefined,
  workspaceSummary: Record<DistributionChannelKey, boolean> | null | undefined
): RequiredChannel | null {
  if (!asset || !channelConfigs) return null;

  // 1. Determine which channels this post is targeted to
  let targets: DistributionChannelKey[];
  if (asset.follow_up_of) {
    targets = ["linkedin"];
  } else if (asset.channels && asset.channels.length > 0) {
    targets = asset.channels as DistributionChannelKey[];
  } else if (workspaceSummary) {
    targets = (Object.keys(workspaceSummary) as DistributionChannelKey[]).filter(
      (k) => workspaceSummary[k] && postGoesTo(null, k)
    );
  } else {
    targets = ["linkedin"];
  }

  // 2. Filter to social channels that require credentials / connection
  const socialTargets = targets.filter((k) => k !== "blog" && SOCIAL_CHANNEL_ORDER.includes(k));

  // If the post only targets blog, no social connection is required
  if (socialTargets.length === 0) return null;

  // 3. Find configs for the target social channels
  const configMap = new Map<DistributionChannelKey, DistributionChannelConfig>();
  for (const conf of channelConfigs) {
    configMap.set(conf.key, conf);
  }

  // Check if at least one target social channel is connected and healthy
  const hasConnectedSocial = socialTargets.some((k) => {
    const conf = configMap.get(k);
    if (!conf) return false;
    const hasCred = Boolean(conf.has_credential);
    const isExpired = Boolean(conf.is_expired);
    return hasCred && !isExpired;
  });

  if (hasConnectedSocial) return null;

  // 4. If none are connected, pick the primary channel to prompt the user to connect
  // Priority: LinkedIn > Facebook > Instagram > first in socialTargets
  const chosenKey: DistributionChannelKey =
    socialTargets.find((k) => k === "linkedin") ||
    socialTargets.find((k) => k === "facebook") ||
    socialTargets.find((k) => k === "instagram") ||
    socialTargets[0];

  const conf = configMap.get(chosenKey);
  const isExpired = Boolean(conf?.is_expired);
  const channelName = CHANNEL_DISPLAY_NAMES[chosenKey] || "channel";

  return {
    key: chosenKey,
    name: channelName,
    actionLabel: isExpired ? `Reconnect ${channelName} to post` : `Connect ${channelName} to post`,
  };
}

export type DistributionChannelKey = "blog" | "facebook" | "linkedin" | "x";

export type DistributionPlatform = "BLOG" | "FACEBOOK" | "LINKEDIN" | "TWITTER";

export interface DistributionChannelConfig {
  id: string;
  key: DistributionChannelKey;
  name: string;
  platform: DistributionPlatform;
  description: string;
  is_active: boolean;
  target_destination: string;
  badge?: string;
}

export interface DistributionChannelsPayload {
  channels: DistributionChannelConfig[];
  summary: Record<DistributionChannelKey, boolean>;
}

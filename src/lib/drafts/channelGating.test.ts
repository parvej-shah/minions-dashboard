import { describe, expect, it } from "vitest";
import { getMissingPostChannel } from "./channelGating";
import type { DistributionChannelConfig, DistributionChannelKey, DistributionPlatform } from "@/types";

function channel(
  key: DistributionChannelKey,
  has_credential: boolean = false,
  is_active: boolean = true,
  is_expired: boolean = false
): DistributionChannelConfig {
  const names: Record<DistributionChannelKey, string> = {
    blog: "Blog",
    facebook: "Facebook Page",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    x: "X (Twitter)",
  };
  const platformMap: Record<DistributionChannelKey, DistributionPlatform> = {
    blog: "BLOG",
    facebook: "FACEBOOK",
    instagram: "INSTAGRAM",
    linkedin: "LINKEDIN",
    x: "TWITTER",
  };
  return {
    id: `ch-${key}`,
    key,
    name: names[key],
    platform: platformMap[key],
    description: "",
    is_active,
    target_destination: has_credential ? "Connected" : "Not connected yet",
    has_credential,
    ...(is_expired ? { is_expired: true } : {}),
  };
}

describe("getMissingPostChannel (Option B gating)", () => {
  const defaultSummary: Record<DistributionChannelKey, boolean> = {
    blog: true,
    facebook: false,
    instagram: false,
    linkedin: true,
    x: false,
  };

  it("returns null while channel data is loading or asset is null", () => {
    expect(getMissingPostChannel(null, [], defaultSummary)).toBeNull();
    expect(getMissingPostChannel({ channels: null }, null, defaultSummary)).toBeNull();
    expect(getMissingPostChannel({ channels: null }, undefined, defaultSummary)).toBeNull();
  });

  it("returns Connect LinkedIn to post when post targets LinkedIn and LinkedIn is not connected", () => {
    const configs = [channel("linkedin", false), channel("blog", true)];
    const result = getMissingPostChannel({ channels: ["linkedin"] }, configs, defaultSummary);
    expect(result).toEqual({
      key: "linkedin",
      name: "LinkedIn",
      actionLabel: "Connect LinkedIn to post",
    });
  });

  it("returns null when post targets LinkedIn and LinkedIn is connected", () => {
    const configs = [channel("linkedin", true), channel("blog", true)];
    const result = getMissingPostChannel({ channels: ["linkedin"] }, configs, defaultSummary);
    expect(result).toBeNull();
  });

  it("returns Reconnect LinkedIn to post when LinkedIn credential has expired", () => {
    const configs = [channel("linkedin", true, true, true), channel("blog", true)];
    const result = getMissingPostChannel({ channels: ["linkedin"] }, configs, defaultSummary);
    expect(result).toEqual({
      key: "linkedin",
      name: "LinkedIn",
      actionLabel: "Reconnect LinkedIn to post",
    });
  });

  it("always targets LinkedIn for follow-up posts", () => {
    const configs = [channel("linkedin", false), channel("facebook", true)];
    const result = getMissingPostChannel({ follow_up_of: "parent-id", channels: ["facebook"] }, configs, defaultSummary);
    expect(result).toEqual({
      key: "linkedin",
      name: "LinkedIn",
      actionLabel: "Connect LinkedIn to post",
    });
  });

  it("returns null if the post targets only blog", () => {
    const configs = [channel("linkedin", false), channel("blog", true)];
    const result = getMissingPostChannel({ channels: ["blog"] }, configs, defaultSummary);
    expect(result).toBeNull();
  });

  it("returns Connect Facebook to post when post targets Facebook only and Facebook is not connected", () => {
    const configs = [channel("facebook", false), channel("blog", true)];
    const result = getMissingPostChannel({ channels: ["facebook"] }, configs, { ...defaultSummary, facebook: true, linkedin: false });
    expect(result).toEqual({
      key: "facebook",
      name: "Facebook",
      actionLabel: "Connect Facebook to post",
    });
  });

  it("returns null if at least one social destination channel is connected", () => {
    const configs = [channel("linkedin", true), channel("facebook", false)];
    const result = getMissingPostChannel({ channels: ["linkedin", "facebook"] }, configs, defaultSummary);
    expect(result).toBeNull();
  });

  it("prioritizes LinkedIn when multiple targeted social channels are all unconnected", () => {
    const configs = [channel("facebook", false), channel("linkedin", false)];
    const result = getMissingPostChannel({ channels: ["facebook", "linkedin"] }, configs, defaultSummary);
    expect(result).toEqual({
      key: "linkedin",
      name: "LinkedIn",
      actionLabel: "Connect LinkedIn to post",
    });
  });

  it("uses workspaceSummary when post channels override is empty or null", () => {
    const configs = [channel("linkedin", false), channel("facebook", false), channel("blog", true)];
    const summary: Record<DistributionChannelKey, boolean> = {
      blog: true,
      facebook: false,
      instagram: false,
      linkedin: true,
      x: false,
    };
    const result = getMissingPostChannel({ channels: null }, configs, summary);
    expect(result).toEqual({
      key: "linkedin",
      name: "LinkedIn",
      actionLabel: "Connect LinkedIn to post",
    });
  });
});

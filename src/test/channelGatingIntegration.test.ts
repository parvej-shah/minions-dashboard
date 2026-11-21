import fs from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => fs.readFileSync(p, "utf8");

describe("Channel Gating & Post Button Enforced Connection (Task 118)", () => {
  const reviewDecision = read("src/components/editorial/ReviewDecision.tsx");
  const editorialStudio = read("src/components/editorial/EditorialStudio.tsx");
  const linkedInModal = read("src/components/distribution/LinkedInModal.tsx");
  const todayView = read("src/components/today/TodayView.tsx");

  it("ReviewDecision imports getMissingPostChannel helper", () => {
    expect(reviewDecision).toContain("getMissingPostChannel");
  });

  it("ReviewDecision supports channelConfigs and onConnectChannel in props", () => {
    expect(reviewDecision).toMatch(/channelConfigs\??:\s*DistributionChannelConfig\[\]/);
    expect(reviewDecision).toMatch(/onConnectChannel\??:\s*\(channelKey:\s*string\)\s*=>\s*void/);
  });

  it("ReviewDecision shows Option B connect button and suppresses Post now instead when channel is missing", () => {
    // Primary button takes missingChannel action label (Option B: "Connect LinkedIn to post")
    expect(reviewDecision).toContain("missingChannel");
    expect(reviewDecision).toContain("missingChannel.actionLabel");
    // "Post now instead" secondary button is suppressed when a channel connection is required
    expect(reviewDecision).toMatch(/!missingChannel/);
  });

  it("ReviewDecision guards scheduled post when required channel is missing", () => {
    // When scheduled and missing a channel, CTA invites connecting that channel
    expect(reviewDecision).toMatch(/missingChannel\s*\?\s*\(\s*<button[^>]*onClick=\{[^}]*onConnectChannel/);
  });

  it("EditorialStudio passes channelConfigs and onConnectChannel to ReviewDecision", () => {
    expect(editorialStudio).toMatch(/channelConfigs=\{channelPayload\?\.channels\}/);
    expect(editorialStudio).toContain("onConnectChannel=");
  });

  it("EditorialStudio guards handlePublish and handleSchedule against unconnected channels", () => {
    expect(editorialStudio).toMatch(/handlePublish[\s\S]*getMissingPostChannel[\s\S]*setPanel\("linkedin"\)/);
    expect(editorialStudio).toMatch(/handleSchedule[\s\S]*getMissingPostChannel[\s\S]*setPanel\("linkedin"\)/);
  });

  it("LinkedInModal accepts a returnTo prop so user returns to the active draft after connect", () => {
    expect(linkedInModal).toMatch(/returnTo\??:\s*string/);
    expect(linkedInModal).toMatch(/connectReturnTo=\{returnTo\s*\?\?\s*["']/);
  });

  it("TodayView checks LinkedIn connection before allowing inline schedule", () => {
    expect(todayView).toMatch(/Connect LinkedIn to post/);
  });
});

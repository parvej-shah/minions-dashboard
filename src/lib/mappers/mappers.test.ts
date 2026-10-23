import { describe, expect, it } from "vitest";
import type { Asset, Blog, BrandDirective, Claim, Idea } from "@prisma/client";
import { toIdeaDTO } from "./idea";
import { toAssetDTO, toClaimDTO } from "./asset";
import { channelOf, toChannelUrls } from "@/lib/channels";
import { toPublishedDTO } from "./published";
import { toDirectiveDTO } from "./directive";

const CREATED = new Date("2026-08-01T10:00:00.000Z");
const UPDATED = new Date("2026-08-02T10:00:00.000Z");

function makeIdea(overrides: Partial<Idea> = {}): Idea {
  return {
    id: "IDEA-0001",
    rawIdea: "Attic condenser failures",
    angle: "Warranty redos bleed hours",
    audience: "ICP",
    targetTrade: "HVAC",
    pillar: "Operations",
    source: "MANUAL",
    status: "HARVESTED",
    priority: "HIGH",
    geoMetro: null,
    why: "Operators lose 2.5h per job",
    icpRelevance: 90,
    evidenceRequired: null,
    claimedByRunId: null,
    claimedAt: null,
    draftAssetId: null,
    rejectionReason: null,
    scheduledFor: null,
    queueOrder: null,
    tags: ["HVAC"],
    createdAt: CREATED,
    updatedAt: UPDATED,
    ...overrides,
  } as Idea;
}

function makeClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "CLM-0001",
    assetId: "ASSET-0001",
    claimText: "Sub-1.8s voice turnaround",
    claimType: "BENCHMARK",
    source: "GO_BENCHMARK",
    verified: "Y",
    confidenceScore: null,
    notes: null,
    createdAt: CREATED,
    ...overrides,
  } as Claim;
}

function makeAsset(overrides: Partial<Asset> = {}): Asset & { claims: Claim[] } {
  return {
    id: "ASSET-0001",
    ideaId: "IDEA-0001",
    title: "Deterministic Voice Pipelines",
    slug: "deterministic-voice-pipelines",
    hook: "Raw JSON beats summaries",
    coreArgument: null,
    content: "# Body\n\nSome prose.",
    audience: "PEER",
    pillar: "Engineering",
    targetTrade: null,
    status: "PENDING_REVIEW",
    claimsOk: "BLOCKED_PENDING_REVIEW",
    heroImageUrl: null,
    docUrl: null,
    linkedinVariant: "LI copy",
    facebookVariant: null,
    xVariant: null,
    version: 1,
    generationCost: null,
    publishedAt: null,
    publishedUrls: null,
    facebookPostId: null,
    facebookPublishedAt: null,
    createdAt: CREATED,
    updatedAt: UPDATED,
    claims: [makeClaim()],
    ...overrides,
  } as Asset & { claims: Claim[] };
}

describe("toIdeaDTO", () => {
  it("emits one shape with camelCase draftAssetId and no snake-case variant", () => {
    const dto = toIdeaDTO(makeIdea({ draftAssetId: "ASSET-0009" }));

    expect(dto.draftAssetId).toBe("ASSET-0009");
    expect(dto).not.toHaveProperty("draft_asset_id");
  });

  it("always emits the keys every /api/ideas response is expected to carry", () => {
    const dto = toIdeaDTO(makeIdea());

    // The three old copies each omitted a different subset of these.
    for (const key of [
      "id",
      "ideaId",
      "title",
      "raw_idea",
      "angle",
      "excerpt",
      "audience",
      "target_trade",
      "pillar",
      "source",
      "status",
      "priority",
      "estimated_cost",
      "tags",
      "scheduled_for",
      "queue_order",
      "draftAssetId",
      "created_at",
      "updated_at",
    ]) {
      expect(dto, `missing ${key}`).toHaveProperty(key);
    }
  });

  it("falls back to UNSPECIFIED rather than inventing a trade", () => {
    expect(toIdeaDTO(makeIdea({ targetTrade: "" })).target_trade).toBe("UNSPECIFIED");
  });

  it("serialises dates as ISO strings and null-safe optionals", () => {
    const dto = toIdeaDTO(makeIdea());
    expect(dto.created_at).toBe(CREATED.toISOString());
    expect(dto.updated_at).toBe(UPDATED.toISOString());
    expect(dto.scheduled_for).toBeNull();
    expect(dto.queue_order).toBeNull();
  });
});

describe("toAssetDTO", () => {
  it("uses UNSPECIFIED for a missing trade in both list and by-id paths", () => {
    // The list route used to say "HVAC" here and the by-id route "UNSPECIFIED".
    expect(toAssetDTO(makeAsset()).target_trade).toBe("UNSPECIFIED");
    expect(toAssetDTO(makeAsset({ targetTrade: "Plumbing" })).target_trade).toBe("Plumbing");
  });

  it("derives doc_url from the canonical no-www blog host", () => {
    expect(toAssetDTO(makeAsset(), null, "getminions.ai").doc_url).toBe(
      "https://getminions.ai/blog/deterministic-voice-pipelines"
    );
  });

  it("keeps an explicit doc_url when the row has one", () => {
    expect(toAssetDTO(makeAsset({ docUrl: "https://example.com/x" })).doc_url).toBe(
      "https://example.com/x"
    );
  });

  it("exposes social bodies under variants, not three loose *_variant keys", () => {
    const dto = toAssetDTO(makeAsset());
    expect(dto.variants).toEqual({ linkedin: "LI copy", facebook: "", twitter: "" });
    expect(dto).not.toHaveProperty("linkedin_variant");
    expect(dto).not.toHaveProperty("social_variants");
  });

  it("exposes claims under `claims` and applies the confidence default", () => {
    const dto = toAssetDTO(makeAsset());
    expect(dto.claims).toHaveLength(1);
    expect(dto.claims[0].confidence_score).toBe(0.95);
    expect(dto).not.toHaveProperty("claim_checks");
  });

  it("splits published_urls and defaults generation cost", () => {
    const dto = toAssetDTO(makeAsset({ publishedUrls: "https://a.test,https://b.test" }));
    expect(dto.published_urls).toEqual(["https://a.test", "https://b.test"]);
    expect(dto.generation_cost).toBe(0.038);
    expect(toAssetDTO(makeAsset()).published_urls).toEqual([]);
  });

  it("reads published_urls left behind in the legacy JSON-array format", () => {
    // The publish webhook used to write JSON.stringify(posts); a plain comma
    // split tore those rows into fragments like `["https://a.test"`.
    const fromJson = toAssetDTO(
      makeAsset({ publishedUrls: '["https://a.test","https://b.test"]' })
    );
    expect(fromJson.published_urls).toEqual(["https://a.test", "https://b.test"]);

    const fromJsonObjects = toAssetDTO(
      makeAsset({ publishedUrls: '[{"url":"https://a.test"},{"url":"https://b.test"}]' })
    );
    expect(fromJsonObjects.published_urls).toEqual(["https://a.test", "https://b.test"]);
  });

  it("reports live_blog_url only when a blog row backs the asset", () => {
    expect(toAssetDTO(makeAsset()).live_blog_url).toBeNull();
    expect(toAssetDTO(makeAsset(), "my-post", "getminions.ai").live_blog_url).toBe(
      "https://getminions.ai/blog/my-post"
    );
  });
});

describe("toClaimDTO", () => {
  it("keeps a real confidence score rather than overwriting it", () => {
    expect(toClaimDTO(makeClaim({ confidenceScore: 0.5 as never })).confidence_score).toBe(0.5);
  });
});

describe("toPublishedDTO", () => {
  const blog = {
    slug: "deterministic-voice-pipelines",
    title: "Deterministic Voice Pipelines",
    subtitle: null,
    hook: "Raw JSON beats summaries",
    coreArgument: null,
    content: "Body without an image",
    audience: "PEER",
    pillar: "Engineering",
    author: {},
    tags: [],
    metaDescription: null,
    readingTimeMinutes: 3,
    assetId: "ASSET-0001",
    docUrl: null,
    publishedAt: CREATED,
    createdAt: CREATED,
    updatedAt: UPDATED,
  } as unknown as Blog;

  it("uses the canonical no-www host for published_url and first_comment", () => {
    const dto = toPublishedDTO(blog, makeAsset(), 0, "getminions.ai");
    expect(dto.published_url).toBe(
      "https://getminions.ai/blog/deterministic-voice-pipelines"
    );
    expect(dto.first_comment).toContain("https://getminions.ai/blog/");
    expect(dto.published_url).not.toContain("www.");
  });

  it("prefers an inline markdown image over the asset hero", () => {
    const withImage = { ...blog, content: "![alt](https://img.test/x.png)" } as Blog;
    expect(toPublishedDTO(withImage, makeAsset(), 0).hero_image_url).toBe(
      "https://img.test/x.png"
    );
  });

  it("survives a blog row with no matching asset", () => {
    const dto = toPublishedDTO(blog, undefined, 4);
    // No asset means no id and no cost to report — neither is invented.
    expect(dto.asset_id).toBeNull();
    expect(dto.cost_usd).toBeNull();
    expect(dto.variants).toEqual({ linkedin: "", facebook: "", twitter: "" });
  });

  it("links a LinkedIn post from the id the publisher stores", () => {
    const dto = toPublishedDTO(blog, makeAsset({ linkedinPostId: "urn:li:ugcPost:7519359054805282816" }), 0);
    expect(dto.channel_urls.linkedin).toBe("https://www.linkedin.com/feed/update/urn:li:ugcPost:7519359054805282816/");
  });

  it("prefers a recorded LinkedIn URL and ignores an id it cannot read", () => {
    const recorded = makeAsset({ publishedUrls: "https://www.linkedin.com/posts/me-123", linkedinPostId: "urn:li:share:1" });
    expect(toPublishedDTO(blog, recorded, 0).channel_urls.linkedin).toBe("https://www.linkedin.com/posts/me-123");
    expect(toPublishedDTO(blog, makeAsset({ linkedinPostId: "pending" }), 0).channel_urls.linkedin).toBeNull();
  });
});

describe("channel URLs", () => {
  it("recognises each network, including the x.com and lnkd.in forms", () => {
    expect(channelOf("https://www.linkedin.com/posts/x")).toBe("linkedin");
    expect(channelOf("https://lnkd.in/abc")).toBe("linkedin");
    expect(channelOf("https://facebook.com/getminionsai/posts/1")).toBe("facebook");
    expect(channelOf("https://x.com/getminionsai/status/1")).toBe("twitter");
    expect(channelOf("https://twitter.com/getminionsai/status/1")).toBe("twitter");
    expect(channelOf("https://getminions.ai/blog/post")).toBeNull();
  });

  it("sorts recorded urls into channels and leaves unposted ones null", () => {
    expect(
      toChannelUrls(["https://getminions.ai/blog/a", "https://facebook.com/getminionsai"])
    ).toEqual({
      linkedin: null,
      facebook: "https://facebook.com/getminionsai",
      twitter: null,
    });
  });

  it("keeps the first url per channel rather than merging duplicates", () => {
    expect(
      toChannelUrls(["https://x.com/a/status/1", "https://x.com/a/status/2"]).twitter
    ).toBe("https://x.com/a/status/1");
  });
});

describe("toDirectiveDTO", () => {
  it("maps rule_key/instruction onto the client key/content pair", () => {
    const dto = toDirectiveDTO({
      id: "DIR-001",
      category: "POSITIONING",
      ruleKey: "company_name",
      instruction: "getminions.ai — one word",
      priority: 1,
      audienceScope: "ALL",
      isActive: true,
      createdAt: CREATED,
      updatedAt: UPDATED,
    } as BrandDirective);

    expect(dto.key).toBe("company_name");
    expect(dto.content).toBe("getminions.ai — one word");
    expect(dto.is_active).toBe(true);
    expect(dto.updated_at).toBe(UPDATED.toISOString());
  });
});

/**
 * Public post URLs must name the tenant that owns the post. They were built
 * from a hardcoded getminions.ai constant, so every tenant's "Live on Blog"
 * button, published feed, and LinkedIn first-comment backlink advertised this
 * company's domain instead of the customer's.
 */
describe("tenant-scoped blog URLs", () => {
  const blog = {
    slug: "why-chat-logs-fail",
    title: "Why Chat Logs Fail",
    subtitle: null,
    hook: "State beats transcripts",
    coreArgument: null,
    content: "Body without an image",
    audience: "ICP",
    pillar: "Operations",
    author: {},
    tags: [],
    metaDescription: null,
    readingTimeMinutes: 2,
    assetId: "ASSET-0001",
    docUrl: null,
    publishedAt: CREATED,
    createdAt: CREATED,
    updatedAt: UPDATED,
  } as unknown as Blog;

  it("builds published_url and first_comment on the tenant's own domain", () => {
    const dto = toPublishedDTO(blog, makeAsset(), 0, "https://parvejshah.com");
    expect(dto.published_url).toBe("https://parvejshah.com/blog/why-chat-logs-fail");
    expect(dto.first_comment).toContain("https://parvejshah.com/blog/why-chat-logs-fail");
    expect(dto.first_comment).not.toContain("getminions.ai");
  });

  it("accepts a bare domain with no scheme", () => {
    expect(toPublishedDTO(blog, makeAsset(), 0, "acme.com").published_url).toBe(
      "https://acme.com/blog/why-chat-logs-fail"
    );
  });

  it("tolerates a trailing slash rather than doubling it", () => {
    expect(toPublishedDTO(blog, makeAsset(), 0, "https://acme.com/").published_url).toBe(
      "https://acme.com/blog/why-chat-logs-fail"
    );
  });

  it("gives no link, never getminions.ai, when the tenant has no domain", () => {
    // Other tenants' posts are not on the Minions blog; the fallback linked
    // their first comments to a 404 page there.
    for (const domain of ["   ", null]) {
      const dto = toPublishedDTO(blog, makeAsset(), 0, domain);
      expect(dto.published_url).toBe("");
      expect(dto.first_comment).toBe("");
    }
    const asset = toAssetDTO(makeAsset({ docUrl: null }), "my-post", null);
    expect(asset.doc_url).toBe("");
    expect(asset.live_blog_url).toBeNull();
  });

  it("scopes asset doc_url and live_blog_url to the tenant too", () => {
    const dto = toAssetDTO(makeAsset({ docUrl: null }), "my-post", "https://parvejshah.com");
    expect(dto.doc_url).toBe("https://parvejshah.com/blog/deterministic-voice-pipelines");
    expect(dto.live_blog_url).toBe("https://parvejshah.com/blog/my-post");
  });

  it("still prefers an explicitly stored docUrl over any domain", () => {
    const dto = toAssetDTO(makeAsset({ docUrl: "https://example.com/x" }), null, "https://acme.com");
    expect(dto.doc_url).toBe("https://example.com/x");
  });
});

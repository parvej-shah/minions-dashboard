import { describe, expect, it, vi } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { toAssetDTO } from "@/lib/mappers/asset";
import SocialVariantTabs from "@/components/editorial/social/SocialVariantTabs";
import type { AssetItem } from "@/types";

type AssetInput = Parameters<typeof toAssetDTO>[0];

describe("Task 80: Carousel Caption in Captions Tab", () => {
  const baseAsset: AssetItem = {
    id: "asset-1",
    title: "Voice agents fake booked showings",
    slug: "voice-agents-fake-booked-showings",
    hook: "A confident voice that hallucinates bookings",
    core_argument: "Fluency without calendar write is a liability",
    audience: "ICP",
    pillar: "Operations",
    target_trade: "Real Estate",
    status: "PENDING_REVIEW",
    claims_ok: "PASS",
    review_notes: [],
    hero_image_url: "https://r2/hero.png",
    hero_status: "READY",
    hero_error_code: null,
    hero_provider: "template",
    hero_attempts: 1,
    cover: null,
    doc_url: "https://minions.ai/post",
    version: 1,
    generation_cost: 0.038,
    published_at: null,
    channels: ["linkedin", "facebook"],
    scheduled_for: null,
    published_urls: [],
    live_blog_url: null,
    body_content: "Full body content",
    variants: {
      linkedin: "This is the LONG SINGLE POST variant with all details and body paragraphs.",
      facebook: "Facebook variant",
      twitter: "Twitter variant",
      instagram: "Instagram variant",
    },
    claims: [],
    linkedin_went_as: null,
    carousel_pages: ["https://r2/p1.jpg", "https://r2/p2.jpg"],
    carousel_active: true,
    carousel_caption: "Short punchy carousel caption pointing to slides.",
    instagram_format: "CAROUSEL",
    linkedin_url: null,
    linkedin_published_at: null,
    follow_up_of: null,
    follow_up_format: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("extracts carousel_active and carousel_caption in toAssetDTO mapper", () => {
    const rawAsset = {
      id: "asset-1",
      title: "Voice agents fake booked showings",
      slug: "voice-agents-fake-booked-showings",
      hook: "Hook",
      coreArgument: "Argument",
      content: "Body content",
      audience: "ICP",
      pillar: "Operations",
      targetTrade: "Real Estate",
      status: "PENDING_REVIEW",
      claimsOk: "PASS",
      reviewNotes: [],
      coverSpec: null,
      heroImageUrl: "https://r2/hero.png",
      heroStatus: "READY",
      heroErrorCode: null,
      heroProvider: "template",
      heroAttempts: 1,
      docUrl: "https://minions.ai/post",
      linkedinVariant: "Long single poster text",
      facebookVariant: "FB text",
      xVariant: "X text",
      instagramVariant: "IG text",
      version: 1,
      generationCost: 0.038,
      channels: ["linkedin"],
      scheduledFor: null,
      publishedAt: null,
      publishedUrls: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      linkedinPublishedAt: null,
      linkedinPostId: null,
      publishFailures: null,
      followUpOf: null,
      followUpFormat: null,
      carouselSpec: {
        active: true,
        caption: "Short carousel caption for LinkedIn",
        pdf_url: "https://r2/c.pdf",
        pages: ["https://r2/p1.jpg"],
      },
      claims: [],
    };

    const dto = toAssetDTO(rawAsset as unknown as AssetInput);
    expect(dto.carousel_active).toBe(true);
    expect(dto.carousel_caption).toBe("Short carousel caption for LinkedIn");
  });

  it("defaults carousel_active to false and carousel_caption to null when carouselSpec is absent", () => {
    const rawAsset = {
      id: "asset-2",
      title: "No Carousel Post",
      slug: "no-carousel-post",
      hook: null,
      coreArgument: null,
      content: "Body content",
      audience: "ICP",
      pillar: "Operations",
      targetTrade: null,
      status: "PENDING_REVIEW",
      claimsOk: "PASS",
      reviewNotes: [],
      coverSpec: null,
      heroImageUrl: null,
      heroStatus: "READY",
      heroErrorCode: null,
      heroProvider: null,
      heroAttempts: 0,
      docUrl: null,
      linkedinVariant: "Single post text only",
      facebookVariant: null,
      xVariant: null,
      instagramVariant: null,
      version: 1,
      generationCost: 0.038,
      channels: [],
      scheduledFor: null,
      publishedAt: null,
      publishedUrls: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      linkedinPublishedAt: null,
      linkedinPostId: null,
      publishFailures: null,
      followUpOf: null,
      followUpFormat: null,
      carouselSpec: null,
      claims: [],
    };

    const dto = toAssetDTO(rawAsset as unknown as AssetInput);
    expect(dto.carousel_active).toBe(false);
    expect(dto.carousel_caption).toBeNull();
  });

  it("renders the carousel caption in SocialVariantTabs when linkedinCarousel is active", () => {
    const html = renderToStaticMarkup(
      h(SocialVariantTabs, {
        activeAsset: baseAsset,
        socialTab: "LINKEDIN",
        setSocialTab: vi.fn(),
        isEditingSocial: false,
        isSaving: false,
        setIsEditingSocial: vi.fn(),
        edited: {
          linkedin: baseAsset.variants.linkedin, // Single post text initially in buffer
          facebook: baseAsset.variants.facebook,
          twitter: baseAsset.variants.twitter,
          instagram: baseAsset.variants.instagram,
        },
        setEditedLinkedin: vi.fn(),
        setEditedFacebook: vi.fn(),
        setEditedTwitter: vi.fn(),
        setEditedInstagram: vi.fn(),
        onSave: vi.fn(),
        onCopy: vi.fn(),
        copiedKey: null,
        linkedinCarousel: {
          caption: "Short punchy carousel caption pointing to slides.",
          pages: ["https://r2/p1.jpg", "https://r2/p2.jpg"],
        },
      })
    );

    // Should display the carousel caption
    expect(html).toContain("Short punchy carousel caption pointing to slides.");
    // Should NOT display the single post long text
    expect(html).not.toContain("This is the LONG SINGLE POST variant with all details and body paragraphs.");
  });

  it("renders the single post text in SocialVariantTabs when linkedinCarousel is null (Single poster)", () => {
    const html = renderToStaticMarkup(
      h(SocialVariantTabs, {
        activeAsset: baseAsset,
        socialTab: "LINKEDIN",
        setSocialTab: vi.fn(),
        isEditingSocial: false,
        isSaving: false,
        setIsEditingSocial: vi.fn(),
        edited: {
          linkedin: baseAsset.variants.linkedin,
          facebook: baseAsset.variants.facebook,
          twitter: baseAsset.variants.twitter,
          instagram: baseAsset.variants.instagram,
        },
        setEditedLinkedin: vi.fn(),
        setEditedFacebook: vi.fn(),
        setEditedTwitter: vi.fn(),
        setEditedInstagram: vi.fn(),
        onSave: vi.fn(),
        onCopy: vi.fn(),
        copiedKey: null,
        linkedinCarousel: null, // Single poster selected
      })
    );

    // Should display the single poster text
    expect(html).toContain("This is the LONG SINGLE POST variant with all details and body paragraphs.");
    expect(html).not.toContain("Short punchy carousel caption pointing to slides.");
  });

  it("renders the user edited caption when user has made specific edits while carousel is active", () => {
    const userCustomEdit = "My customized carousel caption after editing.";
    const html = renderToStaticMarkup(
      h(SocialVariantTabs, {
        activeAsset: baseAsset,
        socialTab: "LINKEDIN",
        setSocialTab: vi.fn(),
        isEditingSocial: false,
        isSaving: false,
        setIsEditingSocial: vi.fn(),
        edited: {
          linkedin: userCustomEdit,
          facebook: baseAsset.variants.facebook,
          twitter: baseAsset.variants.twitter,
          instagram: baseAsset.variants.instagram,
        },
        setEditedLinkedin: vi.fn(),
        setEditedFacebook: vi.fn(),
        setEditedTwitter: vi.fn(),
        setEditedInstagram: vi.fn(),
        onSave: vi.fn(),
        onCopy: vi.fn(),
        copiedKey: null,
        linkedinCarousel: {
          caption: "Short punchy carousel caption pointing to slides.",
          pages: ["https://r2/p1.jpg", "https://r2/p2.jpg"],
        },
      })
    );

    // Should display the user's customized edit
    expect(html).toContain("My customized carousel caption after editing.");
  });
});

/**
 * Typed inputs for the n8n contract tests. Everything n8n receives from the
 * dashboard is built by the dashboard's REAL code from these, so a renamed
 * field shows up as a type error here or a failing test, not a silent blank
 * in a production prompt.
 */
import { buildBrandContextResponse } from "@/services/brandContext";
import { selectAnglesForRun } from "@/constants/contentAngles";
import { DEFAULT_LANES, defaultLaneId } from "@/constants/contentLanes";
import type { AuthorContext } from "@/services/authorContext";
import type { BrandSettings } from "@/types/brand";
import type { HarvestContext, WriterVoiceConfig } from "@/services/brand";

export const brandSettings: BrandSettings = {
  id: "brand-1",
  brand_name: "Acme Plumbing",
  company_domain: "acmeplumbing.example",
  positioning: "Same-day plumbing for homeowners in Columbus.",
  primary_logo_url: "https://cdn.example/logo.svg",
  primary_ink: "#12242A",
  brand_teal: "#0E5C63",
  brand_coral: "#FF6B4A",
  brand_cream: "#F5F7FA",
  accent_blue: "#7C8CFF",
  tone_guidelines: {
    formality: "tactile_operator",
    cadence: "Short, plain sentences.",
    banned_lexicon: ["synergy"],
    allowed_proof_claims: ["Licensed in Ohio"],
  },
  thumbnail_layout: {
    visual_style: "editorial",
    show_badge: false,
    show_logo: true,
    title_word_count_min: 3,
    title_word_count_max: 5,
  },
  directives: [
    { id: "d1", category: "POSITIONING", key: "core_positioning", content: "We fix it the same day or the visit is free.", priority: 1, audience_scope: "ALL", is_active: true, updated_at: "2026-09-01T00:00:00Z" },
    { id: "d2", category: "FORBIDDEN", key: "no_fear_selling", content: "Never use scare tactics about water damage.", priority: 2, audience_scope: "ALL", is_active: true, updated_at: "2026-09-01T00:00:00Z" },
    { id: "d3", category: "VOICE", key: "low_priority_note", content: "Priority 3 guidance the refiner must skip.", priority: 3, audience_scope: "ALL", is_active: true, updated_at: "2026-09-01T00:00:00Z" },
    { id: "d4", category: "TOPICS", key: "inactive_rule", content: "Inactive rules never reach n8n.", priority: 1, audience_scope: "ALL", is_active: false, updated_at: "2026-09-01T00:00:00Z" },
  ],
  writer_expertise: "PRACTITIONER",
  updated_at: "2026-09-01T00:00:00Z",
};

export const voiceConfig: WriterVoiceConfig = {
  toneQuestionnaire: { formality: "plain" },
  toneExamples: ["We showed up at 7am and had the water back on by 9."],
  allowCustomerResultClaims: false,
};

export const authorContext: AuthorContext = {
  icp: {
    who: "Homeowners in Columbus with an aging water heater or plumbing.",
    role: "Homeowner",
    company_type: "",
    pains: ["No hot water on a winter morning"],
    decisions: ["Repair or replace a 10-year-old water heater"],
    questions: ["Is a tankless heater worth it?"],
    buying_triggers: ["A leak or a cold shower"],
    vocabulary: ["water heater", "tankless"],
  },
  memory: [
    { id: "MEM-1", kind: "STORY", content: "Replaced 14 water heaters in one January week after a cold snap.", disclosure: "PUBLIC", used_count: 0 },
    { id: "MEM-2", kind: "LESSON", content: "A customer's anode rod had dissolved in six years because of softened water.", disclosure: "GENERALIZE", used_count: 2 },
  ],
  lanes: DEFAULT_LANES.map((l) => ({
    id: defaultLaneId("tenant-acme", l.slug),
    name: l.name,
    purpose: l.purpose,
    brief: l.brief,
    weight: l.weight,
    profile_target: "PERSONAL" as const,
  })),
};

export const harvestContext: HarvestContext = {
  degraded: [],
  writerExpertise: "PRACTITIONER",
  sources: [
    { id: "src-1", label: "Plumbing News", kind: "RSS", feed_url: "https://news.example/feed", max_items: 5 },
    { id: "src-2", label: "Home Repair Blog", kind: "RSS", feed_url: "https://blog.example/rss", max_items: 3 },
  ],
  recentTheses: [],
  pillarRotation: selectAnglesForRun(4),
  runIndex: 4,
  author: authorContext,
};

/** Exactly what GET /api/brand/context returns for the fixtures above. */
export function brandContext(overrides: Partial<HarvestContext> = {}) {
  return buildBrandContextResponse(brandSettings, voiceConfig, { ...harvestContext, ...overrides });
}

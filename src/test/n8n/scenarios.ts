/**
 * Fixed inputs for every n8n node that feeds a model prompt. Each scenario
 * runs the real node, renders its prompt_inputs through src/lib/prompts, and
 * must match ./golden/<name>.json exactly. The goldens were recorded from the
 * prompts n8n built itself before they moved into the repo.
 *
 * A golden diff in review IS the prompt change being reviewed. To accept an
 * intended change: UPDATE_GOLDEN=1 npx vitest run src/test/n8n
 */
import { CRAFT_EXTRACT_INSTRUCTION } from "@/lib/ai/craftExtract";
import { brandContext } from "./fixtures";
import type { RunOptions } from "./harness";
import type { PromptStage } from "@/lib/prompts";

type Json = Record<string, unknown>;

export interface Scenario {
  name: string;
  slug: string;
  node: string;
  opts: RunOptions;
  stage: PromptStage;
}

const ctx = { ...brandContext(), recent_theses: ["flush-heater-sediment-tank-winter", "drain-slope-toilet"] };

// ---- 02 inputs, shaped like the Supabase rows n8n reads ------------------------

const brandProfileRow = {
  brand_name: "Acme Plumbing",
  positioning: "Same-day plumbing for homeowners in Columbus.",
  tone_formality: "tactile_operator",
  tone_cadence: "Short, plain sentences.",
  allowed_proof_claims: ["Licensed in Ohio", "Family owned since 1998"],
  writer_expertise_guidance: "The AUTHOR works in this field hands-on.",
  primary_logo_url: "https://cdn.example/logo.svg",
  brand_teal: "#0E5C63",
  brand_coral: "#FF6B4A",
  primary_ink: "#12242A",
  tone_questionnaire: { formality: "plain", humor: "dry" },
  allow_customer_result_claims: false,
};

const directiveRows = [
  { category: "POSITIONING", key: "core_positioning", content: "We fix it the same day or the visit is free.", priority: 1, audience_scope: "ALL" },
  { category: "VOICE", key: "plain_talk", content: "Talk like a tradesperson, not a marketer.", priority: 2, audience_scope: "ICP" },
  { category: "VOICE", key: "peer_only", content: "Peer-only guidance.", priority: 1, audience_scope: "PEER" },
  { category: "FORBIDDEN", key: "synergy", content: "synergy", priority: 1, audience_scope: "ALL" },
  {
    category: "PROOF",
    key: "license",
    content: JSON.stringify({ approved: true, claim: "Acme holds an Ohio master plumber license", sourceUrl: "https://ohio.example/license/123", sourceTitle: "Ohio License Lookup" }),
    priority: 1,
    audience_scope: "ALL",
  },
];

const toneRows = [{ content: "We showed up at 7am and had the water back on by 9." }, { content: "No upsell. Just the fix." }];

function target(pillar: string, extra: Json = {}): Json {
  return {
    found: true,
    idea_id: "IDEA-0042",
    audience: "ICP",
    pillar,
    raw_idea: "Water heaters fail in winter because sediment builds up",
    angle: "A yearly flush prevents most winter failures",
    why: "Homeowners only think about it when the water goes cold",
    target_trade: "UNSPECIFIED",
    evidence_required: "N",
    signals: [{ title: "Cold snap hits Ohio", url: "https://news.example/cold", source: "Plumbing News", snippet: "Temperatures drop below zero." }],
    ...extra,
  };
}

function strategistNodes(pillar: string): Record<string, Json[]> {
  return {
    "Fetch Brand Context": [brandProfileRow],
    "Read Brand": directiveRows,
    "Fetch Tone Examples": toneRows,
    "Select Target": [target(pillar)],
    "Generate run_id": [{ client_id: "tenant-acme" }],
  };
}

const strategy = {
  title: "Your Water Heater Is Filling With Rock",
  inversion_hook: "Common assumption: heaters just get old. Practical observation: sediment kills them first.",
  core_argument: "A yearly flush prevents most winter failures.",
  content_mode: "HOW_TO",
  reader: "A Columbus homeowner with a 9-year-old tank",
  reader_objection: "Flushing sounds like a job for a plumber.",
  key_points: ["Sediment insulates the burner", "Flushing takes 20 minutes"],
  thumbnail_card: {
    badge: "FIELD PLAYBOOK",
    headline: "Sediment Kills Heaters First",
    subtitle: "A twenty-minute flush each fall keeps the hot water running through January and saves a service call",
    visual_register: "PHYSICAL_TRADE",
    physical_scene: "A single thin line icon of a water heater with a drain valve.",
  },
  seo_keyword: "water heater flush",
  narrative_thread: "Sediment, not age, is what ends most water heaters.",
  cta: "Book a flush",
  evidence_needs: [],
};

// Assemble Brand Context's output, as later nodes read it.
const assembled = {
  brand_context: "[POSITIONING] Same-day plumbing for homeowners in Columbus.\n[POSITIONING] core_positioning: We fix it the same day or the visit is free.",
  company_name: "Acme Plumbing",
  tone_examples: toneRows.map((r) => r.content),
  tone_questionnaire: brandProfileRow.tone_questionnaire,
  allow_customer_result_claims: false,
  primary_ink: "#12242A",
  brand_teal: "#0E5C63",
  brand_coral: "#FF6B4A",
};

const evidenceBlock = "[SUPPLIED_SOURCE_1] Plumbing News: Cold snap hits Ohio\nURL: https://news.example/cold\nEXCERPT: Temperatures drop below zero.";

function llm(content: unknown): Json {
  return { choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) } }] };
}

const editorOut = {
  ok: true,
  idea: target("How It Works"),
  strategy,
  hook: "Your heater is not old. It is full of rock.",
  edited_body: "## Why Tanks Fail\nSediment settles.\n\n## The Twenty-Minute Fix\nDrain two gallons each fall.",
  claims: [{ claim_text: "Acme holds an Ohio master plumber license", claim_type: "FACT" }],
};

function coverNodes(overrides: { strategy?: Json; target?: Json; brand?: Json; title?: string } = {}): Record<string, Json[]> {
  return {
    "Assemble Brand Context": [{ ...assembled, accent_blue: "#7C8CFF", brand_cream: "#F5F7FA", ...overrides.brand }],
    "Parse Claims and Gate": [{ asset_id: "asset-1", idea_id: "IDEA-0042", audience: "ICP", title: overrides.title ?? "Your Water Heater Is Filling With Rock", hook: editorOut.hook, core_argument: strategy.core_argument, edited_body: editorOut.edited_body, claims_ok: "Y", claims: [] }],
    "Parse Strategy JSON": [{ strategy: { ...strategy, ...overrides.strategy } }],
    "Select Target": [target("How It Works", overrides.target)],
  };
}

const variantsResponse = llm({ li_variant: "LinkedIn post", fb_variant: "Facebook post", x_variant: "X post" });

export const SCENARIOS: Scenario[] = [
  {
    name: "refine",
    slug: "01_idea_harvester",
    node: "Build Refine Payload",
    stage: "refine",
    opts: {
      input: [ctx],
      nodes: { "Backlog Guard": [{ existing_rows: [{ idea_id: "IDEA-0007", status: "NEW", raw_idea: "Customers ignore anode rods" }, { idea_id: "IDEA-0008", status: "REFINED" }] }] },
    },
  },
  {
    name: "harvest",
    slug: "01_idea_harvester",
    node: "Build Harvest Payload",
    stage: "harvest",
    opts: {
      input: [
        { title: "Cold snap hits Ohio", link: "https://news.example/cold", contentSnippet: "Temperatures drop below <b>zero</b>.", isoDate: "2026-09-20" },
        { title: "Tankless sales climb", link: "https://blog.example/tankless", description: "Homeowners switch.", pubDate: "Mon, 21 Sep 2026" },
        { error: "feed timeout" },
      ],
      nodes: { "Fetch Brand Context": [ctx] },
    },
  },
  {
    name: "craft",
    slug: "01_idea_harvester",
    node: "Build Craft Payload",
    stage: "craft",
    opts: {
      nodes: {
        "Fetch Source Articles": [{
          instruction: CRAFT_EXTRACT_INSTRUCTION,
          articles: [
            { title: "Cold snap hits Ohio", url: "https://news.example/cold", text: "Temperatures drop below zero across the state." },
            { title: "Tankless sales climb", url: "https://blog.example/tankless", text: "Homeowners are switching." },
          ],
        }],
      },
    },
  },
  ...(["The Myth", "The Stakes", "How It Works"] as const).map((pillar) => ({
    name: `strategist-${pillar.toLowerCase().replace(/\s+/g, "-")}`,
    slug: "02_idea_to_asset",
    node: "Assemble Brand Context",
    stage: "strategist" as const,
    opts: { nodes: strategistNodes(pillar) },
  })),
  {
    name: "writer-with-evidence",
    slug: "02_idea_to_asset",
    node: "Build Writer Payload",
    stage: "writer",
    opts: {
      input: [{ ok: true, strategy, idea: target("How It Works"), brand_context: assembled.brand_context, evidence_block: evidenceBlock }],
      nodes: { "Assemble Brand Context": [assembled], "Parse Strategy JSON": [{ strategy }], "Select Target": [target("How It Works")] },
    },
  },
  {
    name: "writer-no-evidence",
    slug: "02_idea_to_asset",
    node: "Build Writer Payload",
    stage: "writer",
    opts: {
      input: [{ ok: true, strategy, idea: target("How It Works"), brand_context: assembled.brand_context }],
      nodes: { "Assemble Brand Context": [{ ...assembled, tone_examples: [], tone_questionnaire: null }], "Parse Strategy JSON": [{ strategy }], "Select Target": [target("How It Works")] },
    },
  },
  {
    name: "editor-with-evidence",
    slug: "02_idea_to_asset",
    node: "Parse Writer Output",
    stage: "editor",
    opts: {
      input: [llm({ hook: "Your heater is full of rock.", body_text: "## Why Tanks Fail\nSediment settles." })],
      nodes: {
        "Select Target": [target("How It Works")],
        "Parse Strategy JSON": [{ strategy }],
        "Assemble Brand Context": [assembled],
        "Need Evidence?": [{}],
        "Format Evidence Context": [{ evidence_block: evidenceBlock }],
      },
    },
  },
  {
    name: "editor-no-evidence",
    slug: "02_idea_to_asset",
    node: "Parse Writer Output",
    stage: "editor",
    opts: {
      input: [llm("Not JSON: the whole reply becomes the body.")],
      nodes: { "Select Target": [target("How It Works")], "Parse Strategy JSON": [{ strategy }], "Assemble Brand Context": [assembled], "Need Evidence?": [{}] },
    },
  },
  {
    name: "variants",
    slug: "02_idea_to_asset",
    node: "Parse Claims and Gate",
    stage: "variants",
    opts: {
      nodes: { "Parse Editor Output": [editorOut], "Select Target": [target("How It Works")], "Assemble Brand Context": [assembled], "Read Brand": directiveRows },
    },
  },
  {
    name: "cover-strategist-scene",
    slug: "02_idea_to_asset",
    node: "Parse Variants and Prepare Rows",
    stage: "cover",
    opts: { input: [variantsResponse], nodes: coverNodes({ target: { target_trade: "Plumbing" } }) },
  },
  {
    name: "cover-abstract-router",
    slug: "02_idea_to_asset",
    node: "Parse Variants and Prepare Rows",
    stage: "cover",
    opts: {
      input: [variantsResponse],
      nodes: coverNodes({
        strategy: { thumbnail_card: { headline: "Chatbots Lose The Call", subtitle: "Short.", visual_register: "ABSTRACT_DATA", physical_scene: "A multimeter and wire strippers on a bench." }, narrative_thread: "x" },
        target: { raw_idea: "Conversational AI agents drop dispatch calls", angle: "Agents need structure" },
      }),
    },
  },
  {
    name: "cover-trade-router",
    slug: "02_idea_to_asset",
    node: "Parse Variants and Prepare Rows",
    stage: "cover",
    opts: {
      input: [variantsResponse],
      nodes: coverNodes({
        strategy: { thumbnail_card: { headline: "Roofs Fail At Flashing", subtitle: "", visual_register: "PHYSICAL_TRADE", physical_scene: "" }, narrative_thread: "" },
        target: { raw_idea: "Storm damage starts at the flashing", angle: "Inspect after hail", target_trade: "Roofing" },
        title: "Storm Damage Starts At The Flashing",
      }),
    },
  },
];

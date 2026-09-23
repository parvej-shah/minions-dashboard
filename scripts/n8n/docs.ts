/**
 * npm run n8n:docs            regenerate n8n/architecture.html
 * npm run n8n:docs -- --check fail if it is out of date (CI)
 *
 * The architecture page used to be written by hand, and it drifted: it missed
 * prompts, listed dead nodes, and could not show a prompt change until
 * someone remembered to update it. Everything that can drift -- prompts,
 * models, triggers, node counts, open risks -- is now rendered from the
 * source that runs: the prompt modules and the exported workflows.
 */
import fs from "node:fs";
import path from "node:path";
import { renderPrompt, type PromptStage } from "@/lib/prompts";
import type { ChatPayload } from "@/lib/prompts/types";
import { hookArchetypeFor } from "@/lib/prompts/strategist";
import { renderCover } from "@/lib/prompts/cover";
import { CONTENT_ANGLES, ANGLES_PER_RUN } from "@/constants/contentAngles";
import { WRITER_EXPERTISE_OPTIONS, DEFAULT_WRITER_EXPERTISE } from "@/constants/writerExpertise";
import { buildBrandDirectivesPrompt, buildBrandSuggestionsPrompt, ONBOARDING_MODEL } from "@/lib/ai/brandCopilot";
import { buildMemoryCheckPrompt, MEMORY_CHECK_MODEL } from "@/lib/ai/memoryCheck";
import { N8N_DIR, readManifest, readWorkflowFiles, type Workflow } from "./lib";

const OUT = path.join(N8N_DIR, "architecture.html");
const TEMPLATE = path.join(__dirname, "docs-template.html");

// ------------------------------------------------------------------ helpers

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Escapes text and highlights {{placeholders}}. */
function fmt(s: string): string {
  return esc(s).replace(/\{\{[^{}]+\}\}/g, (m) => `<span class="v">${m}</span>`);
}

const ph = (name: string) => `{{${name}}}`;

// ------------------------------------------------------------------ prompts

interface StageDoc {
  title: string;
  node: string;
  description: string;
  input: string;
  output: string;
  /** Placeholder inputs; every value that varies per run is a {{name}}. */
  sample: unknown;
}

const STAGE_DOCS: Record<PromptStage, StageDoc> = {
  refine: {
    title: "Refine human notes",
    node: "01_idea_harvester › Build Refine Payload → Render Refine Prompt → Qwen Refine",
    description: "Turns rough notes a team member typed into the Ideas page into structured ideas, grounded in the tenant's priority 1–2 brand directives.",
    input: "The tenant's directives (from /api/brand/context) and every NEW idea row.",
    output: "JSON array: angle, audience, pillar, priority, batch_rank, evidence_required, why, icp_relevance per row.",
    sample: {
      directives: [{ category: ph("category"), key: ph("key"), content: ph("content"), priority: 1 }],
      new_rows: [{ idea_id: ph("idea_id"), raw_idea: ph("raw_idea") }],
    },
  },
  harvest: {
    title: "Harvest ideas",
    node: "01_idea_harvester › Build Harvest Payload → Render Harvest Prompt → Qwen Harvest",
    description: "The main idea generator: exactly one idea per angle in this run's pillar rotation, using a market signal only when it is directly relevant. High temperature keeps runs varied; the thesis dedupe filters repeats afterwards.",
    input: "Brand context (positioning, author standing, directive blocks, proof, forbidden words, rotation, recent theses) and up to 18 RSS signals.",
    output: '{"ideas":[…]}, one per angle, with signal_index, priority and icp_relevance 0–100.',
    sample: {
      brand: {
        company_name: ph("company_name"),
        positioning: ph("positioning"),
        writer_expertise_guidance: ph("writer_expertise_guidance"),
        voice_guidelines: { cadence: ph("cadence"), forbidden_lexicon: [ph("forbidden_word")], allowed_proof: [ph("allowed_proof")] },
        directives: [
          { category: "VOICE", key: ph("key"), content: ph("instruction") },
          { category: "TOPICS", key: ph("key"), content: ph("instruction") },
          { category: "AUDIENCE", key: ph("key"), content: ph("instruction") },
        ],
        pillar_rotation: [1, 2, 3].map((i) => ({ pillar: ph(`pillar_${i}`), brief: ph(`brief_${i}`) })),
        recent_theses: [ph("thesis_fingerprint")],
      },
      market_signals: [{ title: ph("title"), url: ph("url"), source_name: ph("source"), snippet: ph("excerpt") }],
    },
  },
  craft: {
    title: "Craft notes",
    node: "01_idea_harvester › Build Craft Payload → Render Craft Prompt → Qwen Craft Notes",
    description: "Studies how each source article is built (opening, argument order, evidence types, objections, close) without borrowing its words or claims. Merge Craft Into Ideas then strips any 9-word run copied from the source.",
    input: "The fetched text of each idea's source article.",
    output: '{"notes":[{"index","craft_notes"}]}, stored on the idea with craft_source_url.',
    sample: { articles: [{ title: ph("title"), url: ph("url"), text: ph("article_text") }] },
  },
  strategist: {
    title: "Executive strategist",
    node: "02_idea_to_asset › Assemble Brand Context → Render Strategist Prompt → Executive Strategist Agent",
    description: "Settles the argument before any writing: the hook (archetype picked in code from the pillar), reader, content mode, key points, SEO keyword, throughline, and the cover brief.",
    input: "The idea, the assembled brand block (≤8,000 chars, with verified proof) and the author standing.",
    output: "title, inversion_hook, core_argument, content_mode, reader, reader_objection, key_points, thumbnail_card, seo_keyword, narrative_thread, cta, evidence_needs.",
    sample: {
      brand_name: ph("brand_name"),
      target: { idea_id: ph("idea_id"), audience: ph("audience"), pillar: "The Myth", raw_idea: ph("raw_idea"), angle: ph("angle"), why: ph("why") },
      brand_context: ph("brand_context"),
      writer_standing: ph("writer_standing"),
    },
  },
  writer: {
    title: "Writer",
    node: "02_idea_to_asset › Build Writer Payload → Render Writer Prompt → Qwen Call 2 Writer",
    description: "Writes the article as one argument in 3–5 sections shaped by the content mode, with an SEO/GEO answer passage, 1–3 sentence paragraphs and no invented evidence.",
    input: "Strategy JSON, evidence block, brand context, tone questionnaire and up to 5 tone examples.",
    output: '{"hook","body_text"}; a non-JSON reply becomes the body.',
    sample: {
      company_name: ph("company_name"),
      strategy: { "…": ph("strategy_json") },
      evidence_block: ph("evidence_block"),
      brand_context: ph("brand_context"),
      tone_examples: [ph("tone_example")],
      tone_questionnaire: { "…": ph("tone_questionnaire") },
    },
  },
  editor: {
    title: "Editor & claim extractor",
    node: "02_idea_to_asset › Parse Writer Output → Render Editor Prompt → Qwen Call 3 Editor",
    description: "Tightens the draft while keeping its structure, then lists and classifies every checkable assertion. Its claims feed the deterministic claims gate.",
    input: "Hook, draft body, brand context, supplied evidence.",
    output: "hook, body, claims[] (claim_text, claim_type, source_url/title/date), forbidden_hits[].",
    sample: { company_name: ph("company_name"), hook: ph("hook"), body: ph("draft_body"), brand_context: ph("brand_context"), evidence_block: ph("evidence_block") },
  },
  variants: {
    title: "Platform variants",
    node: "02_idea_to_asset › Parse Claims and Gate → Render Variants Prompt → Qwen Call 4 Variants",
    description: "Rewrites the article as LinkedIn, Facebook and X posts. LinkedIn must open with the strategist's hook; links are added as first comments at publish time.",
    input: "Hook, edited body, brand context, tone profile and examples, audience, title.",
    output: '{"li_variant","fb_variant","x_variant"}, then markdown-stripped and validated.',
    sample: {
      company_name: ph("company_name"),
      hook: ph("hook"),
      edited_body: ph("edited_body"),
      brand_context: ph("brand_context"),
      tone_questionnaire: { "…": ph("tone_questionnaire") },
      tone_examples: [ph("tone_example")],
      audience: ph("audience"),
      title: ph("title"),
    },
  },
  cover: {
    title: "Cover image",
    node: "04_hero_image › Read Hero Request → Render Cover Prompt → Qwen Image 3.0 Pro Generation",
    description: "A type-led editorial cover on a cream ground: headline with one word in brand coral, a short kicker, a small wordmark and one corner line icon (the strategist's motif, or the keyword router's). Sent with prompt_extend on, 1280×720.",
    input: "thumbnail_card, title, idea text and trade, brand colors and name.",
    output: "Signed image URL → /api/media/ingest (R2 WebP) → asset hero.",
    sample: {
      company_name: ph("company_name"),
      colors: { primary_ink: ph("primary_ink"), brand_teal: ph("brand_teal"), brand_coral: ph("brand_coral"), brand_cream: ph("brand_cream"), accent_blue: ph("accent_blue") },
      thumbnail_card: { headline: ph("headline"), subtitle: ph("kicker"), visual_register: "PHYSICAL_TRADE", physical_scene: ph("corner_icon (strategist motif or router text)") },
      title: ph("title"),
      raw_idea: "",
      angle: "",
      target_trade: "",
    },
  },
  cover_safe: {
    title: "Safe retry cover",
    node: "04_hero_image › Needs Safe Image Retry? → Render Safe Cover Prompt → Qwen Image Safe Retry",
    description: "Used only when the main cover returns no image, usually a content-safety refusal. Fixed, text-free and tenant-neutral; sent with prompt_extend off.",
    input: "None.",
    output: "Same path as the main cover; hero_provider QWEN_IMAGE_SAFE_RETRY.",
    sample: {},
  },
};

interface Card {
  id: string;
  kind: "LLM" | "image";
  title: string;
  node: string;
  description: string;
  input: string;
  output: string;
  params: [string, string][];
  blocks: [string, string][];
}

function stageCard(stage: PromptStage): Card {
  const d = STAGE_DOCS[stage];
  const out = renderPrompt(stage, d.sample);
  if (stage === "cover" || stage === "cover_safe") {
    return {
      id: stage, kind: "image", title: d.title, node: d.node, description: d.description, input: d.input, output: d.output,
      params: [["model", "qwen-image-3.0-pro"], ["size", "1280×720"]],
      blocks: [["Image prompt", String(out.image_prompt)]],
    };
  }
  const p = out.payload as ChatPayload;
  return {
    id: stage, kind: "LLM", title: d.title, node: d.node, description: d.description, input: d.input, output: d.output,
    params: [["model", p.model], ["temperature", String(p.temperature)], ["max tokens", p.max_tokens.toLocaleString("en-US")]],
    blocks: p.messages.map((m) => [m.role === "system" ? "System prompt" : "User message", m.content]),
  };
}

const onboardingSample = {
  businessName: ph("business_name"),
  industry: ph("industry"),
  headline: ph("linkedin_headline"),
  websiteContext: ph("website_summary"),
  postSamples: [ph("post_sample")],
  audienceDescription: ph("audience"),
  contentFocus: ph("content_focus"),
  mythAnswer: ph("myth_answer"),
  differentiatorAnswer: ph("differentiator_answer"),
  avoidAnswer: ph("avoid_answer"),
  voiceSample: ph("voice_sample"),
  writerExpertiseGuidance: ph("writer_expertise_guidance"),
};

const onboardingParams: [string, string][] = [
  ["model", ONBOARDING_MODEL.model],
  ["temperature", String(ONBOARDING_MODEL.temperature)],
  ["max tokens", String(ONBOARDING_MODEL.max_tokens)],
];

const ONBOARDING_CARDS: Record<string, Card> = {
  onboarding_suggestions: {
    id: "onboarding_suggestions", kind: "LLM", title: "Brand interview suggestions",
    node: "dashboard · src/lib/ai/brandCopilot.ts → POST /api/onboarding/brand-suggestions",
    description: "Onboarding step 2: tap-to-use suggestion chips for the three brand-interview questions. Single user message; on failure the static INDUSTRY_SUGGESTIONS map is used.",
    input: "Business name, industry, headline, website summary (≤800 chars), up to 3 post samples.",
    output: '{"myths":[3],"differentiators":[3],"avoids":[3]}',
    params: onboardingParams,
    blocks: [["User message (only message)", buildBrandSuggestionsPrompt(onboardingSample)]],
  },
  onboarding_directives: {
    id: "onboarding_directives", kind: "LLM", title: "Brand copilot directives",
    node: "dashboard · src/lib/ai/brandCopilot.ts → POST /api/onboarding/brand-copilot",
    description: "Onboarding step 3: turns the user's three answers into the 5–6 brand directives and positioning summary every later prompt reads. Single user message; on failure the route uses fixed templates.",
    input: "Business, industry, audience, content focus, headline, website summary, the three answers, voice sample, author standing.",
    output: '{"positioningSummary","directives":[{category,rule_key,instruction,priority}]}, capped at 6.',
    params: onboardingParams,
    blocks: [["User message (only message)", buildBrandDirectivesPrompt(onboardingSample)]],
  },
};

ONBOARDING_CARDS.memory_check = {
  id: "memory_check", kind: "LLM", title: "Experience generalization check",
  node: "dashboard · src/lib/ai/memoryCheck.ts → POST /api/brand/memory/check",
  description: "Brand page › Audience & Experience: runs before an experience item is saved (decision D4, no confidential data). Code first finds contact details, secrets, money and links; the model adds names, places and anything confidential, and each span it flags is kept only if it really occurs in the text. Contact details, secrets and confidential items block the save.",
  input: "The item text and its disclosure (PUBLIC or GENERALIZE, which changes the rule). The item is fenced as data.",
  output: '{"issues":[{text,kind,reason}],"confidential":bool,"generalized":"rewrite without the specifics"}',
  params: [["model", MEMORY_CHECK_MODEL.model], ["temperature", String(MEMORY_CHECK_MODEL.temperature)], ["max tokens", String(MEMORY_CHECK_MODEL.max_tokens)]],
  blocks: [
    ["User message, disclosure = GENERALIZE", buildMemoryCheckPrompt(ph("experience_item"), "GENERALIZE")],
    ["User message, disclosure = PUBLIC", buildMemoryCheckPrompt(ph("experience_item"), "PUBLIC")],
  ],
};

function renderCard(c: Card): string {
  const pid = `p-${c.id}`;
  const words = c.blocks.reduce((n, [, t]) => n + t.split(/\s+/).filter(Boolean).length, 0);
  const blocks = c.blocks
    .map(([label, text], i) => `<div class="plabel"><span>${esc(label)}</span><button class="copy" type="button" data-for="${pid}-${i}">Copy</button></div><pre class="p" id="${pid}-${i}">${fmt(text)}</pre>`)
    .join("");
  const params = c.params.map(([k, v]) => `<span>${esc(k)}</span><b>${esc(v)}</b>`).join("");
  return `<article class="llm" id="${pid}">
  <div class="llm-top"><div><h4><span class="tag${c.kind === "image" ? " img" : ""}">${c.kind}</span>${esc(c.title)}</h4><p>${esc(c.description)}</p><p class="mono" style="font-size:11.5px;color:var(--dim)">${esc(c.node)}</p></div>
  <div class="params">${params}</div></div>
  <div class="io"><div><h5>Input</h5>${esc(c.input)}</div><div><h5>Output</h5>${esc(c.output)}</div></div>
  <details class="prompt"><summary><span>Show full prompt${c.blocks.length > 1 ? `s (${c.blocks.length})` : ""}</span><span class="n">${words.toLocaleString("en-US")} words</span></summary><div class="pbody">${blocks}</div></details>
</article>`;
}

// ------------------------------------------------------------------ sections

function triggerLabel(w: Workflow): string[] {
  return w.nodes
    .filter((n) => /(Trigger|\.webhook)$/.test(n.type))
    .map((n) => {
      if (n.type.endsWith(".webhook")) return `webhook /${n.parameters.path}`;
      if (n.type.endsWith(".errorTrigger")) return "error trigger";
      if (n.type.endsWith(".manualTrigger")) return "manual";
      if (n.type.endsWith(".scheduleTrigger")) {
        const rule = (n.parameters.rule as { interval?: Record<string, unknown>[] })?.interval?.[0] || {};
        if (rule.expression) return `cron ${rule.expression}`;
        if (rule.field === "minutes") return `every ${rule.minutesInterval} min`;
        return `schedule ${JSON.stringify(rule)}`;
      }
      return n.type.split(".").pop() || n.type;
    });
}

function workflowsTable(): string {
  const manifest = readManifest();
  const errorIds = new Set<string>();
  const rows = manifest.workflows.map((e) => {
    const w = readWorkflowFiles(e.slug);
    if (w.nodes.some((n) => n.type.endsWith(".errorTrigger"))) errorIds.add(w.id);
    return { e, w };
  });
  const body = rows
    .map(({ e, w }) => {
      const status = w.active ? '<span class="chip ok">active</span>' : '<span class="chip off">inactive</span>';
      const err = errorIds.has(w.id) ? "—" : w.settings.errorWorkflow ? "✓" : '<span class="chip off">none</span>';
      const triggers = triggerLabel(w).map((t) => `<span class="chip">${esc(t)}</span>`).join(" ");
      return `<tr><td><code>${esc(e.slug)}</code></td><td>${status}</td><td><div class="chips">${triggers}</div>${e.schedule ? `<div style="margin-top:4px">${esc(e.schedule)}</div>` : ""}</td><td class="num">${w.nodes.length}</td><td>${err}</td></tr>`;
    })
    .join("\n");
  return `<div class="tbl"><table><thead><tr><th>Workflow</th><th>State</th><th>Triggers</th><th>Nodes</th><th>Error alerts</th></tr></thead><tbody>
${body}
</tbody></table></div>`;
}

function promptIndex(cards: Card[]): string {
  const row = (c: Card) => {
    const get = (k: string) => c.params.find(([p]) => p === k)?.[1] ?? "—";
    return `<tr><td><a href="#p-${c.id}">${esc(c.title)}</a></td><td><code>${esc(get("model"))}</code></td><td class="num">${esc(get("temperature"))}</td><td class="num">${esc(c.kind === "image" ? get("size") : get("max tokens"))}</td><td>${esc(c.output)}</td></tr>`;
  };
  const pipeline = cards.filter((c) => !c.id.startsWith("onboarding"));
  const onboarding = cards.filter((c) => c.id.startsWith("onboarding"));
  return `<div class="tbl"><table><thead><tr><th>Stage</th><th>Model</th><th>Temp</th><th>Max tokens / size</th><th>Returns</th></tr></thead><tbody>
<tr><th colspan="5">Content pipeline (n8n → /api/internal/prompts)</th></tr>
${pipeline.map(row).join("\n")}
<tr><th colspan="5">Dashboard (onboarding)</th></tr>
${onboarding.map(row).join("\n")}
</tbody></table></div>`;
}

function fragments(): string {
  const out: string[] = [];
  out.push(`<article class="llm" id="f-expertise"><div class="llm-top"><div><h4><span class="tag">fragment</span>Author standing</h4><p><code>src/constants/writerExpertise.ts</code>. The tenant's choice is injected word for word into the harvest, strategist and brand-copilot prompts. It bounds what the author may claim as evidence, not reading level. Default: ${DEFAULT_WRITER_EXPERTISE}.</p></div></div><details class="prompt"><summary><span>Show all ${WRITER_EXPERTISE_OPTIONS.length} variants</span></summary><div class="pbody">${WRITER_EXPERTISE_OPTIONS.map((o) => `<div class="plabel"><span>${esc(o.id)} · “${esc(o.label)}”</span></div><pre class="p">${fmt(o.promptGuidance)}</pre>`).join("")}</div></details></article>`);

  const angles = CONTENT_ANGLES.map((a) => `<tr><td>${esc(a.pillar)}</td><td><code>${esc(a.id)}</code></td><td>${esc(a.brief)}</td></tr>`).join("");
  out.push(`<article class="llm" id="f-angles"><div class="llm-top"><div><h4><span class="tag">fragment</span>Pillar rotation</h4><p><code>src/constants/contentAngles.ts</code>. Each harvest takes ${ANGLES_PER_RUN} of these ${CONTENT_ANGLES.length} angles, starting at <code>runIndex % ${CONTENT_ANGLES.length}</code> and taking every 3rd, so consecutive runs get different combinations. The pillar later decides the strategist's hook archetype.</p></div></div><div class="tbl" style="border:0;border-top:1px solid var(--line);border-radius:0"><table><thead><tr><th>Pillar</th><th>id</th><th>Brief (injected verbatim)</th></tr></thead><tbody>${angles}</tbody></table></div></article>`);

  const hooks = [["myth / contrarian / architecture / systems", "The Myth"], ["stakes / econom…", "The Stakes"], ["anything else", "How It Works"]]
    .map(([when, sample]) => {
      const h = hookArchetypeFor(sample);
      return `<tr><td><code>${esc(h.hookArchetype)}</code></td><td>${esc(when)}</td><td>${esc(h.archetypeInstruction)}</td></tr>`;
    })
    .join("");
  out.push(`<article class="llm" id="f-hooks"><div class="llm-top"><div><h4><span class="tag">fragment</span>Hook archetypes</h4><p><code>hookArchetypeFor()</code> in <code>src/lib/prompts/strategist.ts</code>, matched on the idea's pillar.</p></div></div><div class="tbl" style="border:0;border-top:1px solid var(--line);border-radius:0"><table><thead><tr><th>Archetype</th><th>Pillar contains</th><th>Instruction</th></tr></thead><tbody>${hooks}</tbody></table></div></article>`);

  // Probe the real router: an empty physical_scene forces it, and the title
  // carries the keyword being tested.
  const probe = (register: string, title: string, trade = "") => {
    const prompt = renderCover({ company_name: "x", colors: {}, thumbnail_card: { headline: "x", visual_register: register }, title, target_trade: trade }).image_prompt;
    const start = prompt.indexOf("combined):\n") + "combined):\n".length;
    return prompt.slice(start, prompt.indexOf("\nRender it as", start));
  };
  const router: [string, string, string][] = [
    ["abstract", "conversation · chatbot · agent · ai · prompt · llm · intent", probe("ABSTRACT_DATA", "chatbot")],
    ["abstract", "voice · call · latency · telecom · audio · phone · dispatch", probe("ABSTRACT_DATA", "latency")],
    ["abstract", "price · pricing · revenue · cost · econom · margin · roi", probe("ABSTRACT_DATA", "pricing")],
    ["abstract", "architect · system · infrastructure · pipeline · workflow · automation", probe("ABSTRACT_DATA", "pipeline")],
    ["abstract", "(fallback)", probe("ABSTRACT_DATA", "unrelated")],
    ["trade", "slab · leak · pipe · plumb · water", probe("PHYSICAL_TRADE", "leak", "plumbing")],
    ["trade", "attic · heat · capacitor · compressor · hvac · refrigerant", probe("PHYSICAL_TRADE", "compressor", "hvac")],
    ["trade", "voice · call · telecom · latency · audio · phone", probe("PHYSICAL_TRADE", "phone", "roofing")],
    ["trade", "electric · wire · volt · panel · breaker", probe("PHYSICAL_TRADE", "breaker", "electrical")],
    ["trade", "roof · storm · hail · flashing", probe("PHYSICAL_TRADE", "hail", "roofing")],
    ["trade", "pest · termite · moisture", probe("PHYSICAL_TRADE", "termite", "pest control")],
    ["trade", "(fallback)", probe("PHYSICAL_TRADE", "unrelated")],
  ];
  const rows = router.map(([r, k, t]) => `<tr><td>${r}</td><td><code>${esc(k)}</code></td><td>${fmt(t)}</td></tr>`).join("");
  out.push(`<article class="llm" id="f-icons"><div class="llm-top"><div><h4><span class="tag img">fragment</span>Cover corner-icon router</h4><p>In <code>src/lib/prompts/cover.ts</code>. Replaces the strategist's <code>physical_scene</code> when it is empty, shorter than 25 characters, mentions a clipboard, or shows trade hardware on a non-trade topic. Keywords match title + idea + angle + trade; first match wins.</p></div></div><div class="tbl" style="border:0;border-top:1px solid var(--line);border-radius:0"><table><thead><tr><th>Register</th><th>Keywords</th><th>Injected text</th></tr></thead><tbody>${rows}</tbody></table></div></article>`);
  return out.join("\n");
}

function risks(): string {
  const open = readManifest().lintAllow.filter((a) => a.reason.startsWith("OPEN RISK"));
  if (!open.length) return '<p class="note">No open risks recorded.</p>';
  return `<div class="findings">${open
    .map((a) => `<div class="f"><span class="sev md">Open</span><div><h4>${esc(a.workflow)} › ${esc(a.node || "")}</h4><p>${esc(a.reason.replace(/^OPEN RISK:\s*/, ""))}</p></div></div>`)
    .join("\n")}</div>`;
}

function facts(cards: Card[]): string {
  const manifest = readManifest();
  const wfs = manifest.workflows.map((e) => readWorkflowFiles(e.slug));
  const text = cards.filter((c) => c.kind === "LLM").length;
  const image = cards.filter((c) => c.kind === "image").length;
  return `<div class="facts">
    <span><b>${wfs.length}</b> pipeline workflows (${wfs.filter((w) => w.active).length} active)</span>
    <span><b>${text}</b> text-model prompts</span>
    <span><b>${image}</b> image prompts</span>
    <span><b>1</b> human gate</span>
    <span>LLM host <b>DashScope (intl)</b></span>
    <span>DB <b>Supabase Postgres</b></span>
    <span>Media <b>Cloudflare R2</b></span>
  </div>`;
}

// ------------------------------------------------------------------ main

function build(): string {
  const stages = Object.keys(STAGE_DOCS) as PromptStage[];
  const cards = [...stages.map(stageCard), ...Object.values(ONBOARDING_CARDS)];
  const byId = new Map(cards.map((c) => [c.id, c]));

  let html = fs.readFileSync(TEMPLATE, "utf8");
  html = html
    .replace("{{FACTS}}", facts(cards))
    .replace("{{PROMPT_INDEX}}", promptIndex(cards))
    .replace("{{WORKFLOWS}}", workflowsTable())
    .replace("{{FRAGMENTS}}", fragments())
    .replace("{{RISKS}}", risks())
    .replace(/\{\{NODES:([a-z0-9_]+)\}\}/g, (_m, slug) => `${readWorkflowFiles(slug).nodes.length} nodes`)
    .replace(/\{\{PROMPT:([a-z_]+)\}\}/g, (_m, id) => {
      const c = byId.get(id);
      if (!c) throw new Error(`docs-template.html references unknown prompt "${id}"`);
      return renderCard(c);
    });

  const left = html.match(/\{\{[A-Z_]+(?::[a-z0-9_]+)?\}\}/);
  if (left) throw new Error(`Unfilled slot ${left[0]} in docs-template.html`);
  const missing = cards.filter((c) => !html.includes(`id="p-${c.id}"`));
  if (missing.length) throw new Error(`Prompts not placed in docs-template.html: ${missing.map((c) => c.id).join(", ")}`);
  return html;
}

function main() {
  const html = build();
  if (process.argv.includes("--check")) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (current !== html) {
      console.error("✗ n8n/architecture.html is out of date. Run `npm run n8n:docs` and commit the result.");
      process.exit(1);
    }
    console.log("✓ n8n/architecture.html is up to date.");
    return;
  }
  fs.writeFileSync(OUT, html);
  console.log(`✓ wrote ${path.relative(process.cwd(), OUT)}`);
}

main();

import { supabaseAdmin, supabaseClient } from "./supabase";
import { IdeaItem, AssetItem, SocialVariantItem, ClaimCheckItem, TelemetryItem, BrandSettings, AgentWorkerItem } from "./types";

/**
 * IDEAS API
 */
export async function fetchIdeas(): Promise<IdeaItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("ideas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn("Falling back to seeded ideas:", err);
  }

  // Initial seed data from recently harvested ideas
  return [
    {
      id: "IDEA-0004",
      raw_idea: "High-Temperature Attic Condenser Failures: Why Austin HVAC Technicians Bleed 2.5 Hours Per Job on Warranty Redos",
      angle: "Contractor operational deep dive on attic thermal saturation and automated parts diagnostics",
      audience: "ICP",
      target_trade: "HVAC",
      pillar: "Operations",
      source: "GOOGLE_TRENDS",
      status: "HARVESTED",
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "IDEA-0003",
      raw_idea: "Raw JSON Over Agent Summaries: Why Multi-Agent LLM Systems Drift in Production",
      angle: "Architecture teardown showing deterministic JSON validation beats multi-hop conversational summaries",
      audience: "PEER",
      target_trade: "Systems Architecture",
      pillar: "Engineering",
      source: "HACKER_NEWS",
      status: "REFINED",
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "IDEA-0002",
      raw_idea: "The $3,000 DFW Heat Wave Tax: How After-Hours Voicemails Cost Plumbing & HVAC Contractors $18k/Month",
      angle: "Speed-to-lead unit economics proving sub-1.8s automated voice pickup captures $3,000 emergency jobs before competitors",
      audience: "ICP",
      target_trade: "HVAC & Plumbing",
      pillar: "Revenue",
      source: "TRADE_NEWS",
      status: "QUEUED",
      created_at: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "IDEA-0001",
      raw_idea: "Deterministic WebSocket Voice Pipelines: How Sub-1.8s Latency Prevents Customer Turn-Away",
      angle: "Technical benchmark teardown of WebRTC vs raw WebSocket voice packets",
      audience: "PEER",
      target_trade: "Voice AI",
      pillar: "Engineering",
      source: "REDDIT_R_LOCALLAMA",
      status: "REFINED",
      created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

/**
 * ASSETS / DRAFTS API
 */
export async function fetchAssets(): Promise<AssetItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("assets")
      .select("*, social_variants(*), claim_checks(*), generation_telemetry(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn("Falling back to seeded assets:", err);
  }

  return [
    {
      id: "ASSET-0003",
      idea_id: "IDEA-0003",
      title: "Raw JSON Over Agent Summaries",
      slug: "raw-json-over-agent-summaries",
      hook: "Every multi-agent system looks invincible in the playground. Then you deploy to production.",
      core_argument: "Autonomous agents should never pass natural language summaries across critical operational boundaries. Pass deterministic, schema-validated JSON payloads with rigid cryptographic guarantees.",
      body_content: `On July 22, 2026, an autonomous multi-agent dispatch system handling after-hours plumbing emergencies in North Texas collapsed.

A homeowner in Plano called at 11:42 PM with water pouring through their master bathroom ceiling. The conversational voice agent handled the call flawlessly. It transcribed the distress, recognized the emergency, and passed an internal briefing to the dispatch agent:

> *"Caller reported substantial residential flooding from an upstairs fixture. Customer indicated immediate mitigation required."*

The dispatch agent parsed the paragraph, concluded the job was an "unclassified plumbing inspection," and scheduled it for 9:00 AM the next morning. By 6:00 AM, the ceiling had collapsed, causing $42,000 in catastrophic drywall, hardwood, and electrical damage.

The root cause was not an LLM hallucination. It was **conversational summarization loss**.

---

### The Anatomy of Summary Drift

When multi-agent architectures communicate using natural language summaries, entropy compounds with every hop:

1. **Information Compression:** Rich metadata (shutoff valve status, flow rate estimation, caller urgency score) gets flattened into arbitrary adjective phrases.
2. **Context Window Distortion:** Downstream agents interpret ambiguous words ("substantial", "immediate") through differing temperature baselines.
3. **Zero Schema Enforcement:** No type safety, no required field validation, and no automated failure tripping.

\`\`\`json
{
  "event_id": "EVT-9042-TX",
  "service_trade": "PLUMBING",
  "urgency_level": "CRITICAL_ACTIVE_LEAK",
  "water_main_shutoff": false,
  "dispatch_action": "IMMEDIATE_CREW_PAGING",
  "max_response_window_minutes": 15
}
\`\`\`

---

### The Three Rules of Production Multi-Agent Systems

**Rule 1: Natural Language is for Humans, Raw JSON is for Agents**
Your front-desk voice agent can be as warm and natural as humanly possible on the phone. But the instant the call disconnects, the conversational stream must compile into a rigid, immutable JSON schema.

**Rule 2: Schema Validation Must Fail Loudly**
If an agent outputs a payload missing a mandatory boolean or float parameter, the system must trigger an immediate retry or human circuit breaker—never an educated guess.

**Rule 3: Deterministic Routing Always Beats Reasoning Loops**
Do not ask a reasoning model "Should we dispatch a technician now?" Evaluate the deterministic schema against business rules in code.`,
      audience: "PEER",
      pillar: "Engineering",
      status: "PUBLISHED",
      version: 3,
      claims_verified: true,
      hero_image_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/raw-json-over-agent-summaries.png",
      published_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      updated_at: new Date().toISOString(),
      social_variants: [
        {
          id: "VAR-001",
          asset_id: "ASSET-0003",
          platform: "LINKEDIN",
          content: "Most multi-agent systems fail silently in production due to conversational summary drift.\n\nOn July 22, an HVAC/plumbing dispatch pipeline caused a $42,000 ceiling collapse because an LLM summarized 'active ceiling flood' as 'unclassified inspection'.\n\nHere is our 3-rule engineering playbook for replacing agent summaries with deterministic JSON:\n\n👉 Full blueprint: https://getminions.ai/blog/raw-json-over-agent-summaries",
          first_comment: "Read the complete engineering breakdown: https://getminions.ai/blog/raw-json-over-agent-summaries",
          published_id: "urn:li:share:723489123891",
          published_url: "https://linkedin.com/feed/update/urn:li:share:723489123891",
          status: "PUBLISHED",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "VAR-002",
          asset_id: "ASSET-0003",
          platform: "FACEBOOK",
          content: "Why natural language summaries break AI pipelines in production (and why raw JSON validation fixes it). Deep technical breakdown from the Minions.AI engineering team.\n\n👉 https://getminions.ai/blog/raw-json-over-agent-summaries",
          first_comment: "https://getminions.ai/blog/raw-json-over-agent-summaries",
          published_id: "fb_post_9041289412",
          published_url: "https://facebook.com/minionsai/posts/9041289412",
          status: "PUBLISHED",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "VAR-003",
          asset_id: "ASSET-0003",
          platform: "TWITTER",
          content: "Stop passing natural language summaries between LLM agents in production.\n\nSummary drift causes catastrophic silent failures.\n\nPass deterministic JSON schemas with rigid type validation instead. Teardown + live benchmarks 👇\nhttps://getminions.ai/blog/raw-json-over-agent-summaries",
          published_id: "tweet_182490128941",
          published_url: "https://x.com/minionsai/status/182490128941",
          status: "PUBLISHED",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      claim_checks: [
        {
          id: "CLM-001",
          asset_id: "ASSET-0003",
          claim_text: "Conversational summarization loss across multi-agent boundaries",
          source_type: "SYSTEM_SPEC",
          verified: true,
          notes: "Confirmed by production telemetry analysis",
          created_at: new Date().toISOString(),
        },
        {
          id: "CLM-002",
          asset_id: "ASSET-0003",
          claim_text: "Deterministic schema validation eliminates ambiguous scheduling triage",
          source_type: "BENCHMARK",
          verified: true,
          notes: "Verified against 10,000 mock dispatch simulations",
          created_at: new Date().toISOString(),
        },
      ],
      telemetry: [
        {
          id: "TEL-001",
          asset_id: "ASSET-0003",
          stage: "STRATEGY",
          model_name: "qwen3.7-max",
          input_tokens: 1420,
          output_tokens: 680,
          cost_usd: 0.0084,
          latency_ms: 1820,
          created_at: new Date().toISOString(),
        },
        {
          id: "TEL-002",
          asset_id: "ASSET-0003",
          stage: "WRITER",
          model_name: "qwen-plus",
          input_tokens: 3200,
          output_tokens: 1840,
          cost_usd: 0.0062,
          latency_ms: 3410,
          created_at: new Date().toISOString(),
        },
        {
          id: "TEL-003",
          asset_id: "ASSET-0003",
          stage: "IMAGE_GEN",
          model_name: "qwen-image-3.0",
          input_tokens: 0,
          output_tokens: 0,
          cost_usd: 0.024,
          latency_ms: 4890,
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: "ASSET-0004",
      idea_id: "IDEA-0004",
      title: "The $3,800 Attic Saturation Leak",
      slug: "the-3800-attic-saturation-leak",
      hook: "In 105°F heat, an AC diagnostic isn't just mechanical—it's thermodynamic.",
      core_argument: "HVAC contractors lose up to 18% of summer revenue to misdiagnosed thermal trip resets. Automated telemetry triage spots capacitor vs compressor burnout in 10 seconds.",
      body_content: `# The $3,800 Attic Saturation Leak\n\nWhen ambient attic temperatures surpass 135°F, standard diagnostic procedures fail...`,
      audience: "ICP",
      pillar: "Operations",
      status: "PENDING_REVIEW",
      version: 1,
      claims_verified: false,
      hero_image_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/attic-saturation-leak.png",
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      updated_at: new Date().toISOString(),
      social_variants: [
        {
          id: "VAR-004",
          asset_id: "ASSET-0004",
          platform: "LINKEDIN",
          content: "Why Austin HVAC contractors bleed $3,800 on attic thermal trip callbacks...",
          status: "DRAFT",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      claim_checks: [
        {
          id: "CLM-003",
          asset_id: "ASSET-0004",
          claim_text: "135°F attic ambient thermal saturation threshold",
          source_type: "HVAC_MANUAL_J",
          verified: true,
          created_at: new Date().toISOString(),
        },
      ],
      telemetry: [
        {
          id: "TEL-004",
          asset_id: "ASSET-0004",
          stage: "TOTAL",
          model_name: "qwen-fleet",
          input_tokens: 4620,
          output_tokens: 2520,
          cost_usd: 0.0386,
          latency_ms: 10120,
          created_at: new Date().toISOString(),
        },
      ],
    },
  ];
}

/**
 * BRAND SETTINGS API
 */
export async function fetchBrandSettings(): Promise<BrandSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("brand_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (!error && data) return data;
  } catch (err) {
    console.warn("Using default brand settings:", err);
  }

  return {
    id: "default",
    brand_name: "Minions.AI",
    primary_ink: "#12242a",
    brand_teal: "#0e5c63",
    brand_coral: "#ff6b4a",
    brand_cream: "#fff8f0",
    logo_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/minions-logo-white.svg",
    watermark_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/minions-monogram.svg",
    thumbnail_layout: {
      show_badge: true,
      show_logo: true,
      title_word_count_min: 3,
      title_word_count_max: 6,
      visual_style: "Tactile Commercial Studio Flat-Lay (Leather clipboard + dark slate tabletop + softbox lighting)",
    },
    updated_at: new Date().toISOString(),
  };
}

/**
 * AGENT FLEET API
 */
export async function fetchAgentFleet(): Promise<AgentWorkerItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("agent_workers")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) return data;
  } catch (err) {
    console.warn("Using default agent fleet:", err);
  }

  return [
    {
      id: "strategist",
      name: "Marketing Strategist",
      type: "MARKETING_STRATEGIST",
      status: "ACTIVE",
      model: "qwen3.7-max",
      system_prompt: "Ingest Google Trends and industry signals. Formulate high-contrast Stripe/Linear 5-stage thesis angles.",
      last_active_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "writer",
      name: "Staff Writer",
      type: "CONTENT_WRITER",
      status: "ACTIVE",
      model: "qwen-plus",
      system_prompt: "Draft 1,200+ word unpadded technical narratives with rigid 1-3 sentence paragraph cadence.",
      last_active_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "editor",
      name: "Lead Editorial Reviewer",
      type: "EDITORIAL_REVIEWER",
      status: "ACTIVE",
      model: "qwen3.7-flash",
      system_prompt: "Enforce claims verification, format JSON code snippets, and optimize multi-platform social variants.",
      last_active_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "art_director",
      name: "Visual Art Director",
      type: "BACKOFFICE_OPS",
      status: "ACTIVE",
      model: "qwen-image-3.0",
      system_prompt: "Synthesize 2K photorealistic commercial flat-lay cover cards adhering to Minions.AI brand tokens.",
      last_active_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "rex",
      name: "Rex (Voice Dispatcher)",
      type: "VOICE_DISPATCHER",
      status: "ACTIVE",
      model: "qwen-max",
      system_prompt: "Sub-1.8s voice triage for emergency HVAC & plumbing dispatch calls.",
      last_active_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "pip",
      name: "Pip (CRM & Lead Engager)",
      type: "SALES_OUTREACH",
      status: "ACTIVE",
      model: "qwen-plus",
      system_prompt: "Engages web leads in under 60 seconds and synchronizes CRM lead records.",
      last_active_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "zip",
      name: "Zip (Dispatch & Scheduling)",
      type: "BACKOFFICE_OPS",
      status: "ACTIVE",
      model: "qwen-plus",
      system_prompt: "Calculates technician route density and locks deterministic calendar slots.",
      last_active_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      created_at: new Date().toISOString(),
    },
  ];
}

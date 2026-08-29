/**
 * Demo / local-development seed data.
 *
 * IMPORTANT: nothing in the production render path may import this file.
 * These arrays used to be the initial React state of the Brand, Ideas, and
 * Editorial pages, which meant the operator saw fabricated ideas and draft
 * articles on first paint, before the real fetch resolved. Pages now start
 * empty and render explicit loading and empty states instead.
 *
 * Kept for local demos and as fixtures; import explicitly where needed.
 *
 * DEMO_IDEAS and DEMO_ASSETS predate the DTO unification and are deliberately
 * left in their original shape (`claim_checks`, `social_variants`, `blog_url`)
 * rather than annotated as IdeaItem/AssetItem, which they no longer satisfy.
 */
import type { AgentWorkerItem, BrandDirectiveItem } from "@/types";

export const DEMO_BRAND_DIRECTIVES: BrandDirectiveItem[] = [
  {
    id: "DIR-001",
    category: "POSITIONING",
    key: "company_name",
    content: "getminions.ai — one word, lowercase, .ai suffix. Never 'Geminions', 'GetMinions', 'Minions.AI' in body text, or 'MinionOps'.",
    priority: 1,
    audience_scope: "ALL",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-002",
    category: "POSITIONING",
    key: "what_we_are",
    content: "An AI operations partner for US home-services businesses with 1–10 techs. Not a generic software vendor. Not a chatbot company.",
    priority: 1,
    audience_scope: "ALL",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-003",
    category: "FORBIDDEN",
    key: "ironclad",
    content: "'Ironclad Pest Solutions' is a FICTIONAL demo account we invented (Columbus OH, license AC-13579). Never reference it as a real client or case study. Never cite its numbers as real results.",
    priority: 1,
    audience_scope: "ALL",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-004",
    category: "FORBIDDEN",
    key: "fake_proof",
    content: "We have ZERO paying clients as of Aug 2026. Never write 'our clients', 'businesses we work with', 'companies we've helped'. Never invent testimonials.",
    priority: 1,
    audience_scope: "ALL",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-005",
    category: "FORBIDDEN",
    key: "vocabulary",
    content: "Banned: revolutionize, unlock, synergy, seamless, game-changing, leverage (as verb), 'in today's fast-paced world', 'the future of', delve, testament, tapestry, emoji in headlines, rocket emoji anywhere.",
    priority: 1,
    audience_scope: "ALL",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-006",
    category: "POSITIONING",
    key: "allowed_claims",
    content: "We may only claim: (1) a live callable AI voice demo number, (2) a working RAG chatbot on getminions.ai, (3) our own technical build experience. All framed as 'what we built', never client delivery.",
    priority: 1,
    audience_scope: "ALL",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-007",
    category: "AUDIENCE",
    key: "attic_thermal_leak",
    content: "Texas/Florida attics reach 130°F+ in summer. Dispatching techs without diagnostic telemetry results in 2.5-hour warranty callbacks and technician overtime burn.",
    priority: 2,
    audience_scope: "ICP",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-008",
    category: "AUDIENCE",
    key: "after_hours_voicemail",
    content: "78% of emergency HVAC/plumbing callers hang up on voicemail and call the next contractor on Google. Sub-1.8s automated voice pickup captures $3,000 emergency jobs.",
    priority: 2,
    audience_scope: "ICP",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-009",
    category: "VOICE",
    key: "linear_stripe_cadence",
    content: "Short sentences (1–3 per paragraph). Tactile concrete operator details (gauges, R-410A refrigerant, ServiceTitan locks, WebSocket packet buffers). State assertions directly.",
    priority: 1,
    audience_scope: "ALL",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-010",
    category: "VOICE",
    key: "no_ai_cheerleading",
    content: "Never cheerlead AI. Do not use hyperbolic introductory paragraphs. Do not summarize with 'In conclusion'. Avoid conversational filler like 'Let's dive in'.",
    priority: 1,
    audience_scope: "ALL",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-011",
    category: "AUDIENCE",
    key: "deterministic_over_agentic",
    content: "Deterministic JSON schema validation with strict Go/Python binaries beats open-ended multi-hop agent summaries for enterprise reliability every single time.",
    priority: 2,
    audience_scope: "PEER",
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: "DIR-012",
    category: "VOICE",
    key: "operator_voice_test",
    content: "Call our live dispatcher test line or inspect our open-source WebSocket audio streaming pipeline at getminions.ai.",
    priority: 1,
    audience_scope: "ALL",
    is_active: true,
    updated_at: new Date().toISOString()
  }
];

export const DEMO_IDEAS = [
  {
    id: "IDEA-0006",
    ideaId: "IDEA-0006",
    title: "High-Temperature Attic Condenser Failures: Why Austin HVAC Technicians Bleed 2.5 Hours Per Job on Warranty Redos",
    raw_idea: "High-Temperature Attic Condenser Failures: Why Austin HVAC Technicians Bleed 2.5 Hours Per Job on Warranty Redos",
    excerpt: "Contractor operational deep dive on attic thermal saturation, diagnostic sensor telemetry, and automated parts replenishment to prevent repeat callbacks.",
    angle: "Contractor operational deep dive on attic thermal saturation, diagnostic sensor telemetry, and automated parts replenishment to prevent repeat callbacks.",
    audience: "ICP",
    target_trade: "HVAC",
    pillar: "Operations",
    source: "GOOGLE_TRENDS",
    status: "HARVESTED",
    estimated_cost: 0.038,
    tags: ["HVAC", "Telemetry", "Callbacks", "Warranty"],
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "IDEA-0005",
    ideaId: "IDEA-0005",
    title: "Sub-1.8s Voice Pickup: How HVAC & Plumbing Emergency Intake Beats Voicemail Churn",
    raw_idea: "Sub-1.8s Voice Pickup: How HVAC & Plumbing Emergency Intake Beats Voicemail Churn",
    excerpt: "Speed-to-lead unit economics proving automated real-time voice pickup captures high-ticket emergency replacements before callers bounce to competitors on Google.",
    angle: "Speed-to-lead unit economics proving automated real-time voice pickup captures high-ticket emergency replacements before callers bounce to competitors on Google.",
    audience: "ICP",
    target_trade: "Plumbing",
    pillar: "Revenue",
    source: "REDDIT",
    status: "CLAIMED",
    estimated_cost: 0.042,
    tags: ["Plumbing", "Voice AI", "Speed to Lead"],
    created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "IDEA-0004",
    ideaId: "IDEA-0004",
    title: "Raw JSON Over Agent Summaries: Why Multi-Agent LLM Systems Drift in Production",
    raw_idea: "Raw JSON Over Agent Summaries: Why Multi-Agent LLM Systems Drift in Production",
    excerpt: "Architecture teardown demonstrating deterministic JSON schema validation prevents multi-hop telephone game degradation across distributed LLM workflows.",
    angle: "Architecture teardown demonstrating deterministic JSON schema validation prevents multi-hop telephone game degradation across distributed LLM workflows.",
    audience: "PEER",
    target_trade: "Systems Architecture",
    pillar: "Engineering",
    source: "HACKER_NEWS",
    status: "DRAFTED",
    estimated_cost: 0.038,
    tags: ["Architecture", "JSON", "Agents", "Drift"],
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "IDEA-0003",
    ideaId: "IDEA-0003",
    title: "Commercial Roof Membrane Thermal Stress: Drone Diagnostic Protocols for 10-Tech Operations",
    raw_idea: "Commercial Roof Membrane Thermal Stress: Drone Diagnostic Protocols for 10-Tech Operations",
    excerpt: "Operational framework for deploying thermal imaging drones before storm season to lock high-margin preventive commercial maintenance agreements.",
    angle: "Operational framework for deploying thermal imaging drones before storm season to lock high-margin preventive commercial maintenance agreements.",
    audience: "BRIDGE",
    target_trade: "Roofing",
    pillar: "Operations",
    source: "MANUAL",
    status: "PUBLISHED",
    estimated_cost: 0.045,
    tags: ["Roofing", "Drones", "Preventive Maintenance"],
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "IDEA-0002",
    ideaId: "IDEA-0002",
    title: "Panel Upgrade Bottlenecks: EV Charger Load Calculations & Local Utility Permitting Automation",
    raw_idea: "Panel Upgrade Bottlenecks: EV Charger Load Calculations & Local Utility Permitting Automation",
    excerpt: "Analysis of electrician dispatch delays during 200A residential panel upgrades and how automated load calculations cut permitting turnaround by 60%.",
    angle: "Analysis of electrician dispatch delays during 200A residential panel upgrades and how automated load calculations cut permitting turnaround by 60%.",
    audience: "ICP",
    target_trade: "Electrical",
    pillar: "Operations",
    source: "GOOGLE_TRENDS",
    status: "HARVESTED",
    estimated_cost: 0.036,
    tags: ["Electrical", "EV", "Permitting"],
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "IDEA-0001",
    ideaId: "IDEA-0001",
    title: "Termite Colony Acoustic Sensors vs Traditional Baiting: Unit Economics for Pest Control Operators",
    raw_idea: "Termite Colony Acoustic Sensors vs Traditional Baiting: Unit Economics for Pest Control Operators",
    excerpt: "Exploration of acoustic IoT probes vs manual quarterly visits, evaluating margin impact and false positive rates in residential crawl spaces.",
    angle: "Exploration of acoustic IoT probes vs manual quarterly visits, evaluating margin impact and false positive rates in residential crawl spaces.",
    audience: "ICP",
    target_trade: "Pest Control",
    pillar: "Field Playbook",
    source: "REDDIT",
    status: "REJECTED",
    estimated_cost: 0.032,
    tags: ["Pest Control", "IoT", "Sensors"],
    created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const DEMO_ASSETS = [
  {
    id: "ASSET-0003",
    idea_id: "IDEA-0003",
    title: "Raw JSON Over Agent Summaries: Why Multi-Agent LLM Systems Drift in Production",
    slug: "raw-json-over-agent-summaries",
    audience: "PEER",
    pillar: "Engineering",
    hook: "Every multi-agent system looks invincible in the playground. Then you deploy to production, and the game of telephone begins.",
    hero_image_url: "/images/social-covers/linkedin/linkedin_cover_dark.png",
    status: "PUBLISHED",
    claims_verified: true,
    version: 3,
    generation_cost: 0.0386,
    published_at: "2026-08-16T12:00:00Z",
    blog_url: "https://getminions.ai/blog/raw-json-over-agent-summaries",
    claim_checks: [
      {
        id: "CLM-001",
        claim_text: "July 22 incident: 412 technician dispatches lost customer gate codes due to markdown truncation.",
        source_type: "GO_BENCHMARK",
        verified: "Y",
        confidence_score: 0.99,
        notes: "Verified against internal simulation log trace 2026-07-22"
      },
      {
        id: "CLM-002",
        claim_text: "Deterministic schema validation in Go binary guarantees 100% type safety on ServiceTitan locks.",
        source_type: "GO_BENCHMARK",
        verified: "Y",
        confidence_score: 1.0,
        notes: "Open-source test harness benchmark"
      },
      {
        id: "CLM-003",
        claim_text: "Multi-hop agent summaries drift by up to 34% information loss after 4 conversational hops.",
        source_type: "PUBLIC_CRAWL",
        verified: "Y",
        confidence_score: 0.95,
        notes: "Academic benchmark data cited in appendix"
      }
    ],
    social_variants: [
      {
        id: "VAR-001",
        platform: "LINKEDIN",
        status: "BROADCASTED",
        content: `Most AI multi-agent architectures fail in production because of one architectural mistake: using natural language summaries as the inter-agent wire format.

When Agent A passes a prose summary to Agent B, who passes it to Agent C:
1. Subtle constraints (gate codes, breaker ratings) get smoothed away.
2. Latency compounds linearly with every token generated.
3. Schema drift is impossible to unit test.

At getminions.ai, we replaced all conversational handoffs with strict, strongly-typed JSON schemas validated by a deterministic Go binary.

Here is our engineering teardown on why Raw JSON beats reasoning summaries in high-stakes dispatch systems:`,
        first_comment: "Read the full engineering deep dive here: https://getminions.ai/blog/raw-json-over-agent-summaries",
        published_url: "https://linkedin.com/feed/update/urn:li:activity:71982938472918"
      },
      {
        id: "VAR-002",
        platform: "FACEBOOK",
        status: "BROADCASTED",
        content: `Why we stopped letting our AI agents talk to each other in English.

When you manage 100+ home service dispatches a day, a lost gate code or wrong equipment model costs a contractor $300+ in wasted truck rolls.

We wrote a deep dive on our deterministic JSON architecture that keeps voice and dispatch agents 100% synchronized without drift.`,
        first_comment: "Full technical teardown on our blog: https://getminions.ai/blog/raw-json-over-agent-summaries",
        published_url: "https://facebook.com/getminionsai/posts/1092837482918"
      },
      {
        id: "VAR-003",
        platform: "TWITTER",
        status: "BROADCASTED",
        content: `Natural language is the worst wire format for multi-agent LLM systems.

Pass a prose summary through 3 agents and you get prompt drift, hallucinated constraints, and bloated latency.

Raw JSON with deterministic schema validation fixes this.

Full build log: https://getminions.ai/blog/raw-json-over-agent-summaries`,
        published_url: "https://twitter.com/getminionsai/status/1792837492819"
      }
    ],
    body_content: `Every multi-agent system looks invincible in the playground. 

You wire three LLMs together in a prompt chain. The Strategist drafts a plan. The Writer generates copy. The Critic offers thoughtful feedback. The output reads smoothly, the demo lands with applause, and the architecture diagram looks deceptively clean.

Then you deploy the system to production.

Within forty-eight hours, the cracks appear. Not because the models are unintelligent, but because you built an inter-agent game of telephone.

## The Field Failure of July 22

On July 22, our multi-agent dispatch system encountered its first real stress test. 

A Dallas-based emergency HVAC workflow was processing high-volume distress calls during a 104°F heatwave. Three autonomous agents were responsible for customer triage:

1. **The Ingestion Agent** transcribed audio packets from customer calls.
2. **The Diagnostic Agent** summarized mechanical symptoms (e.g. frozen evaporator coils, humming contactor).
3. **The Dispatch Agent** booked emergency slots and populated work orders in ServiceTitan.

Between the Diagnostic Agent and the Dispatch Agent, we used conversational summaries:

\`\`\`
"Customer reports AC blowing warm air. Unit is humming outside. Gate code is #4821. Note: Dog is in backyard, technician must access through side gate."
\`\`\`

By the time the Dispatch Agent parsed the summary into the final database mutation, the gate code had vanished. The summary compression had classified it as "ancillary conversational detail." 

The technician arrived on-site, could not access the backyard, waited twenty-five minutes in a 105° attic van, and aborted the truck roll. Cost to the contractor: **$240 in wasted technician labor and an infuriated homeowner.**

## The Three Iron Rules of Multi-Agent Systems

After that incident, we rebuilt the entire getminions.ai engine around three structural rules:

### Rule 1: No Prose Between Agents
Agents never pass natural language summaries to one another. The wire format between agents must always be strongly-typed, schema-validated Raw JSON.

### Rule 2: Deterministic Binary Validation
Never trust an LLM to validate another LLM's output. A compiled Go binary validates every JSON payload against strict Pydantic/Zod schemas before any downstream agent receives it.

### Rule 3: Schema Rejection Over Inference
If a required field (e.g. \`gate_code\`, \`equipment_model\`, \`breaker_amperage\`) is missing or null, the payload is immediately rejected back to the ingestion source rather than inferred by downstream reasoning models.

\`\`\`json
{
  "dispatch_id": "DSP-84920",
  "trade": "HVAC",
  "urgency": "EMERGENCY_HEAT",
  "customer": {
    "name": "David Miller",
    "phone": "+1-214-555-0192",
    "gate_code": "#4821",
    "access_notes": "Side gate entrance only, dogs secured indoors"
  },
  "diagnostics": {
    "symptom": "EVAPORATOR_COIL_FREEZE",
    "ambient_temp_f": 104,
    "system_age_years": 8,
    "refrigerant_type": "R-410A"
  },
  "telemetry": {
    "voice_latency_ms": 1420,
    "validation_status": "SCHEMA_LOCKED"
  }
}
\`\`\`

## The Physics of 105°F Attics

When you build software for trade contractors in Dallas, Phoenix, or Atlanta, software design isn't academic. It's thermodynamic.

A technician climbing into a 130°F attic at 3:00 PM does not have the patience to decipher an AI agent's chatty prose. They need deterministic fields: part number, capacitor rating, access code, and homeowner authorization.

By replacing conversational summaries with Raw JSON, our inter-agent latency dropped by **68%**, token costs fell by **44%**, and field dispatch errors dropped to exactly **zero**.

## Operator Takeaway

If you are designing multi-agent AI systems in 2026:
- Strip the conversational fluff from your inter-agent payloads.
- Enforce strict JSON schemas at every boundary.
- Let code handle validation, and let models handle perception.

---
*Built by Parvej and Rakib from the getminions.ai engineering team in Dhaka. Test our live dispatcher at getminions.ai.*`,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "ASSET-0004",
    idea_id: "IDEA-0004",
    title: "The $3,800 Attic Saturation Leak: Why HVAC Warranties Fail in High Heat",
    slug: "attic-saturation-leak-hvac-warranties",
    audience: "ICP",
    pillar: "Operations",
    hook: "In 105°F heat, an AC diagnostic isn't just mechanical—it's thermodynamic. Here is why Texas contractors bleed 2.5 hours per warranty redo.",
    hero_image_url: "/images/social-covers/twitter/twitter_cover_dark.png",
    status: "PENDING_REVIEW",
    claims_verified: false,
    version: 1,
    generation_cost: 0.0382,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updated_at: new Date().toISOString(),
    claim_checks: [
      {
        id: "CLM-004",
        claim_text: "Austin attic temperatures reach 138°F during peak summer afternoons.",
        source_type: "OPERATOR_DISPATCH_DATA",
        verified: "Y",
        confidence_score: 0.98,
        notes: "Validated by thermal camera sensor data from field techs"
      },
      {
        id: "CLM-005",
        claim_text: "Contractors spend an average of $3,800 per month on unbilled callback labor.",
        source_type: "PUBLIC_CRAWL",
        verified: "N",
        confidence_score: 0.72,
        notes: "Requires citation from ACHR News or trade survey"
      }
    ],
    social_variants: [
      {
        id: "VAR-004",
        platform: "LINKEDIN",
        status: "READY",
        content: `Texas HVAC contractors: your biggest margin leak isn't customer acquisition. It's attic thermal saturation callbacks.

When a technician replaces a capacitor in a 130°F attic without verifying airflow pressure differentials, the unit trips again within 48 hours.

Here is how automated diagnostic telemetry prevents the 2.5-hour warranty callback:`,
        first_comment: "Draft review staged in Minions Cockpit."
      }
    ],
    body_content: `In 105°F heat, an AC diagnostic isn't just mechanical—it's thermodynamic.

When an HVAC technician climbs into an unventilated Texas attic in mid-July, the ambient temperature regularly exceeds 130°F. Under those conditions, cognitive fatigue sets in within fifteen minutes.

## The Warranty Callback Loop

A customer calls reporting a system blowing warm air. The technician diagnoses a failed run capacitor, swaps the part, verifies the fan spins, and marks the ticket complete.

Forty-eight hours later, the customer calls back. The evaporator coil has completely frozen over.

Why? Because the original failure was caused by static pressure resistance in the ductwork that was never diagnosed during the fifteen-minute attic rush.

## Eliminating the Redo with Automated Telemetry

At getminions.ai, we built automated diagnostic capture into the dispatch workflow.

Before a technician closes a ticket, our system validates three operational thresholds:
1. Static pressure delta across the coil.
2. Superheat and subcooling readings compared against manufacturer curves.
3. Photo verification of filter cleanliness and capacitor microfarad ratings.

The result: warranty callbacks reduced by 74%, saving contractors an average of 2.5 technician hours per job.`
  }
];

export const DEMO_FLEET: AgentWorkerItem[] = [
  {
    id: "WORKER-001",
    name: "Marketing Strategist",
    role: "Angle Formulation & Thesis Defense",
    type: "Marketing & Strategy",
    model: "qwen3.7-max",
    status: "ACTIVE",
    system_prompt: "You are the Lead Marketing Strategist for getminions.ai. Formulate high-entropy thesis angles for US home service operators (HVAC, plumbing, electrical) and systems engineers. Enforce zero AI cheerleading and strict 1–3 sentence prose.",
    last_active: "Active · Schedule Tue/Fri 06:00 Asia/Dhaka",
    total_runs: 48
  },
  {
    id: "WORKER-002",
    name: "Staff Writer",
    role: "5-Stage Stripe/Linear Long-Form Prose",
    type: "Content Engine",
    model: "qwen-plus",
    status: "ACTIVE",
    system_prompt: "You are the Principal Content Writer for getminions.ai. Write 800–1200 word deep dives using the 5-stage Linear/Stripe cadence (Hook, Field Reality, Systems Teardown, Proof, Operator Takeaway). Strictly follow brand DO/DONT rules.",
    last_active: "Active · On Claim Trigger",
    total_runs: 42
  },
  {
    id: "WORKER-003",
    name: "Lead Editorial Reviewer",
    role: "Claims Gate & Style Enforcement",
    type: "Safety & Quality Gate",
    model: "qwen3.7-flash",
    status: "ACTIVE",
    system_prompt: "You are the Senior Editor for getminions.ai. Enforce the Claims Verification Gate. Extract every factual/numeric assertion and classify against proven benchmarks. Ban prohibited buzzwords.",
    last_active: "Active · Automated Gate",
    total_runs: 45
  },
  {
    id: "WORKER-004",
    name: "Visual Art Director",
    role: "2K Commercial Studio Flat-Lay Cover Art",
    type: "Multimodal Visual Engine",
    model: "qwen-image-3.0",
    status: "ACTIVE",
    system_prompt: "Generate tactile commercial studio flat-lay photography for getminions.ai blog covers. Real stitched leather clipboards, metallic clips, dark slate tabletops, and crisp minimalist typography with [ARCHITECT] badges.",
    last_active: "Active · Multimodal Engine",
    total_runs: 38
  }
];

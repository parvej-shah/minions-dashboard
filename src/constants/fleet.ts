/**
 * The real agent fleet, transcribed from the live n8n workflows.
 *
 * Every field below was read off the n8n node definitions (`01_idea_harvester`
 * id `Ykpl0pQTzBdZlDcA`, `02_idea_to_asset` id `0ZeUkMgGXpBKVB2A`) rather than
 * invented for the UI, so `workflow` / `node` / `model` / `temperature` /
 * `maxTokens` can be reconciled against n8n by hand at any time.
 *
 * There is no `agent_workers` table — the fleet is not operator-editable data,
 * it is a description of the workflows. Run totals and status are the only
 * live parts, and `services/agents.ts` derives those from Prisma.
 *
 * If a node is retuned in n8n, update it here in the same change.
 */

import { DASHSCOPE_CHAT_URL, DASHSCOPE_IMAGE_URL } from "@/constants/dashscope";

/** Which pipeline a stage belongs to, and therefore what its runs are counted in. */
export type FleetCountBasis = "IDEAS" | "ASSETS";

export interface PipelineAgentDefinition {
  id: string;
  name: string;
  /** Plain-English role for the Fleet page card. */
  simpleRole: string;
  /** Internal role line used by the API payload. */
  role: string;
  type: string;
  description: string;
  model: string;
  modelBadge: string;
  /** n8n workflow name. */
  workflow: string;
  /** Node name inside that workflow. */
  node: string;
  /** Human-readable stage label, e.g. "Workflow 02 · Stage 2". */
  n8nStage: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
  /** What a "run" means for this stage. */
  runsUnit: string;
  countBasis: FleetCountBasis;
  schedule: string;
  systemPrompt: string;
  avatar: string;
  accent: string;
}

export const PIPELINE_AGENTS: PipelineAgentDefinition[] = [
  {
    id: "WORKER-001",
    name: "Signal Harvester",
    simpleRole: "Trend & Pain-Point Scout",
    role: "RSS Signal Harvesting",
    type: "Autonomous Scout",
    description:
      "Reads the source feeds (Hacker News, TechCrunch AI, industry blogs, and Home Services via Google News) and turns raw items into candidate ideas for the Idea Stream.",
    model: "AI Core Max",
    modelBadge: "High Reasoning",
    workflow: "01_idea_harvester",
    node: "AI Harvest",
    n8nStage: "Market Signal Radar",
    provider: DASHSCOPE_CHAT_URL,
    temperature: 0.75,
    maxTokens: 2500,
    runsUnit: "ideas harvested",
    countBasis: "IDEAS",
    schedule: "Scheduled feed sweep + manual trigger",
    systemPrompt:
      "Scan the incoming feed items and extract topics that a US home-services operator would actually care about. Reject anything that is pure AI industry news with no operator consequence.",
    avatar: "/images/mascots/zip.png",
    accent: "#00C9A7",
  },
  {
    id: "WORKER-002",
    name: "Signal Refiner",
    simpleRole: "Angle & Evidence Shaper",
    role: "Idea Refinement & Scoring",
    type: "Autonomous Scout",
    description:
      "Takes each harvested signal and shapes it into a usable brief — the angle, the audience, the trade, and what evidence the draft will have to carry.",
    model: "AI Core Flash",
    modelBadge: "Fast Refiner",
    workflow: "01_idea_harvester",
    node: "AI Refine",
    n8nStage: "Workflow 01 · Refine",
    provider: DASHSCOPE_CHAT_URL,
    temperature: 0.6,
    maxTokens: 1500,
    runsUnit: "ideas harvested",
    countBasis: "IDEAS",
    schedule: "Runs inline after every harvest",
    systemPrompt:
      "Refine each harvested idea into a brief: sharpen the angle, set the audience and target trade, and state the evidence the article must supply.",
    avatar: "/images/mascots/pip.png",
    accent: "#3B82F6",
  },
  {
    id: "WORKER-003",
    name: "Marketing Strategist",
    simpleRole: "Topic & Angle Formulator",
    role: "Angle Formulation & Thesis Defense",
    type: "Autonomous Strategist",
    description:
      "Turns a claimed idea into a defensible thesis with a contrarian angle before a single word of the article is written.",
    model: "AI Core Max",
    modelBadge: "High Reasoning",
    workflow: "02_idea_to_asset",
    node: "Executive Strategist Agent",
    n8nStage: "Workflow 02 · Stage 1",
    provider: DASHSCOPE_CHAT_URL,
    temperature: 0.5,
    maxTokens: 2000,
    runsUnit: "assets drafted",
    countBasis: "ASSETS",
    schedule: "Triggers when an idea is claimed",
    systemPrompt:
      "You are the Lead Marketing Strategist for getminions.ai. Formulate high-entropy thesis angles for US home service operators (HVAC, plumbing, electrical) and systems engineers. Enforce zero AI cheerleading and strict 1–3 sentence prose.",
    avatar: "/images/social-avatars/ai-generated/linkedin_profile_avatar_ai.jpg",
    accent: "#00C9A7",
  },
  {
    id: "WORKER-004",
    name: "Staff Writer",
    simpleRole: "Long-Form Article Drafter",
    role: "Long-Form Deep Dives",
    type: "Content Engine",
    description:
      "Drafts the 800–1,200 word deep dive using the Stripe/Linear editorial cadence: Hook, Field Reality, Systems Teardown, Proof, Operator Takeaway.",
    model: "AI Core Plus",
    modelBadge: "Long-Form Writer",
    workflow: "02_idea_to_asset",
    node: "AI Call 2 Writer",
    n8nStage: "Workflow 02 · Stage 2",
    provider: DASHSCOPE_CHAT_URL,
    temperature: 0.7,
    maxTokens: 4000,
    runsUnit: "assets drafted",
    countBasis: "ASSETS",
    schedule: "Runs inline after the strategist",
    systemPrompt:
      "You are the Principal Content Writer for getminions.ai. Write 800–1200 word deep dives using the 5-stage Linear/Stripe cadence (Hook, Field Reality, Systems Teardown, Proof, Operator Takeaway). Strictly follow brand DO/DONT rules.",
    avatar: "/images/social-avatars/ai-generated/twitter_profile_avatar_ai.jpg",
    accent: "#F1F5F9",
  },
  {
    id: "WORKER-005",
    name: "Lead Editorial Reviewer",
    simpleRole: "Claims Gate & Quality Verifier",
    role: "Claims Gate & Style Enforcement",
    type: "Safety & Quality Gate",
    description:
      "Extracts every numeric claim, pricing metric, and field benchmark from the draft and classifies it, so unproven assertions surface in the Editorial Studio instead of on the blog.",
    model: "AI Core Flash",
    modelBadge: "Quality Gate",
    workflow: "02_idea_to_asset",
    node: "AI Call 3 Editor",
    n8nStage: "Workflow 02 · Stage 3",
    provider: DASHSCOPE_CHAT_URL,
    temperature: 0.3,
    maxTokens: 4000,
    runsUnit: "assets drafted",
    countBasis: "ASSETS",
    schedule: "Automated pre-review gate",
    systemPrompt:
      "You are the Senior Editor for getminions.ai. Enforce the Claims Verification Gate. Extract every factual/numeric assertion and classify against proven benchmarks. Ban prohibited buzzwords.",
    avatar: "/images/mascots/otto.png",
    accent: "#3B82F6",
  },
  {
    id: "WORKER-006",
    name: "Social Distribution Writer",
    simpleRole: "LinkedIn / Facebook / X Variants",
    role: "Omnichannel Variant Generation",
    type: "Content Engine",
    description:
      "A separate model call that rewrites the approved article into ready-to-post LinkedIn, Facebook, and X copy — it is not the editor wearing a second hat.",
    model: "AI Core Flash",
    modelBadge: "Fast Variants",
    workflow: "02_idea_to_asset",
    node: "AI Call 4 Variants",
    n8nStage: "Workflow 02 · Stage 4",
    provider: DASHSCOPE_CHAT_URL,
    temperature: 0.8,
    maxTokens: 2500,
    runsUnit: "assets drafted",
    countBasis: "ASSETS",
    schedule: "Runs inline after the claims gate",
    systemPrompt:
      "Rewrite the approved article into channel-native LinkedIn, Facebook, and X variants. Keep the operator voice; no hashtag spam, no AI cheerleading.",
    avatar: "/images/social-avatars/ai-generated/facebook_profile_avatar_ai.jpg",
    accent: "#8B5CF6",
  },
  {
    id: "WORKER-007",
    name: "Visual Art Director",
    simpleRole: "Cover Art Creator",
    role: "Commercial Studio Flat-Lay Cover Art",
    type: "Multimodal Visual Engine",
    description:
      "Synthesizes the 1280×720 commercial studio flat-lay cover: stitched leather clipboards, metallic clips, dark slate tabletops, crisp minimalist typography.",
    model: "AI Image Generation",
    modelBadge: "Visual Studio",
    workflow: "02_idea_to_asset",
    node: "AI Image 3.0 Pro Generation",
    n8nStage: "Workflow 02 · Cover Art",
    provider: DASHSCOPE_IMAGE_URL,
    runsUnit: "assets drafted",
    countBasis: "ASSETS",
    schedule: "Automated multimodal engine",
    systemPrompt:
      "Generate tactile commercial studio flat-lay photography for getminions.ai blog covers. Real stitched leather clipboards, metallic clips, dark slate tabletops, and crisp minimalist typography with [ARCHITECT] badges.",
    avatar: "/images/social-avatars/ai-generated/github_profile_avatar_ai.jpg",
    accent: "#F59E0B",
  },
];

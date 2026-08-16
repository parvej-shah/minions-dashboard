import { NextResponse } from "next/server";

export interface PublishedPostRecord {
  id: string;
  asset_id: string;
  platform: "BLOG" | "LINKEDIN" | "FACEBOOK" | "TWITTER";
  title: string;
  excerpt: string;
  hero_image_url: string;
  published_url: string;
  audience: "ICP" | "PEER" | "BRIDGE";
  cost_usd: number;
  published_at: string;
  first_comment?: string;
}

export const PUBLISHED_FEED: PublishedPostRecord[] = [
  {
    id: "PUB-001",
    asset_id: "ASSET-0003",
    platform: "BLOG",
    title: "Raw JSON Over Agent Summaries: Why Multi-Agent LLM Systems Drift in Production",
    excerpt: "Every multi-agent system looks invincible in the playground. Then you deploy to production, and the game of telephone begins. Here is why deterministic JSON schemas beat reasoning summaries.",
    hero_image_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/raw-json-over-agent-summaries.png",
    published_url: "https://getminions.ai/blog/raw-json-over-agent-summaries",
    audience: "PEER",
    cost_usd: 0.0386,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    first_comment: "Full technical teardown with Go validator benchmarks."
  },
  {
    id: "PUB-002",
    asset_id: "ASSET-0003",
    platform: "LINKEDIN",
    title: "Why we stopped letting our AI agents talk to each other in English",
    excerpt: "When Agent A passes a prose summary to Agent B, subtle constraints get smoothed away, latency compounds, and schema drift is impossible to unit test.",
    hero_image_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/raw-json-over-agent-summaries.png",
    published_url: "https://linkedin.com/company/getminionsai",
    audience: "PEER",
    cost_usd: 0.0386,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(),
    first_comment: "Read the full engineering deep dive: https://getminions.ai/blog/raw-json-over-agent-summaries"
  },
  {
    id: "PUB-003",
    asset_id: "ASSET-0003",
    platform: "FACEBOOK",
    title: "The $240 Wasted Attic Truck Roll: Why Multi-Agent Chat Fails in Dispatch",
    excerpt: "When you manage 100+ home service dispatches a day, a lost gate code or wrong equipment model costs a contractor $300+ in wasted labor.",
    hero_image_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/raw-json-over-agent-summaries.png",
    published_url: "https://facebook.com/getminionsai",
    audience: "ICP",
    cost_usd: 0.0386,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    first_comment: "Full case study on getminions.ai/blog"
  },
  {
    id: "PUB-004",
    asset_id: "ASSET-0001",
    platform: "BLOG",
    title: "Deterministic WebSocket Voice Pipelines: Sub-1.8s Latency in Field Operations",
    excerpt: "Speed-to-lead benchmarks showing how sub-1.8s audio packet processing prevents emergency callers from hanging up.",
    hero_image_url: "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/raw-json-over-agent-summaries.png",
    published_url: "https://getminions.ai/blog",
    audience: "PEER",
    cost_usd: 0.0392,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    first_comment: "Benchmark code on GitHub."
  }
];

export async function GET() {
  return NextResponse.json(PUBLISHED_FEED);
}

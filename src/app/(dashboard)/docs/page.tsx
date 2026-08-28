"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Code2,
  Share2,
  Palette,
  Bot,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Layers,
  ShieldCheck,
  Sparkles,
  Zap,
  Globe,
} from "lucide-react";

export const dynamic = "force-dynamic";

function DocsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  function copyCode(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const nextJsWebhookSnippet = `import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db"; // Replace with your Prisma/Drizzle db client

const webhookSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  hook: z.string().optional().nullable(),
  content: z.string().min(1),
  hero_image_url: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  published_at: z.string().datetime().optional().nullable(),
});

function verifySecret(authHeader: string | null): boolean {
  const secret = process.env.MINIONS_WEBHOOK_SECRET;
  if (!secret) return true; // Open if secret not configured
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\\s+/i, "").trim();
  const tokenBuf = Buffer.from(token, "utf8");
  const secretBuf = Buffer.from(secret, "utf8");
  if (tokenBuf.length !== secretBuf.length) return false;
  return crypto.timingSafeEqual(tokenBuf, secretBuf);
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || request.headers.get("x-webhook-secret");
  if (!verifySecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = webhookSchema.parse(body);

  const post = await db.post.upsert({
    where: { slug: parsed.slug },
    update: {
      title: parsed.title,
      excerpt: parsed.excerpt || parsed.hook || parsed.title,
      content: parsed.content,
      coverUrl: parsed.hero_image_url || parsed.coverImageUrl,
      publishedAt: parsed.published_at ? new Date(parsed.published_at) : new Date(),
    },
    create: {
      slug: parsed.slug,
      title: parsed.title,
      excerpt: parsed.excerpt || parsed.hook || parsed.title,
      content: parsed.content,
      coverUrl: parsed.hero_image_url || parsed.coverImageUrl,
      publishedAt: parsed.published_at ? new Date(parsed.published_at) : new Date(),
    },
  });

  revalidatePath("/blog");
  revalidatePath(\`/blog/\${post.slug}\`);

  return NextResponse.json({ success: true, slug: post.slug });
}`;

  const pythonFastApiSnippet = `import hmac
import os
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel, HttpUrl

app = FastAPI()

class MinionsWebhookPayload(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = None
    hook: Optional[str] = None
    content: str
    hero_image_url: Optional[HttpUrl] = None
    published_at: Optional[datetime] = None

@app.post("/api/webhooks/minions")
async def receive_minions_post(
    payload: MinionsWebhookPayload,
    authorization: Optional[str] = Header(None),
    x_webhook_secret: Optional[str] = Header(None),
):
    secret = os.getenv("MINIONS_WEBHOOK_SECRET")
    if secret:
        token = (authorization or x_webhook_secret or "").replace("Bearer ", "").strip()
        if not hmac.compare_digest(token, secret):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid secret")

    # Upsert to your database (SQLAlchemy, Tortoise, etc.)
    print(f"Publishing article: {payload.title} ({payload.slug})")
    
    return {"success": True, "slug": payload.slug}`;

  const aiDirectivePrompt = `You are an expert Executive Brand & Editorial Voice Architect for Minions.AI.
Analyze my company and executive profile below to generate a tailored, comprehensive 40-point Brand Directives configuration.

My Company & Profile:
- Company Name: [YOUR COMPANY NAME]
- Website / Elevator Pitch: [PASTE YOUR PITCH OR WEBSITE SUMMARY]
- Primary Audience / ICP: [E.g., Senior Software Architects, Enterprise Sales Leaders, Plumbing Contractors]
- Core Philosophy: [E.g., Production-first engineering, pragmatic ROI, anti-cliche]

Generate the following 4 structured sections:

### 1. TARGET AUDIENCE PERSONAS (3 Detailed ICPs)
For each ICP, define:
- Title & Role
- Primary Technical / Operational Frustration
- What Conviction & Proof Points They Value (e.g. real benchmarks, unit economics, production code)

### 2. CORE EDITORIAL VOICE PILLARS (5 Uncompromising Rules)
Formulate 5 explicit editorial rules that our AI writers must follow (e.g. "Always start with the concrete operational failure before proposing solutions", "Never cite speculative future trends without referencing present implementations").

### 3. FORBIDDEN BUZZWORDS & PHRASES (Minimum 15 Words)
Provide a strict blacklist of overused corporate and AI cliches that must NEVER appear in our drafts (e.g., "In today's fast-paced digital landscape", "Game-changing", "Seamlessly", "Delve", "Tapestry", "Beacon", "Unleash").

### 4. 2 FEW-SHOT EXEMPLARY LINKEDIN POSTS
Write 2 high-conviction, authentic LinkedIn posts demonstrating:
- A strong, counter-intuitive opening hook
- Concrete bulleted breakdown with numbers/code
- A pragmatic takeaway
- NO outbound links in the body (mention that the link is in the first comment)`;

  const tabs = [
    { id: "overview", label: "System Overview", icon: Layers },
    { id: "webhooks", label: "Blog & Webhooks", icon: Code2 },
    { id: "social", label: "LinkedIn & Social", icon: Share2 },
    { id: "brand", label: "Brand Directives & AI Prompt", icon: Palette },
    { id: "ai-agents", label: "AI Developer (llms.txt)", icon: Bot },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <BookOpen className="w-3.5 h-3.5 text-[#00C9A7]" />
            <span>Developer Manual & Knowledge Base</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Documentation & Integration Guide
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Learn how Minions.AI works, how to connect your blog webhook, configure LinkedIn broadcasting, and calibrate your brand voice.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/llms.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0F1419] border border-[#1F2D3D] text-xs font-mono text-[#00C9A7] hover:border-[#00C9A7] transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>View llms.txt</span>
            <ExternalLink className="w-3 h-3 text-[#64748B]" />
          </a>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#1F2D3D] pb-3 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#00C9A7]/15 text-[#00C9A7] border border-[#00C9A7]/30 shadow-sm"
                  : "bg-[#0F1419] text-[#94A3B8] border border-[#1F2D3D] hover:text-[#F1F5F9] hover:border-[#334155]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: SYSTEM OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#00C9A7]/10 border border-[#00C9A7]/20 flex items-center justify-center text-[#00C9A7]">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#F1F5F9]">What is Minions.AI?</h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Minions.AI is a multi-tenant autonomous content marketing engine. It replaces traditional manual writing cycles with an automated state machine that harvests market signals, crafts deep-dive technical articles, generates 16:8 cover art, and broadcasts directly to your blog and social channels.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-[#94A3B8]">
                  <Check className="w-4 h-4 text-[#00C9A7] shrink-0 mt-0.5" />
                  <span><strong className="text-[#F1F5F9]">Zero Human Drafter Delay:</strong> Researches, writes, and formats production-ready case studies automatically.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-[#94A3B8]">
                  <Check className="w-4 h-4 text-[#00C9A7] shrink-0 mt-0.5" />
                  <span><strong className="text-[#F1F5F9]">Executive Voice Alignment:</strong> Calibrated against your strict brand directives to eliminate generic AI cliches.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-[#94A3B8]">
                  <Check className="w-4 h-4 text-[#00C9A7] shrink-0 mt-0.5" />
                  <span><strong className="text-[#F1F5F9]">Omnichannel Reach:</strong> Synchronously dispatches to Webhooks, LinkedIn, Facebook, and X.</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#F1F5F9]">The 4-Stage Autonomous Pipeline</h2>
              <div className="space-y-3 text-xs text-[#94A3B8]">
                <div className="p-3 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-1">
                  <div className="font-bold text-[#00C9A7] font-mono">1. Idea Harvester</div>
                  <p>Monitors industry signals, GitHub releases, and competitor whitepapers to produce high-conviction editorial proposals.</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-1">
                  <div className="font-bold text-[#8B5CF6] font-mono">2. Asset Drafter & Visual Engine</div>
                  <p>Drafts long-form markdown articles, tailored social hooks, and synthesizes 1200x630 branded widescreen cover art.</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-1">
                  <div className="font-bold text-[#ff6b4a] font-mono">3. Editorial Studio & Review Dock</div>
                  <p>Executive review interface with 1-click approvals, inline markdown editing, and distribution toggles.</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-1">
                  <div className="font-bold text-[#3B82F6] font-mono">4. Omnichannel Broadcast Engine</div>
                  <p>Broadcasts live to your blog webhook, LinkedIn (with auto-first comment link), Facebook, and X.</p>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F1419] to-[#161D26] border border-[#1F2D3D] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F1F5F9]">Ready to connect your website?</h3>
              <p className="text-xs text-[#94A3B8]">
                Connect your custom blog webhook or LinkedIn account to start broadcasting live.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("webhooks")}
                className="px-4 py-2 rounded-xl bg-[#00C9A7] text-[#070B0F] text-xs font-mono font-bold hover:bg-[#00E5BE] transition-colors"
              >
                View Webhook Guide →
              </button>
              <Link
                href="/fleet"
                className="px-4 py-2 rounded-xl bg-[#070B0F] border border-[#1F2D3D] text-xs font-mono text-[#F1F5F9] hover:border-[#00C9A7] transition-colors"
              >
                Go to Fleet (/fleet)
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BLOG & WEBHOOKS */}
      {activeTab === "webhooks" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F9]">Custom Blog Webhook Specification</h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  When an article is approved in Editorial Studio, Minions POSTs a JSON payload to your custom endpoint.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20">
                HTTP POST
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-mono text-[#00C9A7] uppercase tracking-wider font-bold">1. Payload JSON Contract</h3>
              <div className="relative">
                <pre className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] text-xs font-mono text-[#F1F5F9] overflow-x-auto">
{`{
  "asset_id": "bab02951-9cb5-4e46-b056-635c35b42c8c",
  "title": "Why Browser Agents Fail in Production Without Semantic Layers",
  "slug": "why-browser-agents-fail-in-production-without-semantic-layers",
  "hook": "Browser agents do not fail because the model is bad...",
  "excerpt": "Brief summary of the article for blog index cards.",
  "content": "## Full Markdown Content\\n\\n...",
  "hero_image_url": "https://pub-13629069dfd74891bffc487ab4e135f5.r2.dev/assets/bab02951-hero.png",
  "audience": "CTOs, Lead Frontend Engineers, Platform Architects",
  "published_at": "2026-08-28T00:00:00.000Z"
}`}
                </pre>
                <button
                  onClick={() => copyCode(`{\n  "title": "Why Browser Agents Fail in Production Without Semantic Layers",\n  "slug": "why-browser-agents-fail-in-production-without-semantic-layers",\n  "excerpt": "Brief summary",\n  "content": "## Article content",\n  "hero_image_url": "https://...",\n  "published_at": "2026-08-28T00:00:00.000Z"\n}`, "json")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-[#161D26] border border-[#1F2D3D] text-xs font-mono text-[#94A3B8] hover:text-[#00C9A7] transition-colors"
                >
                  {copiedId === "json" ? <Check className="w-3.5 h-3.5 text-[#00C9A7]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-mono text-[#00C9A7] uppercase tracking-wider font-bold">2. Next.js App Router Receiver (Copy-Paste)</h3>
              <p className="text-xs text-[#94A3B8]">
                Save this to <code className="text-[#00C9A7] font-mono">app/api/webhooks/minions/route.ts</code> in your Next.js project:
              </p>
              <div className="relative">
                <pre className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] text-xs font-mono text-[#F1F5F9] overflow-x-auto max-h-[380px]">
                  {nextJsWebhookSnippet}
                </pre>
                <button
                  onClick={() => copyCode(nextJsWebhookSnippet, "nextjs")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-[#161D26] border border-[#1F2D3D] text-xs font-mono text-[#94A3B8] hover:text-[#00C9A7] transition-colors"
                >
                  {copiedId === "nextjs" ? <Check className="w-3.5 h-3.5 text-[#00C9A7]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-mono text-[#00C9A7] uppercase tracking-wider font-bold">3. Python FastAPI Receiver (Copy-Paste)</h3>
              <div className="relative">
                <pre className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] text-xs font-mono text-[#F1F5F9] overflow-x-auto max-h-[300px]">
                  {pythonFastApiSnippet}
                </pre>
                <button
                  onClick={() => copyCode(pythonFastApiSnippet, "fastapi")}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-[#161D26] border border-[#1F2D3D] text-xs font-mono text-[#94A3B8] hover:text-[#00C9A7] transition-colors"
                >
                  {copiedId === "fastapi" ? <Check className="w-3.5 h-3.5 text-[#00C9A7]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#1F2D3D]">
              <h3 className="text-xs font-mono text-[#00C9A7] uppercase tracking-wider font-bold">4. WordPress & Webflow (No-Code Setup)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#94A3B8]">
                <div className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-2">
                  <h4 className="font-bold text-[#F1F5F9]">WordPress via WP Webhooks</h4>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Install free <strong>WP Webhooks</strong> plugin.</li>
                    <li>Go to Settings → WP Webhooks → Receive Data.</li>
                    <li>Create hook for <strong>Create Post</strong> action.</li>
                    <li>Map <code className="text-[#00C9A7]">title</code>, <code className="text-[#00C9A7]">content</code>, <code className="text-[#00C9A7]">slug</code>.</li>
                    <li>Paste the Webhook URL in Minions Cockpit.</li>
                  </ol>
                </div>
                <div className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-2">
                  <h4 className="font-bold text-[#F1F5F9]">Webflow via Zapier / Make</h4>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Create a <strong>Webhooks by Zapier</strong> Catch Hook.</li>
                    <li>Add Action: <strong>Webflow Create Live Item</strong>.</li>
                    <li>Map Title, Slug, Body, and Hero Image URL.</li>
                    <li>Copy Zapier Catch URL and paste in Minions.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LINKEDIN & SOCIAL */}
      {activeTab === "social" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4">
            <h2 className="text-lg font-bold text-[#F1F5F9]">LinkedIn & Social Distribution</h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Minions.AI connects to your LinkedIn profile or Company Page using the LinkedIn Community API.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00C9A7]" />
                  <h3 className="text-sm font-bold text-[#F1F5F9]">Personal Profile Broadcasting</h3>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Broadcasts executive thought-leadership articles directly to your personal network with your verified byline.
                </p>
                <div className="text-xs font-mono p-3 rounded-lg bg-[#0F1419] border border-[#1F2D3D] text-[#94A3B8]">
                  URN Format: <span className="text-[#00C9A7]">urn:li:person:YOUR_ID</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#3B82F6]" />
                  <h3 className="text-sm font-bold text-[#F1F5F9]">Company Page Broadcasting</h3>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Publishes directly to your LinkedIn Company or Organization Page followers.
                </p>
                <div className="text-xs font-mono p-3 rounded-lg bg-[#0F1419] border border-[#1F2D3D] text-[#94A3B8]">
                  URN Format: <span className="text-[#3B82F6]">urn:li:organization:PAGE_ID</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-3 mt-4">
              <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00C9A7]" />
                <span>The Automated First-Comment Protocol</span>
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                LinkedIn algorithm penalizes posts with outbound links in the primary body text. Minions solves this automatically:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-[#94A3B8]">
                <li>Formats the post body with bold hook lines, structured line breaks, and hashtag tags without external links.</li>
                <li>Within 60 seconds of publication, Minions dispatches an automated first comment containing the canonical backlink to your website blog post: <code className="text-[#00C9A7]">👉 Read the full operational field guide: https://yoursite.com/blog/...</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BRAND DIRECTIVES & AI PROMPT */}
      {activeTab === "brand" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4">
            <h2 className="text-lg font-bold text-[#F1F5F9]">Brand Directives & Voice Calibration</h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Brand Directives are the core rules that guide the AI Strategist and Writer agents. They prevent generic corporate fluff and ensure every post reflects your authentic domain expertise.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-1.5">
                <div className="text-xs font-mono text-[#00C9A7] font-bold">1. Audience ICPs</div>
                <p className="text-xs text-[#94A3B8]">Defines exact reader titles and what proof points they respect (e.g. unit economics, code snippets).</p>
              </div>
              <div className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-1.5">
                <div className="text-xs font-mono text-[#8B5CF6] font-bold">2. Voice Pillars</div>
                <p className="text-xs text-[#94A3B8]">Strict editorial philosophy (e.g. "Always start with the operational failure before the solution").</p>
              </div>
              <div className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-1.5">
                <div className="text-xs font-mono text-[#ff6b4a] font-bold">3. Forbidden Words</div>
                <p className="text-xs text-[#94A3B8]">Blacklist of overused AI cliches (e.g. "game-changer", "delve", "tapestry", "seamlessly").</p>
              </div>
              <div className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-1.5">
                <div className="text-xs font-mono text-[#3B82F6] font-bold">4. Few-Shot Posts</div>
                <p className="text-xs text-[#94A3B8]">2-3 authentic exemplary posts that the model mirrors for formatting, rhythm, and cadence.</p>
              </div>
            </div>

            {/* AI PROMPT GENERATOR */}
            <div className="p-5 rounded-xl bg-[#070B0F] border border-[#00C9A7]/30 space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00C9A7]" />
                  <h3 className="text-sm font-bold text-[#F1F5F9]">AI Brand Directive Prompt Generator</h3>
                </div>
                <span className="text-[11px] font-mono text-[#00C9A7]">Copy & Paste into ChatGPT / Claude</span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Don&apos;t want to write directives from scratch? Copy this prompt, fill in your company details, and paste it into Claude or ChatGPT to generate your exact 40-point brand directive configuration:
              </p>

              <div className="relative mt-2">
                <pre className="p-4 rounded-xl bg-[#0F1419] border border-[#1F2D3D] text-xs font-mono text-[#F1F5F9] overflow-x-auto max-h-[340px] whitespace-pre-wrap">
                  {aiDirectivePrompt}
                </pre>
                <button
                  onClick={() => copyCode(aiDirectivePrompt, "prompt")}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[#00C9A7] text-[#070B0F] text-xs font-mono font-bold hover:bg-[#00E5BE] transition-colors flex items-center gap-1.5"
                >
                  {copiedId === "prompt" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === "prompt" ? "Copied Prompt!" : "Copy Prompt"}</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <Link
                  href="/brand"
                  className="text-xs font-mono text-[#00C9A7] hover:underline flex items-center gap-1"
                >
                  <span>Go to Brand & Directives to paste output</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI DEVELOPER (llms.txt) */}
      {activeTab === "ai-agents" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#00C9A7] uppercase tracking-wider font-bold">
              <Bot className="w-4 h-4 text-[#00C9A7]" />
              <span>Machine-Readable Semantic Specification</span>
            </div>
            <h2 className="text-lg font-bold text-[#F1F5F9]">AI Coding Assistant Integration (`llms.txt`)</h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Minions.AI implements the standardized <code className="text-[#00C9A7] font-mono">/llms.txt</code> protocol. If you use AI developer tools like <strong>Cursor</strong>, <strong>Claude Code</strong>, <strong>Antigravity</strong>, or <strong>ChatGPT</strong>, you can prompt your AI to build your integrations directly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <a
                href="/llms.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] hover:border-[#00C9A7] transition-all block group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-mono text-xs font-bold text-[#00C9A7]">/llms.txt</div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#00C9A7]" />
                </div>
                <p className="text-xs text-[#94A3B8]">Compact machine-readable summary with endpoints, payload schemas, and quickstart code.</p>
              </a>

              <a
                href="/llms-full.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] hover:border-[#00C9A7] transition-all block group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-mono text-xs font-bold text-[#3B82F6]">/llms-full.txt</div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#3B82F6]" />
                </div>
                <p className="text-xs text-[#94A3B8]">Exhaustive technical documentation, security verification, and framework templates.</p>
              </a>
            </div>

            <div className="p-5 rounded-xl bg-[#070B0F] border border-[#1F2D3D] space-y-3 mt-4">
              <h3 className="text-sm font-bold text-[#F1F5F9]">Sample Prompt for Your AI Coding Assistant</h3>
              <p className="text-xs text-[#94A3B8]">
                Paste this into Cursor Composer, Claude Code, or Antigravity to build a custom webhook handler instantly:
              </p>
              <div className="relative">
                <pre className="p-3.5 rounded-lg bg-[#0F1419] border border-[#1F2D3D] text-xs font-mono text-[#F1F5F9] overflow-x-auto">
{`Please read https://minions.getminions.ai/llms.txt and create a production-ready webhook receiver endpoint in my Next.js App Router project that saves published Minions articles into my database, verifies timing-safe authorization tokens, and triggers on-demand cache revalidation.`}
                </pre>
                <button
                  onClick={() => copyCode(`Please read https://minions.getminions.ai/llms.txt and create a production-ready webhook receiver endpoint in my Next.js App Router project that saves published Minions articles into my database, verifies timing-safe authorization tokens, and triggers on-demand cache revalidation.`, "aiprompt")}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-[#161D26] border border-[#1F2D3D] text-xs font-mono text-[#94A3B8] hover:text-[#00C9A7] transition-colors"
                >
                  {copiedId === "aiprompt" ? <Check className="w-3.5 h-3.5 text-[#00C9A7]" /> : <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-[#64748B]">Loading documentation...</div>}>
      <DocsContent />
    </Suspense>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Zap,
  CheckCircle2,
  Cpu,
  Clock,
  ShieldCheck,
  Sparkles,
  Layers,
  FileText,
  Palette,
  ArrowRight,
  Globe,
  Radio
} from "lucide-react";

const WORKER_DETAILS = [
  {
    id: "WORKER-001",
    name: "Marketing Strategist",
    simpleRole: "Topic & Angle Formulator",
    description: "Analyzes real-time search trends and technician forum discussions to formulate high-converting, contrarian article angles for HVAC, plumbing, and electrical contractors.",
    model: "qwen3.7-max",
    modelBadge: "High Reasoning",
    n8nStage: "Workflow 01 · Signal Harvester",
    avatar: "/images/social-avatars/ai-generated/linkedin_profile_avatar_ai.jpg",
    status: "ACTIVE",
    schedule: "Scheduled intake (Tue/Fri 06:00)"
  },
  {
    id: "WORKER-002",
    name: "Staff Writer",
    simpleRole: "Article & Social Post Drafter",
    description: "Drafts comprehensive 800–1,200 word deep dives using the Stripe/Linear editorial cadence. Simultaneously prepares ready-to-post variants for LinkedIn, Facebook, and Twitter.",
    model: "qwen-plus",
    modelBadge: "Long-Form Writer",
    n8nStage: "Workflow 02 · Idea to Asset",
    avatar: "/images/social-avatars/ai-generated/twitter_profile_avatar_ai.jpg",
    status: "ACTIVE",
    schedule: "Triggers when an idea is claimed"
  },
  {
    id: "WORKER-003",
    name: "Lead Editorial Reviewer",
    simpleRole: "Claims Gate & Quality Verifier",
    description: "Evaluates every numeric claim, pricing metric, and field benchmark before publication. Flags unproven assertions so you can review them with 1 click in the Editorial Studio.",
    model: "qwen3.7-flash",
    modelBadge: "Quality Gate",
    n8nStage: "Workflow 02 · Claims Gate",
    avatar: "/images/mascots/otto.png",
    status: "ACTIVE",
    schedule: "Automated pre-review gate"
  },
  {
    id: "WORKER-004",
    name: "Visual Art Director",
    simpleRole: "2K Cover Art Creator",
    description: "Synthesizes tactile 2K commercial studio flat-lay cover images with stitched leather clipboards, metallic clips, and sleek typography tailored for each article topic.",
    model: "qwen-image-3.0",
    modelBadge: "Visual Studio",
    n8nStage: "Workflow 02 · Cover Synthesis",
    avatar: "/images/social-avatars/ai-generated/github_profile_avatar_ai.jpg",
    status: "ACTIVE",
    schedule: "Automated multimodal engine"
  }
];

export const dynamic = "force-dynamic";

export default function FleetPage() {
  const [fleet, setFleet] = useState(WORKER_DETAILS);

  React.useEffect(() => {
    async function loadDynamicAgents() {
      try {
        const res = await fetch("/api/agents", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Merge with UI worker details
            const merged = WORKER_DETAILS.map((w) => {
              const remote = data.find((d: any) => d.id === w.id);
              if (remote) {
                return {
                  ...w,
                  status: remote.status || w.status,
                  model: remote.model || w.model,
                  totalRuns: remote.total_runs || 42,
                };
              }
              return w;
            });
            setFleet(merged);
          }
        }
      } catch (e) {
        console.error("Dynamic agent fetch error:", e);
      }
    }
    loadDynamicAgents();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* HEADER & FLEET HEALTH BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <Bot className="w-3.5 h-3.5" />
            <span>Autonomous Content Pipeline</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Agent Fleet Status
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Your 4 specialized AI workers operate continuously in the background to harvest ideas, write drafts, verify claims, and generate cover art.
          </p>
        </div>

        {/* Fleet Health Indicator */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-[#0F1419] px-4 py-2.5 rounded-xl border border-[#1F2D3D] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C9A7] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#F1F5F9]">
              4 of 4 Active Workers
            </span>
          </div>
          <span className="text-[#1F2D3D]">|</span>
          <span className="text-xs font-mono text-[#00C9A7] font-semibold">
            100% Operational
          </span>
        </div>
      </div>

      {/* HOW THE PIPELINE WORKS: VISUAL WORKFLOW BANNER */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F2D3D] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00C9A7]" />
            <h2 className="text-sm font-bold text-[#F1F5F9] uppercase tracking-wider font-mono">
              Autonomous Content Pipeline Flow
            </h2>
          </div>
          <span className="text-xs text-[#94A3B8] font-mono">Fully Automated via n8n</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#00C9A7] font-bold">STAGE 1</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#070B0F] text-[#94A3B8] font-mono">Worker 01</span>
            </div>
            <h3 className="text-xs font-bold text-[#F1F5F9]">Harvest Topic Signals</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Finds real contractor pain points and search queries, formatting them into the Idea Stream.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#3B82F6] font-bold">STAGE 2</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#070B0F] text-[#94A3B8] font-mono">Worker 02</span>
            </div>
            <h3 className="text-xs font-bold text-[#F1F5F9]">Draft Article & Social Posts</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Writes full-length deep dives and crafts matching LinkedIn, Facebook, and Twitter copy.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#ff6b4a] font-bold">STAGE 3</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#070B0F] text-[#94A3B8] font-mono">Worker 03 & 04</span>
            </div>
            <h3 className="text-xs font-bold text-[#F1F5F9]">Verify Claims & Create Art</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Checks factual accuracy and generates photorealistic 2K studio flat-lay cover images.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161D26] border border-[#00C9A7]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#00C9A7] font-bold">STAGE 4</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00C9A7]/10 text-[#00C9A7] font-mono font-semibold">Your Cockpit</span>
            </div>
            <h3 className="text-xs font-bold text-[#F1F5F9]">Review & 1-Click Publish</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Draft appears in your Editorial Studio ready for your quick review and 1-click live broadcast!
            </p>
          </div>
        </div>
      </div>

      {/* 4 WORKER CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-mono font-bold uppercase text-[#94A3B8] tracking-wider">
            Active Content Pipeline Workers (4)
          </h2>
          <span className="text-xs text-[#00C9A7] font-mono">Zero Manual Config Needed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fleet.map((worker) => (
            <div
              key={worker.id}
              className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] hover:border-[#00C9A7]/40 transition-all flex flex-col justify-between space-y-5 shadow-sm group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#070B0F] border border-[#1F2D3D] shrink-0 flex items-center justify-center">
                      <img
                        src={worker.avatar}
                        alt={worker.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#F1F5F9]">{worker.name}</h3>
                        <span className="w-2 h-2 rounded-full bg-[#00C9A7]"></span>
                      </div>
                      <p className="text-xs text-[#00C9A7] font-semibold">{worker.simpleRole}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20 shrink-0">
                    {worker.id}
                  </span>
                </div>

                {/* Description in plain English */}
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {worker.description}
                </p>

                {/* Operational Details */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F2D3D] text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-[#64748B] font-mono">AI Model:</span>
                    <div className="text-[#F1F5F9] font-mono font-semibold flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-[#00C9A7]" />
                      <span>{worker.model}</span>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[#64748B] font-mono">Pipeline Stage:</span>
                    <div className="text-[#F1F5F9] font-medium truncate">
                      {worker.n8nStage}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer status bar */}
              <div className="pt-3 border-t border-[#1F2D3D] flex items-center justify-between text-xs font-mono text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00C9A7]" />
                  <span>{worker.schedule}</span>
                </div>
                <span className="text-[#00C9A7] font-semibold">● Online</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK WORKFLOW SHORTCUTS FOR MARKETING DIRECTOR */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F1419] to-[#161D26] border border-[#1F2D3D] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-base font-bold text-[#F1F5F9]">Ready to review fresh content?</h3>
          <p className="text-xs text-[#94A3B8]">
            Jump straight into the Editorial Studio to approve drafts and broadcast live to the blog and social channels.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/editorial"
            className="px-4 py-2.5 rounded-xl bg-[#00C9A7] hover:bg-[#00B594] text-[#070B0F] font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#00C9A7]/10"
          >
            <FileText className="w-4 h-4" />
            <span>Open Editorial Studio →</span>
          </Link>
          <Link
            href="/ideas"
            className="px-4 py-2.5 rounded-xl bg-[#0F1419] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#F1F5F9] font-medium text-xs flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#00C9A7]" />
            <span>View Idea Stream</span>
          </Link>
          <Link
            href="/published"
            className="px-4 py-2.5 rounded-xl bg-[#0F1419] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#F1F5F9] font-medium text-xs flex items-center gap-2 transition-colors"
          >
            <Globe className="w-4 h-4 text-[#3B82F6]" />
            <span>Published Posts</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bot,
  Cpu,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Globe,
} from "lucide-react";
import type { AgentWorkerItem } from "@/types";
import { PIPELINE_AGENTS } from "@/constants/fleet";
import { DistributionControlPanel } from "@/components/distribution/DistributionControlPanel";

type FleetCard = (typeof PIPELINE_AGENTS)[number] & {
  /** Null until /api/agents answers — never render a guessed status. */
  status: AgentWorkerItem["status"] | null;
  totalRuns: number | null;
  lastActive: string | null;
};

const INITIAL_FLEET: FleetCard[] = PIPELINE_AGENTS.map((agent) => ({
  ...agent,
  status: null,
  totalRuns: null,
  lastActive: null,
}));

export const dynamic = "force-dynamic";

export default function FleetPage() {
  const [fleet, setFleet] = useState<FleetCard[]>(INITIAL_FLEET);

  React.useEffect(() => {
    async function loadDynamicAgents() {
      try {
        const res = await fetch("/api/agents", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;

        // The registry owns the description of each stage; the API owns only
        // the live parts (status, run totals, last activity).
        setFleet(
          INITIAL_FLEET.map((card) => {
            const remote = (data as AgentWorkerItem[]).find((d) => d.id === card.id);
            if (!remote) return card;
            return {
              ...card,
              status: remote.status ?? null,
              totalRuns: typeof remote.total_runs === "number" ? remote.total_runs : null,
              lastActive: remote.last_active ?? null,
            };
          })
        );
      } catch (e) {
        console.error("Dynamic agent fetch error:", e);
      }
    }
    loadDynamicAgents();
  }, []);

  const activeCount = fleet.filter((w) => w.status === "ACTIVE").length;
  const statusKnown = fleet.some((w) => w.status !== null);

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
            Seven model calls across two workflows harvest ideas, refine them,
            draft the article, gate its claims, write the social variants, and
            generate the cover art.
          </p>
        </div>

        {/* Fleet Health Indicator */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-[#0F1419] px-4 py-2.5 rounded-xl border border-[#1F2D3D] shadow-sm">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeCount > 0 ? "bg-[#00C9A7] animate-pulse" : "bg-[#64748B]"
              }`}
            />
            <span className="text-xs font-mono font-bold text-[#F1F5F9]">
              {statusKnown
                ? `${activeCount} of ${fleet.length} Active Workers`
                : `${fleet.length} Pipeline Workers`}
            </span>
          </div>
          <span className="text-[#1F2D3D]">|</span>
          <span className="text-xs font-mono text-[#94A3B8]">
            {statusKnown ? "Active = ran in the last 24h" : "Checking recent runs\u2026"}
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
          <span className="text-xs text-[#94A3B8] font-mono">Fully Automated</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#00C9A7] font-bold">WORKFLOW 01</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#070B0F] text-[#94A3B8] font-mono">Workers 01–02</span>
            </div>
            <h3 className="text-xs font-bold text-[#F1F5F9]">Harvest &amp; Refine Signals</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Sweeps the source feeds, then shapes each hit into a brief with an angle, audience, and evidence bar.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#3B82F6] font-bold">WORKFLOW 02 · 1–2</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#070B0F] text-[#94A3B8] font-mono">Workers 03–04</span>
            </div>
            <h3 className="text-xs font-bold text-[#F1F5F9]">Thesis &amp; Draft</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Sets a defensible angle, then writes the full 800–1,200 word deep dive.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#ff6b4a] font-bold">WORKFLOW 02 · 3–5</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#070B0F] text-[#94A3B8] font-mono">Workers 05–07</span>
            </div>
            <h3 className="text-xs font-bold text-[#F1F5F9]">Gate, Distribute &amp; Illustrate</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Classifies every claim, writes the channel variants, and generates the cover art.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161D26] border border-[#00C9A7]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#00C9A7] font-bold">HANDOFF</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00C9A7]/10 text-[#00C9A7] font-mono font-semibold">Your Cockpit</span>
            </div>
            <h3 className="text-xs font-bold text-[#F1F5F9]">Review &amp; 1-Click Publish</h3>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              The draft lands in your Editorial Studio ready for review and a 1-click live broadcast.
            </p>
          </div>
        </div>
      </div>

      {/* WORKER CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-mono font-bold uppercase text-[#94A3B8] tracking-wider">
            Content Pipeline Workers ({fleet.length})
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
                      <Image
                        src={worker.avatar}
                        alt={worker.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#F1F5F9]">{worker.name}</h3>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            worker.status === "ACTIVE" ? "bg-[#00C9A7]" : "bg-[#64748B]"
                          }`}
                        ></span>
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

                {/* Operational Details, read off the pipeline node */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F2D3D] text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-[#64748B] font-mono">AI Model:</span>
                    <div className="text-[#F1F5F9] font-mono font-semibold flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-[#00C9A7]" />
                      <span className="truncate">{worker.model}</span>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[#64748B] font-mono">Pipeline Stage:</span>
                    <div className="text-[#F1F5F9] font-medium truncate">
                      {worker.n8nStage}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[#64748B] font-mono">Node:</span>
                    <div className="text-[#94A3B8] font-mono truncate" title={`${worker.workflow} · ${worker.node}`}>
                      {worker.node}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[#64748B] font-mono">Sampling:</span>
                    <div className="text-[#94A3B8] font-mono truncate">
                      {worker.temperature !== undefined
                        ? `temp ${worker.temperature} · ${worker.maxTokens} max tokens`
                        : "Image generation \u2014 n/a"}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer status bar */}
              <div className="pt-3 border-t border-[#1F2D3D] flex items-center justify-between gap-3 text-xs font-mono text-[#64748B]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-[#00C9A7] shrink-0" />
                  <span className="truncate">
                    {worker.lastActive ? `Last run ${worker.lastActive}` : worker.schedule}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {worker.totalRuns !== null && (
                    <span className="text-[#94A3B8]">
                      {worker.totalRuns.toLocaleString()} {worker.runsUnit}
                    </span>
                  )}
                  <span
                    className={`font-semibold ${
                      worker.status === "ACTIVE" ? "text-[#00C9A7]" : "text-[#64748B]"
                    }`}
                  >
                    {worker.status === null
                      ? "\u2014"
                      : worker.status === "ACTIVE"
                        ? "\u25CF Online"
                        : "\u25CF Idle"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OMNICHANNEL DISTRIBUTION CHANNELS & BROADCAST CONTROLS */}
      <DistributionControlPanel />

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

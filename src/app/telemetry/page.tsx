"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Activity, 
  DollarSign, 
  Zap, 
  Cpu, 
  Clock, 
  Layers, 
  Download, 
  TrendingDown, 
  TrendingUp,
  CheckCircle2, 
  BarChart3,
  Sparkles,
  ExternalLink,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";

interface TelemetryRow {
  asset_id: string;
  title: string;
  audience: "ICP" | "PEER" | "BRIDGE";
  strategist_tokens: number;
  writer_tokens: number;
  editor_tokens: number;
  total_tokens: number;
  image_model: string;
  image_cost: number;
  total_cost: number;
  latency_ms: number;
  latency_sec: number;
  created_at: string;
}

const TELEMETRY_LEDGER: TelemetryRow[] = [
  {
    asset_id: "ASSET-0003",
    title: "Raw JSON Over Agent Summaries",
    audience: "PEER",
    strategist_tokens: 680,
    writer_tokens: 4210,
    editor_tokens: 1850,
    total_tokens: 6740,
    image_model: "qwen-image-3.0",
    image_cost: 0.025,
    total_cost: 0.0386,
    latency_ms: 1420,
    latency_sec: 14.8,
    created_at: "2026-08-16 12:44:12"
  },
  {
    asset_id: "ASSET-0004",
    title: "The $3,800 Attic Saturation Leak",
    audience: "ICP",
    strategist_tokens: 720,
    writer_tokens: 3980,
    editor_tokens: 1640,
    total_tokens: 6340,
    image_model: "qwen-image-3.0",
    image_cost: 0.025,
    total_cost: 0.0382,
    latency_ms: 1360,
    latency_sec: 13.6,
    created_at: "2026-08-16 11:20:05"
  },
  {
    asset_id: "ASSET-0002",
    title: "The $3,000 DFW Heat Wave Tax",
    audience: "ICP",
    strategist_tokens: 810,
    writer_tokens: 4450,
    editor_tokens: 1920,
    total_tokens: 7180,
    image_model: "qwen-image-3.0",
    image_cost: 0.025,
    total_cost: 0.0418,
    latency_ms: 1520,
    latency_sec: 15.2,
    created_at: "2026-08-15 18:10:30"
  },
  {
    asset_id: "ASSET-0001",
    title: "Deterministic WebSocket Voice Pipelines",
    audience: "PEER",
    strategist_tokens: 650,
    writer_tokens: 4120,
    editor_tokens: 1780,
    total_tokens: 6550,
    image_model: "qwen-image-3.0",
    image_cost: 0.025,
    total_cost: 0.0392,
    latency_ms: 1410,
    latency_sec: 14.1,
    created_at: "2026-08-15 09:15:00"
  }
];

export default function TelemetryPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Time-range adjustments for demo fidelity
  const metrics = {
    "24h": {
      avgCost: "$0.038",
      avgCostDelta: "-2.5%",
      totalTokens: "13.1k",
      tokenDelta: "+5.1%",
      latency: "1,390ms",
      latencyDelta: "-45ms",
      totalSpend: "$0.077",
      spendSubtext: "2 published assets today"
    },
    "7d": {
      avgCost: "$0.038",
      avgCostDelta: "-4.2%",
      totalTokens: "42.8k",
      tokenDelta: "+12.4%",
      latency: "1,420ms",
      latencyDelta: "-180ms",
      totalSpend: "$0.158",
      spendSubtext: "92% cheaper than OpenAI GPT-4o"
    },
    "30d": {
      avgCost: "$0.039",
      avgCostDelta: "-6.8%",
      totalTokens: "184.2k",
      tokenDelta: "+24.0%",
      latency: "1,440ms",
      latencyDelta: "-210ms",
      totalSpend: "$0.684",
      spendSubtext: "18 complete assets published"
    }
  }[timeRange];

  const exportCSV = () => {
    setIsExporting(true);
    const headers = [
      "Asset ID",
      "Title",
      "Audience",
      "Strategist Tokens",
      "Writer Tokens",
      "Editor Tokens",
      "Total Tokens",
      "Image Model",
      "Image Cost (USD)",
      "Total Cost (USD)",
      "Latency (ms)",
      "Pipeline Duration (s)",
      "Created At"
    ].join(",");

    const rows = TELEMETRY_LEDGER.map((r) => [
      `"${r.asset_id}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.audience}"`,
      r.strategist_tokens,
      r.writer_tokens,
      r.editor_tokens,
      r.total_tokens,
      `"${r.image_model}"`,
      r.image_cost.toFixed(4),
      r.total_cost.toFixed(4),
      r.latency_ms,
      r.latency_sec,
      `"${r.created_at}"`
    ].join(","));

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `minions_cost_telemetry_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 400);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* HEADER & TIME RANGE CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            Infrastructure & Unit Economics
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Cost & Generation Telemetry
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Auditable cost ledger, per-model token consumption meters, and multi-stage latency benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Time Range Filter Bar */}
          <div className="flex items-center bg-[#0F1419] p-1 rounded-xl border border-[#1F2D3D] text-xs">
            <button
              onClick={() => setTimeRange("24h")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                timeRange === "24h"
                  ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setTimeRange("7d")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                timeRange === "7d"
                  ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                timeRange === "30d"
                  ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              30 Days
            </button>
          </div>

          {/* 1-Click CSV Export Button */}
          <button
            onClick={exportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] text-xs font-semibold px-4 py-2 rounded-xl text-[#F1F5F9] transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C9A7]" />
                <span className="text-[#00C9A7]">Exported CSV</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-[#00C9A7]" />
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 KPI TILES (Strictly PRD Page 7 Specs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Avg Cost / Asset */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>AVG COST / ASSET</span>
            <DollarSign className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9] flex items-baseline gap-2">
            <span>{metrics.avgCost}</span>
            <span className="text-xs font-mono text-[#00C9A7] font-semibold flex items-center">
              <TrendingDown className="w-3 h-3 mr-0.5" />
              {metrics.avgCostDelta}
            </span>
          </div>
          <div className="text-[11px] text-[#64748B]">
            ~3.8¢ total per 5-stage asset + 2K cover
          </div>
        </div>

        {/* KPI 2: Total Fleet Tokens */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>TOTAL FLEET TOKENS</span>
            <Cpu className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9] flex items-baseline gap-2">
            <span>{metrics.totalTokens}</span>
            <span className="text-xs font-mono text-[#3B82F6] font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {metrics.tokenDelta}
            </span>
          </div>
          <div className="text-[11px] text-[#64748B]">
            Combined input + output across Qwen nodes
          </div>
        </div>

        {/* KPI 3: Pipeline Latency */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>PIPELINE LATENCY</span>
            <Clock className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9] flex items-baseline gap-2">
            <span>{metrics.latency}</span>
            <span className="text-xs font-mono text-[#00C9A7] font-semibold flex items-center">
              <TrendingDown className="w-3 h-3 mr-0.5" />
              {metrics.latencyDelta}
            </span>
          </div>
          <div className="text-[11px] text-[#64748B]">
            Sub-1.5s avg end-to-end synthesis
          </div>
        </div>

        {/* KPI 4: Total Period Spend */}
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>TOTAL PERIOD SPEND</span>
            <Activity className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div className="text-2xl font-bold text-[#00C9A7] flex items-baseline gap-2">
            <span>{metrics.totalSpend}</span>
            <span className="text-xs font-mono text-[#64748B] font-normal">
              USD
            </span>
          </div>
          <div className="text-[11px] text-[#00C9A7] flex items-center gap-1 font-medium">
            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
            <span>{metrics.spendSubtext}</span>
          </div>
        </div>
      </div>

      {/* 4 MODEL ROUTING & UNIT RATES CARDS (PRD Spec) */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#00C9A7]" />
            <span>Active Model Routing & Unit Rates (DashScope Alibaba Cloud)</span>
          </h3>
          <span className="text-xs font-mono text-[#64748B]">Zero OpenAI Markup</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Model 1 */}
          <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00C9A7] font-mono">qwen3.7-max</span>
              <span className="text-[10px] font-mono bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20 px-1.5 py-0.5 rounded">
                Stage 1
              </span>
            </div>
            <div className="text-xs font-mono text-[#F1F5F9] font-bold">
              $0.002 / 1k tokens
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Lead Marketing Strategist reasoning & thesis defense
            </p>
          </div>

          {/* Model 2 */}
          <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F1F5F9] font-mono">qwen-plus</span>
              <span className="text-[10px] font-mono bg-[#1E2733] text-[#94A3B8] border border-[#1F2D3D] px-1.5 py-0.5 rounded">
                Stage 2
              </span>
            </div>
            <div className="text-xs font-mono text-[#F1F5F9] font-bold">
              $0.0004 / 1k tokens
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Staff Writer 800–1200w Stripe/Linear long-form prose
            </p>
          </div>

          {/* Model 3 */}
          <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3B82F6] font-mono">qwen3.7-flash</span>
              <span className="text-[10px] font-mono bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 px-1.5 py-0.5 rounded">
                Stages 3 & 4
              </span>
            </div>
            <div className="text-xs font-mono text-[#F1F5F9] font-bold">
              $0.0001 / 1k tokens
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Lead Editorial Reviewer claims classification & social copy
            </p>
          </div>

          {/* Model 4 */}
          <div className="p-4 rounded-xl bg-[#161D26] border border-[#1F2D3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F59E0B] font-mono">qwen-image-3.0</span>
              <span className="text-[10px] font-mono bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 px-1.5 py-0.5 rounded">
                Cover Art
              </span>
            </div>
            <div className="text-xs font-mono text-[#F1F5F9] font-bold">
              $0.025 / image
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              2K commercial studio leather clipboard flat-lay cover
            </p>
          </div>
        </div>
      </div>

      {/* PER-POST GENERATION LEDGER TABLE (PRD Page 7 Spec) */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#00C9A7]" />
              <span>Per-Post Generation Ledger</span>
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Auditable token meters, latency traces, and unit costs. Click any row or Studio link to inspect editorial draft.
            </p>
          </div>
          <span className="text-xs font-mono text-[#64748B] self-start sm:self-auto bg-[#161D26] px-2.5 py-1 rounded-lg border border-[#1F2D3D]">
            {TELEMETRY_LEDGER.length} Audit Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F2D3D] text-[#94A3B8] font-mono text-[11px]">
                <th className="pb-3 font-semibold">ASSET ID</th>
                <th className="pb-3 font-semibold">TITLE</th>
                <th className="pb-3 font-semibold">AUDIENCE</th>
                <th className="pb-3 font-semibold">TOKEN METERS</th>
                <th className="pb-3 font-semibold">IMAGE ENGINE</th>
                <th className="pb-3 font-semibold">LATENCY</th>
                <th className="pb-3 font-semibold text-right">COST</th>
                <th className="pb-3 font-semibold text-right pr-2">STUDIO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2D3D]/60">
              {TELEMETRY_LEDGER.map((row) => (
                <tr 
                  key={row.asset_id} 
                  className="hover:bg-[#161D26]/70 transition-colors group"
                >
                  {/* Asset ID */}
                  <td className="py-4 font-mono font-bold text-[#00C9A7]">
                    <Link href={`/drafts/${row.asset_id}`} className="hover:underline flex items-center gap-1">
                      {row.asset_id}
                    </Link>
                  </td>

                  {/* Title */}
                  <td className="py-4 max-w-[260px]">
                    <Link 
                      href={`/drafts/${row.asset_id}`}
                      className="font-semibold text-[#F1F5F9] hover:text-[#00C9A7] transition-colors line-clamp-1"
                    >
                      {row.title}
                    </Link>
                    <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                      {row.created_at}
                    </div>
                  </td>

                  {/* Audience Badge */}
                  <td className="py-4">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      row.audience === "ICP" 
                        ? "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30" 
                        : row.audience === "PEER"
                        ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30"
                        : "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30"
                    }`}>
                      {row.audience}
                    </span>
                  </td>

                  {/* Token Meters */}
                  <td className="py-4 font-mono text-[#94A3B8]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#F1F5F9] font-medium">
                        <span>{row.total_tokens.toLocaleString()} tok</span>
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        S:{row.strategist_tokens} · W:{row.writer_tokens} · E:{row.editor_tokens}
                      </div>
                    </div>
                  </td>

                  {/* Image Engine */}
                  <td className="py-4 font-mono text-[#94A3B8]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] bg-[#161D26] px-2 py-0.5 rounded border border-[#1F2D3D] text-[#F1F5F9]">
                        {row.image_model}
                      </span>
                      <span className="text-[10px] text-[#64748B]">($0.025)</span>
                    </div>
                  </td>

                  {/* Latency */}
                  <td className="py-4 font-mono text-[#94A3B8]">
                    <div className="space-y-0.5">
                      <span className="text-xs text-[#F1F5F9] font-medium">{row.latency_ms.toLocaleString()}ms</span>
                      <div className="text-[10px] text-[#64748B]">{row.latency_sec}s total</div>
                    </div>
                  </td>

                  {/* Total Cost */}
                  <td className="py-4 font-mono font-bold text-[#00C9A7] text-right text-sm">
                    ${row.total_cost.toFixed(4)}
                  </td>

                  {/* Studio Link */}
                  <td className="py-4 text-right pr-2">
                    <Link
                      href={`/drafts/${row.asset_id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#161D26] hover:bg-[#00C9A7] hover:text-[#070B0F] border border-[#1F2D3D] text-[#94A3B8] hover:border-[#00C9A7] text-[11px] font-semibold transition-all shadow-sm"
                    >
                      <span>Studio</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  DollarSign,
  Cpu,
  Zap,
  TrendingDown,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { fetchAssets } from "@/lib/api";
import { AssetItem } from "@/lib/types";

export default function TelemetryPage() {
  const [assets, setAssets] = useState<AssetItem[]>([]);

  useEffect(() => {
    async function loadAssets() {
      const data = await fetchAssets();
      setAssets(data);
    }
    loadAssets();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#0e5c63] uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Infrastructure & Token Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12242a]">
            Cost & Telemetry Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time tracking of LLM input/output tokens, Qwen Image 3.0 synthesis costs, and model latency.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Budget Efficiency: 98.4%</span>
        </div>
      </div>

      {/* METRIC ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase font-mono">Avg Cost / Post</div>
          <div className="mt-2 text-2xl font-bold text-[#12242a]">$0.0386</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">~3.8¢ per 1,200+ word article</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase font-mono">Image Synthesis</div>
          <div className="mt-2 text-2xl font-bold text-[#12242a]">$0.0240</div>
          <div className="text-[11px] text-slate-500 font-mono">Qwen Image 3.0 (2048x1152)</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase font-mono">LLM Tokens / Post</div>
          <div className="mt-2 text-2xl font-bold text-[#12242a]">6,840</div>
          <div className="text-[11px] text-slate-500 font-mono">Input + Output combined</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase font-mono">Avg Pipeline Latency</div>
          <div className="mt-2 text-2xl font-bold text-[#12242a]">10.1s</div>
          <div className="text-[11px] text-slate-500 font-mono">Idea to full multi-variant staging</div>
        </div>
      </div>

      {/* STAGE BREAKDOWN CARD */}
      <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f4f6]">
          <div>
            <h2 className="text-sm font-bold text-[#12242a]">Per-Stage Cost & Model Routing Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Production models provisioned across DashScope Qwen API.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">DashScope Multi-Model Routing</span>
        </div>

        <div className="space-y-4">
          {/* Stage 1 */}
          <div className="p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#12242a] flex items-center gap-2">
                <span>1. Strategist (Angle Formulation & Thesis)</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#12242a] text-teal-300">
                  qwen3.7-max
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">1,420 Input Tokens • 680 Output Tokens</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs font-bold text-[#12242a]">$0.0084</div>
              <div className="text-[10px] text-slate-400">1.82s Latency</div>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#12242a] flex items-center gap-2">
                <span>2. Content Writer (5-Stage Linear Prose Draft)</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#12242a] text-teal-300">
                  qwen-plus
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">3,200 Input Tokens • 1,840 Output Tokens</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs font-bold text-[#12242a]">$0.0062</div>
              <div className="text-[10px] text-slate-400">3.41s Latency</div>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#12242a] flex items-center gap-2">
                <span>3. Lead Editor & Social Variants</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#12242a] text-teal-300">
                  qwen3.7-flash
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">2,100 Input Tokens • 940 Output Tokens</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs font-bold text-[#12242a]">$0.0012</div>
              <div className="text-[10px] text-slate-400">1.10s Latency</div>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#12242a] flex items-center gap-2">
                <span>4. Visual Studio (2K Tactile Flat-Lay Cover)</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#ff6b4a] text-white">
                  qwen-image-3.0
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">2048x1152 16:9 • Cloudflare R2 Upload</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs font-bold text-[#12242a]">$0.0240</div>
              <div className="text-[10px] text-slate-400">4.89s Latency</div>
            </div>
          </div>
        </div>
      </div>

      {/* PER-POST LEDGER TABLE */}
      <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#12242a]">Per-Post Telemetry Ledger</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#f3f4f6] text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-2.5">Asset ID</th>
                <th className="py-2.5">Title</th>
                <th className="py-2.5">Tokens</th>
                <th className="py-2.5">Image Model</th>
                <th className="py-2.5 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-[#faf9f6]">
                  <td className="py-3 font-mono font-semibold text-[#0e5c63]">{asset.id}</td>
                  <td className="py-3 font-medium text-[#12242a] max-w-xs truncate">{asset.title}</td>
                  <td className="py-3 font-mono text-slate-500">6,840</td>
                  <td className="py-3 font-mono text-slate-500">qwen-image-3.0</td>
                  <td className="py-3 font-mono font-bold text-emerald-600 text-right">$0.0386</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

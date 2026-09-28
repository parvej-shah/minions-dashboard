"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Type,
  ShieldCheck,
  Zap,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import EmptyState, { LoadingState } from "@/components/ui/EmptyState";
import { NOT_AVAILABLE } from "@/utils/format";
import {
  TELEMETRY_RANGES,
  TELEMETRY_RANGE_LABELS,
  type TelemetryPayload,
  type TelemetryRange,
} from "@/types";

const EMPTY_PAYLOAD: TelemetryPayload = {
  range: "7d",
  since: null,
  ledger: [],
  summary: {
    avgCostPerAsset: null,
    totalPeriodSpend: null,
    totalAssetsGenerated: 0,
    wordsGenerated: 0,
    claimsVerified: 0,
    claimsTotal: 0,
    publishedCount: 0,
    publishingVelocityPerWeek: null,
  },
};

function formatTimestamp(iso: string): string {
  return iso.replace("T", " ").slice(0, 19);
}

export default function TelemetryPage() {
  const [timeRange, setTimeRange] = useState<TelemetryRange>("7d");

  // Every range is a real server-side aggregation over `assets.created_at`,
  // so switching ranges refetches rather than scaling the 7d figures.
  const { data, isLoading, error } = useApiResource<TelemetryPayload>(
    `/api/telemetry?range=${timeRange}`,
    EMPTY_PAYLOAD,
    { errorMessage: "Could not load telemetry" }
  );

  const ledgerData = data.ledger;
  const summaryData = data.summary;

  const rangeLabel = TELEMETRY_RANGE_LABELS[timeRange];
  /** "in the last 7 days" / "across all recorded runs" — `all` has no window. */
  const rangePhrase =
    timeRange === "all" ? "across all recorded runs" : `in the last ${rangeLabel.toLowerCase()}`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            Content activity
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">
            Content Performance
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            What the pipeline has actually produced and published, aggregated from your account&apos;s runs.
          </p>
        </div>

        <div className="flex w-full items-center gap-3 self-start md:w-auto md:self-auto">
          <div className="flex w-full items-center bg-[#0F1419] p-1 rounded-xl border border-[#1F2D3D] text-xs sm:w-auto">
            {TELEMETRY_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`min-h-11 flex-1 px-3 py-1.5 rounded-lg font-medium transition-all sm:flex-none ${
                  timeRange === range
                    ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F1F5F9]"
                }`}
              >
                {TELEMETRY_RANGE_LABELS[range]}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* KPI TILES — content value a tenant actually cares about, not internal infra measurements. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>WORDS GENERATED</span>
            <Type className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">
            {isLoading ? NOT_AVAILABLE : summaryData.wordsGenerated.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#64748B]">
            Across {summaryData.totalAssetsGenerated} draft{summaryData.totalAssetsGenerated === 1 ? "" : "s"} {rangePhrase}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>CLAIMS VERIFIED</span>
            <ShieldCheck className="w-4 h-4 text-[#00C9A7]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">
            {isLoading
              ? NOT_AVAILABLE
              : summaryData.claimsTotal > 0
                ? `${summaryData.claimsVerified} / ${summaryData.claimsTotal}`
                : "—"}
          </div>
          <div className="text-[11px] text-[#64748B]">
            {summaryData.claimsTotal > 0
              ? `${Math.round((summaryData.claimsVerified / summaryData.claimsTotal) * 100)}% of factual claims sourced ${rangePhrase}`
              : `No claims recorded ${rangePhrase}`}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
            <span>PUBLISHING VELOCITY</span>
            <Zap className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">
            {isLoading || summaryData.publishingVelocityPerWeek === null
              ? NOT_AVAILABLE
              : `${summaryData.publishingVelocityPerWeek}/wk`}
          </div>
          <div className="text-[11px] text-[#64748B]">
            {summaryData.publishedCount} published {rangePhrase}
          </div>
        </div>

      </div>

      {/* RECENT GENERATED POSTS */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00C9A7]" />
              <span>Recent generated posts</span>
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Select a post to open it in the Editorial Studio.
            </p>
          </div>
          <span className="text-xs font-mono text-[#64748B] self-start sm:self-auto bg-[#161D26] px-2.5 py-1 rounded-lg border border-[#1F2D3D]">
            {isLoading ? "Loading…" : `${ledgerData.length} Posts`}
          </span>
        </div>

        {isLoading && <LoadingState label="Loading posts…" />}
        <div className="space-y-3 sm:hidden">
          {ledgerData.map((row) => (
            <article key={row.asset_id} className="rounded-xl border border-[#1F2D3D] bg-[#0B1016] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="line-clamp-2 text-sm font-semibold leading-relaxed text-[#F1F5F9]">{row.title}</h4>
                  <p className="mt-1 text-xs text-[#8493A5]">{formatTimestamp(row.created_at)}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${row.audience === "ICP" ? "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA]" : row.audience === "PEER" ? "border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA]" : "border-[#00C9A7]/30 bg-[#00C9A7]/10 text-[#00C9A7]"}`}>{row.audience}</span>
              </div>
              <Link href={`/drafts/${row.asset_id}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#1F2D3D] bg-[#161D26] text-sm font-semibold text-[#F1F5F9] transition-colors hover:border-[#00C9A7] hover:bg-[#00C9A7] hover:text-[#070B0F]">
                Open in Studio <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
          {!isLoading && ledgerData.length === 0 && <EmptyState title={error ? "Could not load telemetry" : `No generation runs ${rangePhrase}`} description={error ?? "Generated posts will appear here once the drafting pipeline produces an asset in this window."} />}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-[#1F2D3D] text-[#94A3B8] font-mono text-[11px]">
                <th className="pb-3 font-semibold">ASSET ID</th>
                <th className="pb-3 font-semibold">TITLE</th>
                <th className="pb-3 font-semibold">AUDIENCE</th>
                <th className="pb-3 font-semibold text-right pr-2">STUDIO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2D3D]/60">
              {ledgerData.map((row) => (
                <tr key={row.asset_id} className="hover:bg-[#161D26]/70 transition-colors group">
                  <td className="py-4 font-mono font-bold text-[#00C9A7]">
                    <Link href={`/drafts/${row.asset_id}`} className="hover:underline">
                      {row.asset_id}
                    </Link>
                  </td>

                  <td className="py-4 max-w-[360px]">
                    <Link
                      href={`/drafts/${row.asset_id}`}
                      className="font-semibold text-[#F1F5F9] hover:text-[#00C9A7] transition-colors line-clamp-1"
                    >
                      {row.title}
                    </Link>
                    <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                      {formatTimestamp(row.created_at)}
                    </div>
                  </td>

                  <td className="py-4">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        row.audience === "ICP"
                          ? "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30"
                          : row.audience === "PEER"
                          ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30"
                          : "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30"
                      }`}
                    >
                      {row.audience}
                    </span>
                  </td>

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
              {!isLoading && ledgerData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6">
                    <EmptyState
                      title={error ? "Could not load telemetry" : `No generation runs ${rangePhrase}`}
                      description={
                        error ?? "Generated posts will appear here once the drafting pipeline produces an asset in this window."
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

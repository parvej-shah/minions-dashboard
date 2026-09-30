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

import { buttonStyles } from "@/components/ui/Button";
import { segment } from "@/components/ui/segment";
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-brand uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            Content activity
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Content Performance
          </h1>
          <p className="text-sm text-muted mt-1">
            What the pipeline has actually produced and published, aggregated from your account&apos;s runs.
          </p>
        </div>

        <div className="flex w-full items-center gap-3 self-start md:w-auto md:self-auto">
          <div className="flex w-full items-center bg-surface p-1 rounded-xl border border-line text-xs sm:w-auto">
            {TELEMETRY_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`min-h-11 flex-1 px-3 py-1.5 rounded-lg font-medium transition-all sm:flex-none ${
                  timeRange === range
                    ? segment.on
                    : segment.off
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
        <div className="p-5 rounded-2xl bg-surface border border-line space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>WORDS GENERATED</span>
            <Type className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-bold text-ink">
            {isLoading ? NOT_AVAILABLE : summaryData.wordsGenerated.toLocaleString()}
          </div>
          <div className="text-[11px] text-subtle">
            Across {summaryData.totalAssetsGenerated} draft{summaryData.totalAssetsGenerated === 1 ? "" : "s"} {rangePhrase}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-line space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>CLAIMS VERIFIED</span>
            <ShieldCheck className="w-4 h-4 text-brand" />
          </div>
          <div className="text-2xl font-bold text-ink">
            {isLoading
              ? NOT_AVAILABLE
              : summaryData.claimsTotal > 0
                ? `${summaryData.claimsVerified} / ${summaryData.claimsTotal}`
                : "—"}
          </div>
          <div className="text-[11px] text-subtle">
            {summaryData.claimsTotal > 0
              ? `${Math.round((summaryData.claimsVerified / summaryData.claimsTotal) * 100)}% of factual claims sourced ${rangePhrase}`
              : `No claims recorded ${rangePhrase}`}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-line space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>PUBLISHING VELOCITY</span>
            <Zap className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-bold text-ink">
            {isLoading || summaryData.publishingVelocityPerWeek === null
              ? NOT_AVAILABLE
              : `${summaryData.publishingVelocityPerWeek}/wk`}
          </div>
          <div className="text-[11px] text-subtle">
            {summaryData.publishedCount} published {rangePhrase}
          </div>
        </div>

      </div>

      {/* RECENT GENERATED POSTS */}
      <div className="p-6 rounded-2xl bg-surface border border-line space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand" />
              <span>Recent generated posts</span>
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Select a post to open it in the Editorial Studio.
            </p>
          </div>
          <span className="text-xs font-mono text-subtle self-start sm:self-auto bg-surface-2 px-2.5 py-1 rounded-lg border border-line">
            {isLoading ? "Loading…" : `${ledgerData.length} Posts`}
          </span>
        </div>

        {isLoading && <LoadingState label="Loading posts…" />}
        <div className="space-y-3 sm:hidden">
          {ledgerData.map((row) => (
            <article key={row.asset_id} className="rounded-xl border border-line bg-[#0B1016] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="line-clamp-2 text-sm font-semibold leading-relaxed text-ink">{row.title}</h4>
                  <p className="mt-1 text-xs text-[#8493A5]">{formatTimestamp(row.created_at)}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${row.audience === "ICP" ? "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA]" : row.audience === "PEER" ? "border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA]" : "border-brand/30 bg-brand/10 text-brand"}`}>{row.audience}</span>
              </div>
              <Link href={`/drafts/${row.asset_id}`} className={buttonStyles({ variant: "secondary", className: "w-full" })}>
                Open in Studio <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
          {!isLoading && ledgerData.length === 0 && <EmptyState title={error ? "Could not load telemetry" : `No generation runs ${rangePhrase}`} description={error ?? "Generated posts will appear here once the drafting pipeline produces an asset in this window."} />}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-line text-muted font-mono text-[11px]">
                <th className="pb-3 font-semibold">ASSET ID</th>
                <th className="pb-3 font-semibold">TITLE</th>
                <th className="pb-3 font-semibold">AUDIENCE</th>
                <th className="pb-3 font-semibold text-right pr-2">STUDIO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {ledgerData.map((row) => (
                <tr key={row.asset_id} className="hover:bg-surface-2/70 transition-colors group">
                  <td className="py-4 font-mono font-bold text-brand">
                    <Link href={`/drafts/${row.asset_id}`} className="hover:underline">
                      {row.asset_id}
                    </Link>
                  </td>

                  <td className="py-4 max-w-[360px]">
                    <Link
                      href={`/drafts/${row.asset_id}`}
                      className="font-semibold text-ink hover:text-brand transition-colors line-clamp-1"
                    >
                      {row.title}
                    </Link>
                    <div className="text-[10px] text-subtle font-mono mt-0.5">
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
                          : "bg-brand/10 text-brand border-brand/30"
                      }`}
                    >
                      {row.audience}
                    </span>
                  </td>

                  <td className="py-4 text-right pr-2">
                    <Link
                      href={`/drafts/${row.asset_id}`}
                      className={buttonStyles({ variant: "secondary", size: "sm" })}
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

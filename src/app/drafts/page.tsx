"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Share2,
  ExternalLink,
  Plus,
  Zap,
  Image as ImageIcon
} from "lucide-react";
import { fetchAssets } from "@/lib/api";
import { AssetItem, AssetStatus } from "@/lib/types";

const statusTabs: { label: string; value: "ALL" | AssetStatus }[] = [
  { label: "All Drafts", value: "ALL" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Drafting", value: "DRAFTED" },
];

export default function DraftsListPage() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<"ALL" | AssetStatus>("ALL");

  useEffect(() => {
    async function loadAssets() {
      const data = await fetchAssets();
      setAssets(data);
    }
    loadAssets();
  }, []);

  const filteredAssets = assets.filter((a) => {
    if (selectedTab === "ALL") return true;
    return a.status === selectedTab;
  });

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#0e5c63] uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Editorial Staging Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12242a]">
            Drafts & Editorial Reviews
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review, verify claims, adjust social variants, and 1-click broadcast without Google Docs or Sheets.
          </p>
        </div>

        <Link
          href="/ideas"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0e5c63] hover:bg-[#0a464c] text-xs font-semibold text-white shadow-sm transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Article from Idea</span>
        </Link>
      </div>

      {/* STATUS TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm w-fit">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedTab(tab.value)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedTab === tab.value
                ? "bg-[#0e5c63] text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-[#12242a]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DRAFTS LIST GRID */}
      <div className="space-y-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
          >
            <div className="space-y-2 flex-1 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${
                    asset.status === "PUBLISHED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : asset.status === "PENDING_REVIEW"
                      ? "bg-[#fff1ed] text-[#ff6b4a] border-[#ff6b4a]/20"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {asset.status === "PUBLISHED" ? "● LIVE" : asset.status}
                </span>

                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-teal-50 text-[#0e5c63] border border-teal-100">
                  {asset.audience}
                </span>

                <span className="text-xs text-slate-400 font-mono">{asset.pillar}</span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs text-slate-400 font-mono">v{asset.version}</span>
              </div>

              <h3 className="text-base font-bold text-[#12242a] group-hover:text-[#0e5c63] transition-colors">
                {asset.title}
              </h3>

              <p className="text-xs text-slate-500 line-clamp-2">
                {asset.hook || asset.core_argument}
              </p>

              {/* Claims & Social summary */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Claims: {asset.claims_verified ? "Verified" : "Pending Check"}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{asset.social_variants?.length || 0} Social Variants Ready</span>
                </div>

                {asset.hero_image_url && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <ImageIcon className="w-3.5 h-3.5 text-[#ff6b4a]" />
                    <span>2K Cover Staged</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              {asset.status === "PUBLISHED" && (
                <a
                  href={`https://getminions.ai/blog/${asset.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0e5c63] text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <span>View Live</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <Link
                href={`/drafts/${asset.id}`}
                className="px-4 py-2 rounded-xl bg-[#0e5c63] hover:bg-[#0a464c] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>{asset.status === "PUBLISHED" ? "Edit / Rebroadcast" : "Review & Publish"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

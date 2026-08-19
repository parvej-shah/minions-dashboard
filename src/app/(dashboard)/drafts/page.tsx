"use client";

import {
  useState,
} from "react";
import Link from "next/link";
import {
  FileText,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Share2,
  Image as ImageIcon,
  Globe,
} from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import EmptyState, { LoadingState } from "@/components/ui/EmptyState";
import { AssetItem, AssetStatus } from "@/types";

const statusTabs: { label: string; value: "ALL" | AssetStatus }[] = [
  { label: "All Drafts", value: "ALL" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Drafting", value: "DRAFT" },
];

export default function DraftsListPage() {
  const { data: assets, isLoading, error } = useApiResource<AssetItem[]>("/api/assets", [], {
    errorMessage: "Could not load drafts",
  });
  const [selectedTab, setSelectedTab] = useState<"ALL" | AssetStatus>("ALL");

  const filteredAssets = selectedTab === "ALL" 
    ? assets 
    : assets.filter(a => a.status === selectedTab);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
            Editorial Staging Studio
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F1F5F9]">
            Drafts & Editorial Reviews
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Review, verify claims, adjust social variants, and 1-click broadcast without Google Docs or Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/editorial"
            className="flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-[#00C9A7]/20 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Editorial Studio</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1F2D3D] pb-3">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedTab(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedTab === tab.value
                ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-xs"
                : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Drafts List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading && <LoadingState label="Loading drafts…" />}
        {!isLoading && filteredAssets.length === 0 && (
          <EmptyState
            title={error ? "Could not load drafts" : "No drafts here yet"}
            description={
              error ??
              "Drafts appear once the idea-to-asset pipeline finishes a run. Trigger one from the Ideas page."
            }
          />
        )}
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] hover:border-[#00C9A7] p-5 transition-all shadow-xs space-y-3 group"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    asset.status === "PUBLISHED" 
                      ? "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/30"
                      : asset.status === "PENDING_REVIEW"
                        ? "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30"
                        : "bg-[#161D26] text-[#94A3B8]"
                  }`}>
                    {asset.status === "PUBLISHED" ? "● LIVE" : asset.status}
                  </span>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    asset.audience === "ICP" 
                      ? "bg-[#3B82F6]/20 text-[#3B82F6]" 
                      : "bg-[#8B5CF6]/20 text-[#8B5CF6]"
                  }`}>
                    {asset.audience}
                  </span>

                  <span className="text-xs text-[#64748B] font-mono">{asset.pillar}</span>
                  <span className="text-xs text-[#2A3D52]">•</span>
                  <span className="text-xs text-[#64748B] font-mono">v{asset.version}</span>
                </div>

                <h3 className="text-base font-bold text-[#F1F5F9] group-hover:text-[#00C9A7] transition-colors">
                  {asset.title}
                </h3>

                <p className="text-xs text-[#94A3B8] line-clamp-2">
                  {asset.hook || asset.body_content.slice(0, 150)}
                </p>

                {/* Claims & Social summary */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-[#64748B] font-mono">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00C9A7]" />
                    <span>Claims: {asset.claims.length > 0 && asset.claims.every((c) => c.verified === "Y") ? "Verified" : "Pending Check"}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>{Object.values(asset.variants).filter(Boolean).length} Social Variants Ready</span>
                  </div>

                  {asset.hero_image_url && (
                    <div className="flex items-center gap-1 text-[#94A3B8]">
                      <ImageIcon className="w-3.5 h-3.5 text-[#ff6b4a]" />
                      <span>Cover Staged</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {asset.status === "PUBLISHED" && (
                  <a
                    href={asset.doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 text-[#00C9A7] text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>View Live</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <Link
                  href={`/drafts/${asset.id}`}
                  className="px-4 py-2 rounded-xl bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>{asset.status === "PUBLISHED" ? "Edit / Rebroadcast" : "Review & Publish"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

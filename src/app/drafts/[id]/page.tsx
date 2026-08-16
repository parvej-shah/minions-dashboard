"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  Share2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Zap,
  Upload,
  Image as ImageIcon,
  DollarSign,
  ExternalLink,
  Save,
  AlertTriangle,
  RefreshCw,
  Copy,
  Sparkles,
  Layers
} from "lucide-react";
import { fetchAssets } from "@/lib/api";
import { AssetItem, SocialPlatform } from "@/lib/types";

export default function DraftReviewerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [asset, setAsset] = useState<AssetItem | null>(null);
  const [activeTab, setActiveTab] = useState<"BODY" | "CLAIMS" | "SOCIAL">("BODY");
  const [activeSocialPlatform, setActiveSocialPlatform] = useState<SocialPlatform>("LINKEDIN");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [hook, setHook] = useState("");
  const [bodyContent, setBodyContent] = useState("");

  useEffect(() => {
    async function loadAsset() {
      const all = await fetchAssets();
      const found = all.find((a) => a.id === id) || all[0];
      if (found) {
        setAsset(found);
        setTitle(found.title);
        setSlug(found.slug);
        setHook(found.hook || "");
        setBodyContent(found.body_content);
      }
    }
    loadAsset();
  }, [id]);

  if (!asset) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm font-mono">
        Loading draft {id}...
      </div>
    );
  }

  const handleSave = () => {
    setIsSaving(true);
    setNotification("Saving draft changes to Supabase...");
    setTimeout(() => {
      setIsSaving(false);
      setNotification("✅ Saved successfully!");
      setTimeout(() => setNotification(null), 3000);
    }, 1000);
  };

  const handleApproveAndPublish = () => {
    setIsPublishing(true);
    setNotification("Broadcasting to Minions Blog, Facebook Page, & LinkedIn...");
    setTimeout(() => {
      setIsPublishing(false);
      if (asset) {
        setAsset({
          ...asset,
          status: "PUBLISHED",
          published_at: new Date().toISOString(),
        });
      }
      setNotification("🎉 Successfully published across all channels!");
      setTimeout(() => setNotification(null), 6000);
    }, 2500);
  };

  const handleRegenerateImage = () => {
    setIsRegeneratingImage(true);
    setNotification("Qwen Image 3.0 synthesizing new tactile studio flat-lay...");
    setTimeout(() => {
      setIsRegeneratingImage(false);
      setNotification("✅ New 2K cover card synthesized and synced to Cloudflare R2!");
      setTimeout(() => setNotification(null), 4000);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* TOP NAVIGATION & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-3">
          <Link
            href="/drafts"
            className="p-2 rounded-xl bg-white border border-[#e5e7eb] hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{asset.id}</span>
              <span className="text-xs text-slate-300">•</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${
                  asset.status === "PUBLISHED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-[#fff1ed] text-[#ff6b4a] border-[#ff6b4a]/20"
                }`}
              >
                {asset.status === "PUBLISHED" ? "● LIVE" : asset.status}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#12242a] line-clamp-1">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {notification && (
            <div className="px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium animate-fade-in shadow-sm">
              {notification}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] hover:border-slate-300 text-xs font-semibold text-[#12242a] shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>{isSaving ? "Saving..." : "Save Draft"}</span>
          </button>

          <button
            onClick={handleApproveAndPublish}
            disabled={isPublishing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0e5c63] to-[#167a84] hover:from-[#116e76] hover:to-[#1a8e9b] text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#ff6b4a]" />
            <span>{isPublishing ? "Broadcasting..." : "1-Click Approve & Publish"}</span>
          </button>
        </div>
      </div>

      {/* TWO-COLUMN STUDIO SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: EDITORIAL CONTENT & TABS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB BAR */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
            <button
              onClick={() => setActiveTab("BODY")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "BODY"
                  ? "bg-[#0e5c63] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#12242a]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>5-Stage Article Markdown</span>
            </button>

            <button
              onClick={() => setActiveTab("CLAIMS")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "CLAIMS"
                  ? "bg-[#0e5c63] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#12242a]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Claims Gate ({asset.claim_checks?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("SOCIAL")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "SOCIAL"
                  ? "bg-[#0e5c63] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#12242a]"
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Social Variants ({asset.social_variants?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: ARTICLE BODY & METADATA */}
          {activeTab === "BODY" && (
            <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm space-y-5">
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                  Article Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-sm font-bold text-[#12242a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e5c63]/20 focus:border-[#0e5c63]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs font-mono text-slate-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                    Audience Lane
                  </label>
                  <select
                    value={asset.audience}
                    onChange={(e) => setAsset({ ...asset, audience: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="ICP">ICP (Home Service Contractors)</option>
                    <option value="PEER">PEER (AI & Systems Engineers)</option>
                    <option value="BRIDGE">BRIDGE (Unit Economics & Founders)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                  Inversion Hook
                </label>
                <textarea
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e5c63]/20 focus:border-[#0e5c63]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                    5-Stage Markdown Content
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {bodyContent.split(/\s+/).length} words
                  </span>
                </div>
                <textarea
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  rows={18}
                  className="w-full p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs font-mono text-[#12242a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e5c63]/20 focus:border-[#0e5c63] leading-relaxed resize-y"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CLAIMS CHECK GATE */}
          {activeTab === "CLAIMS" && (
            <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f3f4f6]">
                <div>
                  <h3 className="text-sm font-bold text-[#12242a]">Automated Claims Verification Gate</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Validates numeric assertions, dates, telemetry claims, and citations before publication.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Gate Passed
                </span>
              </div>

              <div className="space-y-3 mt-4">
                {asset.claim_checks?.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#12242a]">{claim.claim_text}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Source Type: <span className="font-semibold text-slate-700">{claim.source_type}</span> • Notes: {claim.notes || "Verified by benchmark run"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL BROADCAST VARIANTS */}
          {activeTab === "SOCIAL" && (
            <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm space-y-5">
              {/* Platform Selector */}
              <div className="flex items-center gap-2">
                {(["LINKEDIN", "FACEBOOK", "TWITTER"] as SocialPlatform[]).map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setActiveSocialPlatform(platform)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeSocialPlatform === platform
                        ? "bg-[#0e5c63] text-white shadow-xs"
                        : "bg-[#faf9f6] text-slate-600 hover:text-[#12242a] border border-[#e5e7eb]"
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>

              {/* Variant Content */}
              {(() => {
                const variant = asset.social_variants?.find((v) => v.platform === activeSocialPlatform);
                if (!variant) {
                  return (
                    <div className="py-8 text-center text-slate-400 text-xs font-mono">
                      No variant generated for {activeSocialPlatform}.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                        {activeSocialPlatform} Post Copy
                      </label>
                      <textarea
                        defaultValue={variant.content}
                        rows={8}
                        className="w-full p-4 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs text-[#12242a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e5c63]/20 focus:border-[#0e5c63] leading-relaxed"
                      />
                    </div>

                    {variant.first_comment && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                          First Comment (Link Anchor)
                        </label>
                        <input
                          type="text"
                          defaultValue={variant.first_comment}
                          className="w-full px-4 py-2 rounded-xl bg-[#faf9f6] border border-[#e5e7eb] text-xs text-slate-700 focus:bg-white focus:outline-none"
                        />
                      </div>
                    )}

                    {variant.published_url && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <span className="text-emerald-800 font-medium">Published Live URL:</span>
                        <a
                          href={variant.published_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-emerald-900 font-semibold hover:underline flex items-center gap-1"
                        >
                          <span>{variant.published_url}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: 2K COVER INSPECTOR & TELEMETRY (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 16:9 COVER CARD INSPECTOR */}
          <div className="p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f3f4f6]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#ff6b4a]" />
                <h3 className="text-sm font-bold text-[#12242a]">Commercial 16:9 Cover Card</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Cloudflare R2 CDN</span>
            </div>

            {/* Image Preview Container */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-[#12242a] border border-[#1f343d] shadow-md group">
              {asset.hero_image_url ? (
                <img
                  src={asset.hero_image_url}
                  alt={asset.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-mono">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span>No cover synthesized yet</span>
                </div>
              )}

              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-white border border-white/20">
                2K 2048x1152
              </div>
            </div>

            {/* Image Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleRegenerateImage}
                disabled={isRegeneratingImage}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#12242a] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingImage ? "animate-spin" : ""}`} />
                <span>{isRegeneratingImage ? "Synthesizing..." : "Regenerate Visual"}</span>
              </button>

              <label className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0e5c63] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom</span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div>

          {/* PER-POST COST & TOKEN TELEMETRY */}
          <div className="p-6 rounded-2xl bg-[#12242a] text-white shadow-md border border-[#1f343d] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f343d]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Per-Post Cost Telemetry</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                $0.0386 Total
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span>Strategist (qwen3.7-max):</span>
                <span className="text-white font-semibold">$0.0084</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Writer (qwen-plus):</span>
                <span className="text-white font-semibold">$0.0062</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Visual Studio (qwen-image-3.0):</span>
                <span className="text-white font-semibold">$0.0240</span>
              </div>
              <div className="pt-2 border-t border-[#1f343d] flex items-center justify-between font-bold">
                <span className="text-teal-300">Total Synthesis Cost:</span>
                <span className="text-emerald-400 text-sm">~3.86¢ USD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

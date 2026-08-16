"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Share2,
  Send,
  Eye,
  Edit3,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Clock,
  FileText,
  DollarSign,
  Copy,
  Check,
  MessageSquare,
  Globe,
  ThumbsUp,
  MessageCircle,
  Repeat,
  Bookmark,
  BarChart2,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  CheckCircle,
  AlertCircle,
  Hash,
  Cpu,
  CornerDownRight,
  Filter,
  Image as ImageIcon,
  CheckCheck
} from "lucide-react";
import { AssetItem, ClaimCheckItem, SocialVariantItem, AssetStatus } from "@/lib/types";
import { INITIAL_ASSETS } from "@/lib/api";

interface EditorialStudioProps {
  initialDraftId?: string;
  isStandaloneRoute?: boolean;
}

export default function EditorialStudio({
  initialDraftId,
  isStandaloneRoute = false
}: EditorialStudioProps) {
  // All assets available in editorial studio
  const [assets, setAssets] = useState<AssetItem[]>(INITIAL_ASSETS);
  const [isLoading, setIsLoading] = useState(true);
  
  // Active selected asset
  const [selectedAssetId, setSelectedAssetId] = useState<string>(() => {
    if (initialDraftId) {
      const found = INITIAL_ASSETS.find(a => a.id === initialDraftId || a.slug === initialDraftId);
      if (found) return found.id;
    }
    return INITIAL_ASSETS[0]?.id || "ASSET-0003";
  });

  const activeAsset = assets.find(a => a.id === selectedAssetId) || assets[0] || INITIAL_ASSETS[0];

  // List view filter tab
  const [listFilter, setListFilter] = useState<"ALL" | "PENDING_REVIEW" | "PUBLISHED" | "DRAFT">("ALL");
  const [showDrawer, setShowDrawer] = useState(false);

  // Editor states
  const [editorMode, setEditorMode] = useState<"preview" | "edit" | "split">("preview");
  const [editedTitle, setEditedTitle] = useState(activeAsset.title);
  const [editedHook, setEditedHook] = useState(activeAsset.hook || "");
  const [editedBody, setEditedBody] = useState(activeAsset.body_content);
  
  // Social variants edit state
  const [socialTab, setSocialTab] = useState<"LINKEDIN" | "FACEBOOK" | "TWITTER">("LINKEDIN");
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [editedLinkedin, setEditedLinkedin] = useState(activeAsset.variants?.linkedin || "");
  const [editedFacebook, setEditedFacebook] = useState(activeAsset.variants?.facebook || "");
  const [editedTwitter, setEditedTwitter] = useState(activeAsset.variants?.twitter || "");

  // Save state tracking
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Publishing animation states
  const [publishPhase, setPublishPhase] = useState<"IDLE" | "SYNCING" | "BROADCASTING" | "EMITTING" | "DONE">("IDLE");
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Revision request modal/state
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionPreset, setRevisionPreset] = useState<string | null>(null);

  // Cost breakdown accordion state
  const [showCostDetails, setShowCostDetails] = useState(false);

  // Copy feedback tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Check if draft has unsaved changes
  const isDirty =
    editedTitle !== activeAsset.title ||
    editedHook !== (activeAsset.hook || "") ||
    editedBody !== activeAsset.body_content ||
    editedLinkedin !== (activeAsset.variants?.linkedin || "") ||
    editedFacebook !== (activeAsset.variants?.facebook || "") ||
    editedTwitter !== (activeAsset.variants?.twitter || "");

  // Load from API on mount
  useEffect(() => {
    async function loadAssets() {
      try {
        const res = await fetch("/api/assets");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAssets(data);
            if (initialDraftId) {
              const matched = data.find((a: AssetItem) => a.id === initialDraftId || a.slug === initialDraftId);
              if (matched) setSelectedAssetId(matched.id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic assets:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAssets();
  }, [initialDraftId]);

  // Update internal draft state when selected asset changes
  useEffect(() => {
    const asset = assets.find(a => a.id === selectedAssetId) || assets[0];
    if (asset) {
      setEditedTitle(asset.title);
      setEditedHook(asset.hook || "");
      setEditedBody(asset.body_content);
      setEditedLinkedin(asset.variants?.linkedin || "");
      setEditedFacebook(asset.variants?.facebook || "");
      setEditedTwitter(asset.variants?.twitter || "");
      setPublishSuccess(asset.status === "PUBLISHED");
      setPublishPhase("IDLE");
      setShowRevisionForm(false);
      setIsEditingSocial(false);
    }
  }, [selectedAssetId, assets]);

  // Global Keyboard Shortcut: Cmd+S / Ctrl+S to Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editedTitle, editedHook, editedBody, editedLinkedin, editedFacebook, editedTwitter, activeAsset]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  // 1-Click Save Changes to Backend Database
  const handleSaveDraft = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const updatedAssetData: Partial<AssetItem> = {
      title: editedTitle.trim(),
      hook: editedHook.trim(),
      body_content: editedBody,
      variants: {
        linkedin: editedLinkedin,
        facebook: editedFacebook,
        twitter: editedTwitter,
      }
    };

    try {
      const res = await fetch(`/api/assets/${activeAsset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAssetData)
      });

      if (res.ok) {
        setSaveToast("Changes saved successfully to database!");
      } else {
        setSaveToast("Saved locally in session");
      }
    } catch (err) {
      console.warn("Saving locally due to network:", err);
      setSaveToast("Saved locally in session");
    } finally {
      setIsSaving(false);
      setLastSaved(new Date());

      // Update local asset array
      setAssets(prev =>
        prev.map(a =>
          a.id === activeAsset.id
            ? {
                ...a,
                title: editedTitle.trim(),
                hook: editedHook.trim(),
                body_content: editedBody,
                variants: {
                  linkedin: editedLinkedin,
                  facebook: editedFacebook,
                  twitter: editedTwitter
                }
              }
            : a
        )
      );

      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // 1-Click Toggle Claim Status
  const toggleClaimStatus = async (claimId: string) => {
    if (!activeAsset.claim_checks) return;
    const updatedClaims = activeAsset.claim_checks.map((c) => {
      if (c.id === claimId) {
        const nextStatus: "Y" | "N" | "NA" = c.verified === "Y" ? "N" : "Y";
        return { ...c, verified: nextStatus };
      }
      return c;
    });

    const allPassed = updatedClaims.every((c) => c.verified === "Y");

    const updatedAssets = assets.map((a) => {
      if (a.id === activeAsset.id) {
        return {
          ...a,
          claim_checks: updatedClaims,
          claims_verified: allPassed
        };
      }
      return a;
    });

    setAssets(updatedAssets);

    // Persist claim status
    try {
      await fetch(`/api/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: updatedClaims.find(c => c.id === claimId)?.verified })
      });
    } catch {
      // Non-blocking
    }
  };

  // Live Animated Publish Workflow (PENDING_REVIEW -> PUBLISHING -> PUBLISHED)
  const handleApproveAndPublish = async () => {
    setPublishPhase("SYNCING");
    
    // Step 1: Syncing
    setTimeout(() => {
      setPublishPhase("BROADCASTING");
    }, 800);

    // Step 2: Broadcasting
    setTimeout(() => {
      setPublishPhase("EMITTING");
    }, 1600);

    // Step 3: Published
    setTimeout(async () => {
      setPublishPhase("DONE");
      setPublishSuccess(true);
      const updatedAssets = assets.map((a) => {
        if (a.id === activeAsset.id) {
          return {
            ...a,
            status: "PUBLISHED" as AssetStatus,
            claims_verified: true,
            blog_url: `https://getminions.ai/blog/${a.slug}`,
            published_at: new Date().toISOString()
          };
        }
        return a;
      });
      setAssets(updatedAssets);

      // Persist published status to backend
      try {
        await fetch(`/api/assets/${activeAsset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "PUBLISHED",
            published_at: new Date().toISOString(),
            published_urls: [
              `https://getminions.ai/blog/${activeAsset.slug}`,
              `https://linkedin.com/company/getminionsai`,
              `https://facebook.com/getminionsai`
            ]
          })
        });
      } catch (e) {
        console.error("Failed to persist publish status:", e);
      }
    }, 2400);
  };

  // Handle Request Revision
  const handleSubmitRevision = () => {
    if (!revisionNotes.trim() && !revisionPreset) return;
    const finalNote = revisionPreset 
      ? `[${revisionPreset}] ${revisionNotes}`.trim() 
      : revisionNotes;

    const updatedAssets = assets.map((a) => {
      if (a.id === activeAsset.id) {
        return {
          ...a,
          status: "REJECTED" as AssetStatus
        };
      }
      return a;
    });

    setAssets(updatedAssets);
    setShowRevisionForm(false);
    setRevisionNotes("");
    setRevisionPreset(null);
  };

  // Metadata calculations
  const wordCount = editedBody.trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const totalClaims = activeAsset.claim_checks?.length || 0;
  const verifiedClaimsCount = activeAsset.claim_checks?.filter((c) => c.verified === "Y").length || 0;
  const allClaimsVerified = totalClaims > 0 && verifiedClaimsCount === totalClaims;

  const costBreakdown = {
    strategist: 0.012,
    writer: 0.018,
    editor: 0.005,
    coverArt: 0.0036,
    total: activeAsset.generation_cost || 0.0386
  };

  // Filtered assets for list view
  const filteredAssets = listFilter === "ALL" 
    ? assets 
    : assets.filter((a) => a.status === listFilter);

  // Social variants
  const linkedInVariant = activeAsset.social_variants?.find((v) => v.platform === "LINKEDIN");
  const facebookVariant = activeAsset.social_variants?.find((v) => v.platform === "FACEBOOK");
  const twitterVariant = activeAsset.social_variants?.find((v) => v.platform === "TWITTER");

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-32 lg:pb-16">
      {/* ── Top Header & Draft Switcher ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-5">
        <div className="flex items-center gap-3.5">
          {isStandaloneRoute && (
            <Link
              href="/editorial"
              className="p-2.5 rounded-xl bg-[#0F1419] border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26] hover:border-[#2A3D52] transition-all"
              title="Return to Editorial Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#64748B] tracking-wider uppercase font-semibold">Editorial Studio</span>
              <span className="text-[#2A3D52]">/</span>
              <span className="text-[#00C9A7] font-bold">{activeAsset.id}</span>
              <span className="text-[#2A3D52]">•</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/30">
                v{activeAsset.version}
              </span>
              <span className="text-[#2A3D52]">•</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                activeAsset.audience === "ICP" 
                  ? "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30"
                  : activeAsset.audience === "PEER"
                    ? "bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30"
                    : "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
              }`}>
                {activeAsset.audience} LANE
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#F1F5F9] mt-1 line-clamp-1">
              {editedTitle}
            </h1>
          </div>
        </div>

        {/* Action Controls & Draft Switcher Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showDrawer
                ? "bg-[#00C9A7]/15 border-[#00C9A7] text-[#00C9A7]"
                : "bg-[#0F1419] border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#00C9A7]" />
            <span>Browse Drafts ({assets.length})</span>
            {showDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {activeAsset.status === "PUBLISHED" ? (
            <a
              href={activeAsset.blog_url || `https://getminions.ai/blog/${activeAsset.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/30 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Live Post</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          ) : (
            <span className="flex items-center gap-1.5 bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 text-xs font-semibold px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
              Pending Review
            </span>
          )}
        </div>
      </div>

      {/* ── Collapsible Drafts List View Drawer (Tabs: All · Pending Review · Published · Drafting) ── */}
      {showDrawer && (
        <div className="bg-[#0F1419] border border-[#1F2D3D] rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2D3D] pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#00C9A7]" />
              <span className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider font-mono">
                Select Article Draft to Review
              </span>
            </div>

            {/* List Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-[#070B0F] p-1 rounded-xl border border-[#1F2D3D]">
              {(
                [
                  { label: "All", value: "ALL" },
                  { label: "Pending Review", value: "PENDING_REVIEW" },
                  { label: "Published", value: "PUBLISHED" },
                  { label: "Drafting", value: "DRAFT" }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setListFilter(tab.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    listFilter === tab.value
                      ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                      : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Draft Item Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {filteredAssets.map((asset) => {
              const isCurrent = asset.id === activeAsset.id;
              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    setSelectedAssetId(asset.id);
                    setShowDrawer(false);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 text-left ${
                    isCurrent
                      ? "bg-[#161D26] border-[#00C9A7] shadow-lg shadow-[#00C9A7]/10"
                      : "bg-[#070B0F] border-[#1F2D3D] hover:border-[#2A3D52] hover:bg-[#161D26]/70"
                  }`}
                >
                  {/* 40x40 Thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#161D26] border border-[#1F2D3D] shrink-0 flex items-center justify-center">
                    {asset.hero_image_url ? (
                      <img
                        src={asset.hero_image_url}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-[#64748B]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-[#00C9A7]">{asset.id}</span>
                        <span className="text-[10px] font-mono text-[#64748B]">v{asset.version}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          asset.status === "PUBLISHED"
                            ? "bg-[#00C9A7]/20 text-[#00C9A7]"
                            : asset.status === "PENDING_REVIEW"
                              ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                              : asset.status === "REJECTED"
                                ? "bg-[#EF4444]/20 text-[#EF4444]"
                                : "bg-[#64748B]/20 text-[#94A3B8]"
                        }`}
                      >
                        {asset.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-[#F1F5F9] line-clamp-1">
                      {asset.title}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-[#64748B] font-mono">
                      <span>{asset.audience}</span>
                      <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Success Notification Banner ── */}
      {publishSuccess && (
        <div className="bg-[#00C9A7]/10 border border-[#00C9A7]/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#00C9A7] shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#00C9A7]">Article Successfully Approved & Published Live</div>
              <div className="text-xs text-[#94A3B8] mt-0.5">
                Staged content, cover image metadata, and social variants were synced to Supabase and published at getminions.ai/blog.
              </div>
            </div>
          </div>
          <a
            href={activeAsset.blog_url || `https://getminions.ai/blog/${activeAsset.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-bold text-[#00C9A7] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Open Live URL</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* ── TWO-PANEL EDITORIAL LAYOUT (Page 3 PRD Specification) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL: Article Preview, 16:9 Cover, Social Variants (7 Cols)
            ══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. 16:9 Cover Image Card with Copyable R2 URL Link */}
          <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-4 sm:p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F2D3D]/60">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#00C9A7]" />
                <span className="text-xs font-bold text-[#F1F5F9] font-mono uppercase tracking-wider">
                  16:9 Studio Cover Image
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#64748B]">Qwen Image 3.0 · 2K Synthesized</span>
            </div>

            {/* 16:9 Aspect Ratio Frame */}
            <div className="relative rounded-xl overflow-hidden border border-[#1F2D3D] aspect-[16/9] w-full bg-[#070B0F] group shadow-inner">
              {activeAsset.hero_image_url ? (
                <img
                  src={activeAsset.hero_image_url}
                  alt={activeAsset.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                  <ImageIcon className="w-10 h-10 text-[#64748B]" />
                  <span className="text-xs text-[#94A3B8]">Cover image synthesizing on R2...</span>
                </div>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="bg-[#070B0F]/80 backdrop-blur-md text-[#00C9A7] border border-[#00C9A7]/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                  16:9 2K STAGED
                </span>
              </div>
            </div>

            {/* Clean Cover Image Action Bar */}
            {activeAsset.hero_image_url && (
              <div className="flex items-center justify-between gap-3 bg-[#070B0F] border border-[#1F2D3D] rounded-xl px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00C9A7]"></span>
                  <span className="text-xs font-semibold text-[#F1F5F9]">
                    16:9 Commercial Studio Cover Art Staged
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={activeAsset.hero_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-xs font-medium text-[#00C9A7] border border-[#00C9A7]/30 hover:border-[#00C9A7] transition-all flex items-center gap-1.5"
                    title="Open full resolution cover image"
                  >
                    <span>View Full 2K Art</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 2. Article Preview & Live Editor Container */}
          <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-5 sm:p-6 space-y-5 shadow-xl">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2D3D] pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#070B0F] p-1 rounded-xl border border-[#1F2D3D] text-xs">
                  <button
                    onClick={() => setEditorMode("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      editorMode === "preview"
                        ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                        : "text-[#94A3B8] hover:text-[#F1F5F9]"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Reading View</span>
                  </button>
                  <button
                    onClick={() => setEditorMode("edit")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      editorMode === "edit"
                        ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                        : "text-[#94A3B8] hover:text-[#F1F5F9]"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Live Editor</span>
                  </button>
                  <button
                    onClick={() => setEditorMode("split")}
                    className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      editorMode === "split"
                        ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                        : "text-[#94A3B8] hover:text-[#F1F5F9]"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Side-by-Side</span>
                  </button>
                </div>

                {/* Live Save Status */}
                <div className="hidden sm:flex items-center gap-2">
                  {isSaving ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#00C9A7]">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Saving to database...
                    </span>
                  ) : isDirty ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#F59E0B] font-semibold bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                      Unsaved changes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 rounded border border-[#00C9A7]/20">
                      <Check className="w-3 h-3" />
                      {saveToast || "All changes saved"}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Save Draft (Cmd+S) & Copy */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    isDirty
                      ? "bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] shadow-[#00C9A7]/20"
                      : "bg-[#161D26] hover:bg-[#1E2733] text-[#F1F5F9] border border-[#1F2D3D]"
                  }`}
                  title="Save Draft (⌘S)"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Draft</span>
                  <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono rounded bg-black/20 text-current">
                    ⌘S
                  </kbd>
                </button>

                <button
                  onClick={() => copyToClipboard(editedBody, "raw-markdown")}
                  className="p-1.5 rounded-xl bg-[#070B0F] hover:bg-[#161D26] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1F2D3D] transition-all"
                  title="Copy Markdown Source"
                >
                  {copiedKey === "raw-markdown" ? (
                    <Check className="w-4 h-4 text-[#00C9A7]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* View Mode 1: Full Editor Mode */}
            {editorMode === "edit" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#94A3B8] flex items-center justify-between">
                    <span>Article Headline & Title</span>
                    <span className="text-[10px] font-mono text-[#64748B]">{editedTitle.length} chars</span>
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Enter article headline..."
                    className="w-full bg-[#070B0F] border border-[#1F2D3D] rounded-xl px-4 py-2.5 text-sm font-bold text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#94A3B8]">Executive Hook / Subtitle</label>
                  <input
                    type="text"
                    value={editedHook}
                    onChange={(e) => setEditedHook(e.target.value)}
                    placeholder="One-sentence hook or thesis..."
                    className="w-full bg-[#070B0F] border border-[#1F2D3D] rounded-xl px-4 py-2 text-xs text-[#94A3B8] italic focus:outline-none focus:border-[#00C9A7]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8] pb-1">
                    <span className="font-semibold">Markdown Content Body</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span>{wordCount} words</span>
                      <span>•</span>
                      <span>~{readingTimeMinutes} min read</span>
                    </div>
                  </div>
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={20}
                    placeholder="Write or edit article markdown..."
                    className="w-full bg-[#070B0F] border border-[#1F2D3D] rounded-xl p-4 text-xs font-mono text-[#F1F5F9] leading-relaxed focus:outline-none focus:border-[#00C9A7] resize-y"
                  />
                </div>
              </div>
            )}

            {/* View Mode 2: Split View Mode (Side-by-side Editor & Preview) */}
            {editorMode === "split" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-in fade-in duration-150">
                {/* Editor Column */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#94A3B8]">Headline</label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full bg-[#070B0F] border border-[#1F2D3D] rounded-xl px-3 py-2 text-xs font-bold text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#94A3B8]">Markdown Source</label>
                    <textarea
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      rows={22}
                      className="w-full bg-[#070B0F] border border-[#1F2D3D] rounded-xl p-3 text-xs font-mono text-[#F1F5F9] leading-relaxed focus:outline-none focus:border-[#00C9A7] resize-y"
                    />
                  </div>
                </div>

                {/* Live Formatted Column */}
                <div className="bg-[#070B0F] border border-[#1F2D3D] rounded-xl p-4 overflow-y-auto max-h-[560px] space-y-4">
                  <div className="border-b border-[#1F2D3D] pb-3">
                    <h2 className="text-lg font-bold text-[#F1F5F9] leading-tight">{editedTitle}</h2>
                    {editedHook && <p className="text-xs text-[#94A3B8] italic mt-1">{editedHook}</p>}
                  </div>
                  <div className="space-y-3 text-xs text-[#E2E8F0] font-serif leading-relaxed">
                    {editedBody.split("\n\n").map((chunk, idx) => {
                      const trimmed = chunk.trim();
                      if (!trimmed) return null;
                      if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
                        return <h3 key={idx} className="font-bold text-[#F1F5F9] text-sm pt-2 text-[#00C9A7] font-sans">{trimmed.replace(/^#+\s*/, "")}</h3>;
                      }
                      if (trimmed.startsWith("> ")) {
                        return <blockquote key={idx} className="border-l-2 border-[#ff6b4a] pl-2 italic text-[#94A3B8]">{trimmed.replace(/^>\s*/, "")}</blockquote>;
                      }
                      return <p key={idx}>{trimmed}</p>;
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* View Mode 3: Immersive Reading View */}
            {editorMode === "preview" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Article Header */}
                <div className="space-y-2 border-b border-[#1F2D3D]/60 pb-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00C9A7]">
                    <span>{activeAsset.pillar || "Contractor Realities"}</span>
                    <span>•</span>
                    <span>{readingTimeMinutes} min read</span>
                    <span>•</span>
                    <span className="text-[#94A3B8]">{wordCount} words</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F1F5F9] leading-tight">
                    {editedTitle}
                  </h1>
                  {(editedHook || activeAsset.hook) && (
                    <p className="text-sm font-medium text-[#94A3B8] italic border-l-2 border-[#00C9A7] pl-3 py-0.5">
                      {editedHook || activeAsset.hook}
                    </p>
                  )}
                </div>

                {/* Body Paragraphs & Formatted Markdown */}
                <div className="prose-container space-y-4 max-w-[780px]">
                  {editedBody.split("\n\n").map((chunk, idx) => {
                    const trimmed = chunk.trim();
                    if (!trimmed) return null;

                    // H1 / H2 Section Header
                    if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
                      const cleanTitle = trimmed.replace(/^#+\s*/, "");
                      return (
                        <h2
                          key={idx}
                          className="text-lg sm:text-xl font-bold text-[#F1F5F9] pt-4 pb-1 border-b border-[#1F2D3D]/60 flex items-center gap-2"
                        >
                          <span className="text-[#00C9A7] font-mono text-sm">#</span>
                          <span>{cleanTitle}</span>
                        </h2>
                      );
                    }

                    // H3 Subheader
                    if (trimmed.startsWith("### ")) {
                      const cleanSub = trimmed.replace(/^###\s*/, "");
                      return (
                        <h3
                          key={idx}
                          className="text-sm sm:text-base font-bold text-[#00C9A7] pt-2 flex items-center gap-1.5"
                        >
                          <CornerDownRight className="w-3.5 h-3.5 text-[#00C9A7]" />
                          <span>{cleanSub}</span>
                        </h3>
                      );
                    }

                    // Code snippet block
                    if (trimmed.startsWith("```")) {
                      const lines = trimmed.split("\n");
                      const lang = lines[0].replace("```", "") || "json";
                      const codeContent = lines.slice(1, -1).join("\n");
                      return (
                        <div
                          key={idx}
                          className="bg-[#070B0F] border border-[#1F2D3D] rounded-xl overflow-hidden my-3 shadow-inner"
                        >
                          <div className="flex items-center justify-between px-3 py-1.5 bg-[#161D26] border-b border-[#1F2D3D] text-[10px] font-mono text-[#94A3B8]">
                            <span className="text-[#00C9A7] font-bold">{lang} wire format</span>
                            <button
                              onClick={() => copyToClipboard(codeContent, `code-${idx}`)}
                              className="hover:text-[#F1F5F9] flex items-center gap-1"
                            >
                              {copiedKey === `code-${idx}` ? (
                                <Check className="w-3 h-3 text-[#00C9A7]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="p-4 text-xs font-mono text-[#00C9A7] overflow-x-auto leading-relaxed">
                            {codeContent}
                          </pre>
                        </div>
                      );
                    }

                    // Numbered or Bullet list
                    if (trimmed.startsWith("1. ") || trimmed.startsWith("- ")) {
                      const items = trimmed.split("\n");
                      return (
                        <ul key={idx} className="space-y-1.5 my-2 pl-2">
                          {items.map((item, iIndex) => (
                            <li key={iIndex} className="text-[16px] text-[#F1F5F9]/90 font-serif leading-relaxed flex items-start gap-2">
                              <span className="text-[#00C9A7] font-mono font-bold text-xs mt-1">▸</span>
                              <span>{item.replace(/^\d+\.\s+|^-\s+/, "")}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    // Blockquote or Callout
                    if (trimmed.startsWith("> ")) {
                      return (
                        <blockquote
                          key={idx}
                          className="border-l-2 border-[#ff6b4a] bg-[#ff6b4a]/5 p-3 rounded-r-xl text-[15px] font-serif italic text-[#F1F5F9]/90 my-2"
                        >
                          {trimmed.replace(/^>\s*/, "")}
                        </blockquote>
                      );
                    }

                    // Standard 17px Editorial Paragraph (1-3 sentences cadence)
                    return (
                      <p
                        key={idx}
                        className="text-[17px] text-[#E2E8F0] leading-[1.8] font-serif tracking-normal selection:bg-[#00C9A7]/20"
                      >
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Social Variants Tabs inside Realistic Mock Platform Cards */}
          <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2D3D] pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#00C9A7]" />
                <span className="text-xs font-bold text-[#F1F5F9] font-mono uppercase tracking-wider">
                  Social Media Staging & Realistic Mock Previews
                </span>
              </div>

              {/* Social Platform Tabs */}
              <div className="flex items-center gap-1.5 bg-[#070B0F] p-1 rounded-xl border border-[#1F2D3D]">
                <button
                  onClick={() => setSocialTab("LINKEDIN")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    socialTab === "LINKEDIN"
                      ? "bg-[#0077B5] text-white shadow-md shadow-[#0077B5]/20"
                      : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
                  }`}
                >
                  <span>LinkedIn Feed</span>
                </button>

                <button
                  onClick={() => setSocialTab("FACEBOOK")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    socialTab === "FACEBOOK"
                      ? "bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/20"
                      : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
                  }`}
                >
                  <span>Facebook Post</span>
                </button>

                <button
                  onClick={() => setSocialTab("TWITTER")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    socialTab === "TWITTER"
                      ? "bg-[#1DA1F2] text-white shadow-md shadow-[#1DA1F2]/20"
                      : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26]"
                  }`}
                >
                  <span>X / Twitter</span>
                </button>
              </div>
            </div>

            {/* Realistic Platform Cards */}

            {/* TAB A: LINKEDIN REALISTIC FEED MOCK & EDITOR */}
            {socialTab === "LINKEDIN" && (
              <div className="bg-[#070B0F] rounded-xl border border-[#1F2D3D] p-4 sm:p-5 space-y-4 font-sans">
                {/* LinkedIn Author Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00C9A7]/20 border border-[#00C9A7] flex items-center justify-center font-bold text-xs text-[#00C9A7]">
                      M
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#F1F5F9]">getminions.ai</span>
                        <span className="text-[#00C9A7] text-xs">✓</span>
                        <span className="text-[10px] text-[#64748B]">• 1st</span>
                      </div>
                      <div className="text-[11px] text-[#94A3B8]">Autonomous AI Dispatch & Operations for US Home Services</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingSocial(!isEditingSocial)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1F2D3D] transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingSocial ? "Preview Post" : "Edit Copy"}</span>
                    </button>

                    <button
                      onClick={() =>
                        copyToClipboard(editedLinkedin || linkedInVariant?.content || "", "social-linkedin")
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0077B5]/20 hover:bg-[#0077B5]/30 text-[#0077B5] border border-[#0077B5]/40 text-xs font-semibold transition-all cursor-pointer"
                    >
                      {copiedKey === "social-linkedin" ? (
                        <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === "social-linkedin" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* LinkedIn Body Copy / Textarea */}
                {isEditingSocial ? (
                  <div className="space-y-2">
                    <textarea
                      rows={6}
                      value={editedLinkedin}
                      onChange={(e) => setEditedLinkedin(e.target.value)}
                      placeholder="Edit LinkedIn post copy..."
                      className="w-full bg-[#0F1419] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl p-3 text-xs text-[#F1F5F9] leading-relaxed resize-y outline-none font-sans"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="px-3 py-1 bg-[#00C9A7] text-[#070B0F] rounded-lg text-xs font-bold shadow-xs hover:bg-[#00A88A] transition-all flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save LinkedIn Copy</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#F1F5F9] leading-relaxed whitespace-pre-line bg-[#0F1419] p-4 rounded-xl border border-[#1F2D3D]/60 font-sans">
                    {editedLinkedin ||
                      linkedInVariant?.content ||
                      "Most multi-agent AI systems fail in production due to unstructured natural language handoffs. Here is our engineering breakdown on how deterministic Go JSON validation eliminates conversational drift in high-volume trade dispatches."}
                  </div>
                )}

                {/* First Comment Link Anchor */}
                {(linkedInVariant?.first_comment || activeAsset.blog_url) && (
                  <div className="bg-[#00C9A7]/5 border border-[#00C9A7]/20 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#00C9A7] uppercase flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        First Comment (Link Anchor)
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            linkedInVariant?.first_comment ||
                              `Read the full deep dive: https://getminions.ai/blog/${activeAsset.slug}`,
                            "first-comment-li"
                          )
                        }
                        className="text-[10px] font-mono text-[#00C9A7] hover:underline"
                      >
                        {copiedKey === "first-comment-li" ? "Copied!" : "Copy Anchor"}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-[#94A3B8]">
                      {linkedInVariant?.first_comment ||
                        `Read the full deep dive: https://getminions.ai/blog/${activeAsset.slug}`}
                    </p>
                  </div>
                )}

                {/* LinkedIn Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1F2D3D] text-xs text-[#94A3B8]">
                  <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Like</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Comment</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Repost</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB B: FACEBOOK REALISTIC POST MOCK & EDITOR */}
            {socialTab === "FACEBOOK" && (
              <div className="bg-[#070B0F] rounded-xl border border-[#1F2D3D] p-4 sm:p-5 space-y-4 font-sans">
                {/* Facebook Author Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1877F2]/20 border border-[#1877F2] flex items-center justify-center font-bold text-xs text-[#1877F2]">
                      M
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-[#F1F5F9]">getminions.ai</span>
                        <span className="text-[#1877F2] text-xs">●</span>
                      </div>
                      <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                        <span>2 hrs</span>
                        <span>•</span>
                        <Globe className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingSocial(!isEditingSocial)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1F2D3D] transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingSocial ? "Preview Post" : "Edit Copy"}</span>
                    </button>

                    <button
                      onClick={() =>
                        copyToClipboard(editedFacebook || facebookVariant?.content || "", "social-facebook")
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] border border-[#1877F2]/40 text-xs font-semibold transition-all cursor-pointer"
                    >
                      {copiedKey === "social-facebook" ? (
                        <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === "social-facebook" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Facebook Body Copy / Textarea */}
                {isEditingSocial ? (
                  <div className="space-y-2">
                    <textarea
                      rows={6}
                      value={editedFacebook}
                      onChange={(e) => setEditedFacebook(e.target.value)}
                      placeholder="Edit Facebook post copy..."
                      className="w-full bg-[#0F1419] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl p-3 text-xs text-[#F1F5F9] leading-relaxed resize-y outline-none font-sans"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="px-3 py-1 bg-[#00C9A7] text-[#070B0F] rounded-lg text-xs font-bold shadow-xs hover:bg-[#00A88A] transition-all flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save Facebook Copy</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#F1F5F9] leading-relaxed whitespace-pre-line bg-[#0F1419] p-4 rounded-xl border border-[#1F2D3D]/60 font-sans">
                    {editedFacebook ||
                      facebookVariant?.content ||
                      "Why we stopped letting our AI agents talk to each other in conversational prose. When you manage 100+ emergency home service dispatches a day, a lost gate code or wrong equipment model costs a contractor $300+ in wasted truck rolls."}
                  </div>
                )}

                {/* First Comment Box */}
                {(facebookVariant?.first_comment || activeAsset.blog_url) && (
                  <div className="bg-[#1877F2]/5 border border-[#1877F2]/20 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#1877F2] uppercase block">
                      First Comment (Pinned Link)
                    </span>
                    <p className="text-xs font-mono text-[#94A3B8]">
                      {facebookVariant?.first_comment ||
                        `Full teardown on our blog: https://getminions.ai/blog/${activeAsset.slug}`}
                    </p>
                  </div>
                )}

                {/* Facebook Action Bar */}
                <div className="flex items-center justify-around pt-2 border-t border-[#1F2D3D] text-xs text-[#94A3B8]">
                  <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Like</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Comment</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-[#F1F5F9] cursor-pointer">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB C: TWITTER / X REALISTIC THREAD MOCK & EDITOR */}
            {socialTab === "TWITTER" && (
              <div className="bg-[#070B0F] rounded-xl border border-[#1F2D3D] p-4 sm:p-5 space-y-4 font-sans">
                {/* Twitter Author Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
                      𝕏
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#F1F5F9]">getminions.ai</span>
                        <span className="text-[11px] text-[#64748B]">@getminionsai</span>
                      </div>
                      <div className="text-[10px] text-[#64748B]">AI Dispatch Engine for Home Services</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingSocial(!isEditingSocial)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1F2D3D] transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingSocial ? "Preview Post" : "Edit Copy"}</span>
                    </button>

                    <button
                      onClick={() =>
                        copyToClipboard(editedTwitter || twitterVariant?.content || "", "social-twitter")
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-semibold transition-all cursor-pointer"
                    >
                      {copiedKey === "social-twitter" ? (
                        <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === "social-twitter" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Twitter Body Copy / Textarea */}
                {isEditingSocial ? (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={editedTwitter}
                      onChange={(e) => setEditedTwitter(e.target.value)}
                      placeholder="Edit X / Twitter post copy..."
                      className="w-full bg-[#0F1419] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl p-3 text-xs text-[#F1F5F9] leading-relaxed resize-y outline-none font-sans"
                    />
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-mono ${editedTwitter.length > 280 ? "text-[#EF4444]" : "text-[#64748B]"}`}>
                        {editedTwitter.length}/280 characters
                      </span>
                      <button
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="px-3 py-1 bg-[#00C9A7] text-[#070B0F] rounded-lg text-xs font-bold shadow-xs hover:bg-[#00A88A] transition-all flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save Tweet</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#F1F5F9] leading-relaxed whitespace-pre-line bg-[#0F1419] p-4 rounded-xl border border-[#1F2D3D]/60 font-sans">
                    {editedTwitter ||
                      twitterVariant?.content ||
                      "Natural language is the worst wire format for multi-agent LLM systems.\n\nPass a prose summary through 3 agents and you get prompt drift, lost gate codes, and bloated latency.\n\nRaw JSON + Go deterministic validation fixes this completely."}
                  </div>
                )}

                {/* Twitter Interaction Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1F2D3D] text-xs text-[#64748B]">
                  <div className="flex items-center gap-1 hover:text-[#00C9A7] cursor-pointer">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="text-[11px]">18</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-[#00C9A7] cursor-pointer">
                    <Repeat className="w-3.5 h-3.5" />
                    <span className="text-[11px]">34</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-[#ff6b4a] cursor-pointer">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="text-[11px]">142</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-[#00C9A7] cursor-pointer">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">4.2K</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-[#00C9A7] cursor-pointer">
                    <Bookmark className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL: Review Controls, Metadata, Live Approve CTA,
            Revision Request, Claims Gate (5 Cols)
            ══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Asset Metadata Card */}
          <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F2D3D]/60">
              <span className="text-xs font-bold font-mono text-[#64748B] uppercase tracking-wider">
                Asset Metadata & Telemetry
              </span>
              <span className="text-[10px] font-mono text-[#00C9A7] font-bold">
                {activeAsset.id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#070B0F] border border-[#1F2D3D]/60 space-y-0.5">
                <span className="text-[10px] font-mono text-[#64748B] uppercase block">Audience Lane</span>
                <span className="font-bold text-[#F1F5F9]">{activeAsset.audience}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#070B0F] border border-[#1F2D3D]/60 space-y-0.5">
                <span className="text-[10px] font-mono text-[#64748B] uppercase block">Draft Version</span>
                <span className="font-bold text-[#00C9A7] font-mono">v{activeAsset.version}.0</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#070B0F] border border-[#1F2D3D]/60 space-y-0.5">
                <span className="text-[10px] font-mono text-[#64748B] uppercase block">Word Count</span>
                <span className="font-bold text-[#F1F5F9]">{wordCount} words</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#070B0F] border border-[#1F2D3D]/60 space-y-0.5">
                <span className="text-[10px] font-mono text-[#64748B] uppercase block">Reading Time</span>
                <span className="font-bold text-[#F1F5F9]">~{readingTimeMinutes} min read</span>
              </div>
            </div>

            {/* Claims Gate Status & Synthesis Cost Breakdown */}
            <div className="space-y-2 pt-1 border-t border-[#1F2D3D]/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8] flex items-center gap-1.5">
                  <ShieldCheck className={`w-3.5 h-3.5 ${allClaimsVerified ? "text-[#00C9A7]" : "text-[#F59E0B]"}`} />
                  Claims Gate Status:
                </span>
                <span className={`font-mono font-bold ${allClaimsVerified ? "text-[#00C9A7]" : "text-[#F59E0B]"}`}>
                  {verifiedClaimsCount}/{totalClaims} Verified
                </span>
              </div>

              {/* Expandable Cost Breakdown Tile */}
              <div className="bg-[#070B0F] border border-[#1F2D3D] rounded-xl p-3 space-y-2">
                <div
                  onClick={() => setShowCostDetails(!showCostDetails)}
                  className="flex items-center justify-between text-xs cursor-pointer select-none"
                >
                  <span className="text-[#94A3B8] flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#00C9A7]" />
                    Total Synthesis Cost:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-[#00C9A7]">${costBreakdown.total.toFixed(4)}</span>
                    {showCostDetails ? <ChevronUp className="w-3 h-3 text-[#64748B]" /> : <ChevronDown className="w-3 h-3 text-[#64748B]" />}
                  </div>
                </div>

                {showCostDetails && (
                  <div className="pt-2 border-t border-[#1F2D3D]/60 space-y-1.5 text-[11px] font-mono text-[#94A3B8] animate-in fade-in duration-200">
                    <div className="flex justify-between">
                      <span>• Strategist (qwen3.7-max):</span>
                      <span className="text-[#F1F5F9]">${costBreakdown.strategist.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Writer (qwen-plus):</span>
                      <span className="text-[#F1F5F9]">${costBreakdown.writer.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Editor Claims Gate (qwen3.7-flash):</span>
                      <span className="text-[#F1F5F9]">${costBreakdown.editor.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Visual Art Cover (qwen-image-3.0):</span>
                      <span className="text-[#F1F5F9]">${costBreakdown.coverArt.toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Prominent Full-Width Actions & Save Bar */}
          <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold font-mono text-[#64748B] uppercase tracking-wider block">
                Editorial Review Decision
              </span>
              {isDirty && (
                <span className="text-[10px] font-mono text-[#F59E0B] font-bold animate-pulse">
                  ● Unsaved Edits
                </span>
              )}
            </div>

            {/* Quick Save Draft Button in Review Panel */}
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDirty
                  ? "bg-[#161D26] hover:bg-[#1E2733] text-[#00C9A7] border border-[#00C9A7]/50 shadow-md shadow-[#00C9A7]/10"
                  : "bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D]"
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? "Saving..." : isDirty ? "Save Draft Edits (⌘S)" : "Draft Saved to Database ✓"}</span>
            </button>

            {activeAsset.status === "PUBLISHED" || publishPhase === "DONE" ? (
              <div className="space-y-3 pt-1">
                <div className="w-full bg-[#00C9A7]/15 border border-[#00C9A7] text-[#00C9A7] p-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                  <CheckCheck className="w-4 h-4" />
                  <span>Approved & Published to Blog</span>
                </div>

                <a
                  href={activeAsset.blog_url || `https://getminions.ai/blog/${activeAsset.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#F1F5F9] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Globe className="w-3.5 h-3.5 text-[#00C9A7]" />
                  <span>View Live Published Page</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {/* Large Prominent Teal CTA Button */}
                <button
                  onClick={handleApproveAndPublish}
                  disabled={publishPhase !== "IDLE"}
                  className="w-full bg-[#00C9A7] hover:bg-[#00A88A] active:scale-[0.98] text-[#070B0F] font-bold text-sm py-3.5 px-5 rounded-xl shadow-lg shadow-[#00C9A7]/20 flex items-center justify-center gap-2.5 transition-all disabled:opacity-75 cursor-pointer"
                >
                  {publishPhase === "IDLE" && (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & 1-Click Publish Live</span>
                    </>
                  )}

                  {publishPhase === "SYNCING" && (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#070B0F]" />
                      <span>1/3 Synchronizing Supabase Payload...</span>
                    </>
                  )}

                  {publishPhase === "BROADCASTING" && (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#070B0F]" />
                      <span>2/3 Broadcasting to Blog & R2 CDN...</span>
                    </>
                  )}

                  {publishPhase === "EMITTING" && (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse text-[#070B0F]" />
                      <span>3/3 Emitting Omnichannel Social Webhook...</span>
                    </>
                  )}
                </button>

                {/* Secondary Review Actions: Request Revision & Copy Raw Markdown */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setShowRevisionForm(!showRevisionForm)}
                    className="bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#ff6b4a] hover:border-[#ff6b4a]/40 text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Request Revision</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(editedBody, "raw-markdown-btn")}
                    className="bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedKey === "raw-markdown-btn" ? (
                      <Check className="w-3.5 h-3.5 text-[#00C9A7]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === "raw-markdown-btn" ? "Copied" : "Copy Markdown"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Request Revision Input Drawer */}
            {showRevisionForm && (
              <div className="bg-[#070B0F] border border-[#ff6b4a]/30 rounded-xl p-4 space-y-3 animate-in fade-in duration-200 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#ff6b4a] font-mono uppercase flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    Editorial Revision Directives
                  </span>
                  <button
                    onClick={() => setShowRevisionForm(false)}
                    className="text-[#64748B] hover:text-[#F1F5F9]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preset Quick Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Too conversational",
                    "Missing benchmark citation",
                    "Add diagnostic telemetry",
                    "Strengthen technical hook",
                    "Trim introductory fluff"
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setRevisionPreset(revisionPreset === preset ? null : preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                        revisionPreset === preset
                          ? "bg-[#ff6b4a] text-[#070B0F] border-[#ff6b4a] font-bold"
                          : "bg-[#161D26] text-[#94A3B8] border-[#1F2D3D] hover:text-[#F1F5F9]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Specify feedback for Staff Writer & Editor agent rerun..."
                  rows={3}
                  className="w-full bg-[#0F1419] border border-[#1F2D3D] rounded-lg p-2.5 text-xs text-[#F1F5F9] font-mono focus:outline-none focus:border-[#ff6b4a] resize-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowRevisionForm(false)}
                    className="text-xs text-[#64748B] hover:text-[#F1F5F9] px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRevision}
                    className="bg-[#ff6b4a] hover:bg-[#ff522c] text-[#070B0F] text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    Submit Rejection & Notes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Interactive Claims Verification Checklist Gate */}
          <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F2D3D]/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00C9A7]" />
                <span className="text-xs font-bold text-[#F1F5F9] font-mono uppercase tracking-wider">
                  Claims Verification Gate
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                allClaimsVerified
                  ? "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/40"
                  : "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40"
              }`}>
                {verifiedClaimsCount}/{totalClaims} PASSED
              </span>
            </div>

            <p className="text-[11px] text-[#94A3B8]">
              Every numeric assertion, field benchmark, and performance claim is evaluated against verified telemetry before broadcast. Toggle status with 1 click:
            </p>

            <div className="space-y-2.5">
              {activeAsset.claim_checks?.map((claim) => {
                const isVerified = claim.verified === "Y";
                return (
                  <div
                    key={claim.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                      isVerified
                        ? "bg-[#070B0F] border-[#00C9A7]/30 hover:border-[#00C9A7]/60"
                        : "bg-[#070B0F] border-[#F59E0B]/40 hover:border-[#F59E0B]/80"
                    }`}
                  >
                    {/* Header with Source & Clean Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            claim.source_type === "GO_BENCHMARK"
                              ? "bg-[#00C9A7]/15 text-[#00C9A7] border border-[#00C9A7]/30"
                              : claim.source_type === "OPERATOR_DISPATCH_DATA"
                                ? "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30"
                                : claim.source_type === "VOICE_PACKET_TRACE"
                                  ? "bg-[#ff6b4a]/15 text-[#ff6b4a] border border-[#ff6b4a]/30"
                                  : "bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30"
                          }`}
                        >
                          {claim.source_type === "GO_BENCHMARK" 
                            ? "Verified Benchmark" 
                            : claim.source_type === "OPERATOR_DISPATCH_DATA" 
                              ? "Field Dispatch Metric" 
                              : claim.source_type === "VOICE_PACKET_TRACE"
                                ? "Voice Telemetry"
                                : "Contractor Ground Truth"}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-[#00C9A7]">
                        {isVerified ? "● Automated Gate Passed" : "● Manual Check Required"}
                      </span>
                    </div>

                    {/* Claim Text */}
                    <p className="text-xs text-[#F1F5F9] font-medium leading-snug">
                      "{claim.claim_text}"
                    </p>

                    {/* Notes */}
                    {claim.notes && (
                      <p className="text-[10px] text-[#64748B] italic">
                        Proof Note: {claim.notes}
                      </p>
                    )}

                    {/* 1-Click Status Toggle Action */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => toggleClaimStatus(claim.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                          isVerified
                            ? "bg-[#00C9A7]/20 hover:bg-[#00C9A7]/30 text-[#00C9A7] border border-[#00C9A7]/40"
                            : "bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#F59E0B] border border-[#F59E0B]/40"
                        }`}
                      >
                        {isVerified ? (
                          <>
                            <Check className="w-3 h-3 text-[#00C9A7]" />
                            <span>Verified Claim</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />
                            <span>Flagged / Needs Proof</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE-FIRST STICKY ACTION BAR (VISIBLE ON PHONES) */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-[#0f1419]/95 backdrop-blur-md border-t border-[#1f2b37] p-3 px-4 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-[#ff6b4a]">
              {activeAsset.id}
            </span>
            <span className="text-[10px] font-mono text-[#94A3B8]">
              • {verifiedClaimsCount}/{totalClaims} Claims
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate">
            {activeAsset.title}
          </div>
        </div>

        {activeAsset.status === "PUBLISHED" || publishPhase === "DONE" ? (
          <a
            href={activeAsset.blog_url || `https://getminions.ai/blog/${activeAsset.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <span>Live Blog</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button
            onClick={handleApproveAndPublish}
            disabled={publishPhase !== "IDLE"}
            className="px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg shadow-[#00C9A7]/20 disabled:opacity-50 cursor-pointer"
          >
            {publishPhase !== "IDLE" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}


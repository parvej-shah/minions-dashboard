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
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
  CheckCircle,
  AlertCircle,
  Hash,
  Cpu,
  CornerDownRight,
  Filter,
  Image as ImageIcon,
  CheckCheck,
  Trash2,
  EyeOff
} from "lucide-react";
import { AssetItem, ClaimCheckItem, SocialVariantItem, AssetStatus } from "@/lib/types";
import { INITIAL_ASSETS } from "@/lib/api";
import ConfirmModal from "@/components/common/ConfirmModal";

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

  // Custom confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toggleLiveConfirmOpen, setToggleLiveConfirmOpen] = useState(false);
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  
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
  const [listFilter, setListFilter] = useState<"ALL" | "PENDING_REVIEW" | "PUBLISHED" | "UNPUBLISHED" | "DRAFT">("ALL");
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
      setIsEditingSocial(false);
    }
  }, [selectedAssetId, assets]);

  // Auto-scroll the active draft card into the center spotlight in the queue rail
  useEffect(() => {
    if (!selectedAssetId) return;
    const cardEl = document.getElementById(`queue-card-${selectedAssetId}`);
    if (cardEl) {
      cardEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
      });
    }
  }, [selectedAssetId]);

  // Queue indices & navigation helpers
  const currentAssetIndex = assets.findIndex((a) => a.id === activeAsset.id);
  const pendingAssets = assets.filter((a) => a.status === "PENDING_REVIEW");
  const pendingCount = pendingAssets.length;

  const handleNextDraft = () => {
    if (assets.length <= 1) return;
    const nextIndex = (currentAssetIndex + 1) % assets.length;
    setSelectedAssetId(assets[nextIndex].id);
  };

  const handlePrevDraft = () => {
    if (assets.length <= 1) return;
    const prevIndex = (currentAssetIndex - 1 + assets.length) % assets.length;
    setSelectedAssetId(assets[prevIndex].id);
  };

  // Global Keyboard Shortcuts: Cmd+S (Save), Cmd+Enter (Publish), [ / ] (Prev / Next Draft)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger navigation while typing inside textarea/input unless using Cmd/Ctrl modifier
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDraft();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (publishPhase === "IDLE" && activeAsset.status !== "PUBLISHED") {
          handleApproveAndPublish();
        }
        return;
      }

      // Quick navigation keys: '[' and ']' when not actively typing in an input
      if (!isInput) {
        if (e.key === "[" || (e.altKey && e.key === "ArrowLeft")) {
          e.preventDefault();
          handlePrevDraft();
        } else if (e.key === "]" || (e.altKey && e.key === "ArrowRight")) {
          e.preventDefault();
          handleNextDraft();
        } else if (e.key === "1") {
          setEditorMode("preview");
        } else if (e.key === "2") {
          setEditorMode("edit");
        } else if (e.key === "3") {
          setEditorMode("split");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editedTitle, editedHook, editedBody, editedLinkedin, editedFacebook, editedTwitter, activeAsset, currentAssetIndex, assets, publishPhase]);

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
        setSaveToast(activeAsset.status === "PUBLISHED" ? "Live blog updated & synced to getminions.ai!" : "Changes saved successfully to database!");
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
            // LinkedIn/Twitter publish nodes are disabled in 02_idea_to_asset, so only
            // list channels the pipeline actually posts to.
            published_urls: [
              `https://getminions.ai/blog/${activeAsset.slug}`,
              `https://facebook.com/getminionsai`
            ]
          })
        });
      } catch (e) {
        console.error("Failed to persist publish status:", e);
      }

      // Seamless Auto-Advance: if there are more pending drafts in queue, transition smoothly to next one
      const otherPending = updatedAssets.filter((a) => a.id !== activeAsset.id && a.status === "PENDING_REVIEW");
      if (otherPending.length > 0) {
        setTimeout(() => {
          setSelectedAssetId(otherPending[0].id);
          setPublishPhase("IDLE");
        }, 2400);
      }
    }, 2400);
  };

  // 1-Click Toggle Live Visibility (Publish / Unpublish without loss)
  const handleToggleLiveStatus = async () => {
    setIsTogglingLive(true);
    const isCurrentlyPublished = activeAsset.status === "PUBLISHED";
    const nextStatus: AssetStatus = isCurrentlyPublished ? "UNPUBLISHED" : "PUBLISHED";

    try {
      const res = await fetch(`/api/assets/${activeAsset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          published_at: nextStatus === "PUBLISHED" ? new Date().toISOString() : undefined,
        }),
      });

      if (res.ok) {
        setAssets(prev =>
          prev.map(a =>
            a.id === activeAsset.id
              ? {
                  ...a,
                  status: nextStatus,
                  published_at: nextStatus === "PUBLISHED" ? new Date().toISOString() : undefined,
                  blog_url: nextStatus === "PUBLISHED" ? `https://getminions.ai/blog/${a.slug}` : undefined,
                }
              : a
          )
        );
        setPublishSuccess(nextStatus === "PUBLISHED");
        setSaveToast(
          nextStatus === "PUBLISHED"
            ? "Post restored and published live on getminions.ai/blog!"
            : "Post unpublished and hidden from public blog!"
        );
        setTimeout(() => setSaveToast(null), 3500);
      }
    } catch (e) {
      console.error("Failed to toggle live status:", e);
    } finally {
      setIsTogglingLive(false);
      setToggleLiveConfirmOpen(false);
    }
  };

  // Permanent Delete Action
  const handlePermanentDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/assets/${activeAsset.id}?mode=permanent`, {
        method: "DELETE",
      });

      if (res.ok) {
        const deletedIndex = assets.findIndex(a => a.id === activeAsset.id);
        const remaining = assets.filter(a => a.id !== activeAsset.id);
        setAssets(remaining);
        if (remaining.length > 0) {
          const nextIndex = Math.max(0, Math.min(deletedIndex >= 0 ? deletedIndex : 0, remaining.length - 1));
          setSelectedAssetId(remaining[nextIndex].id);
        }
        setSaveToast("Draft permanently deleted.");
        setTimeout(() => setSaveToast(null), 3500);
        window.dispatchEvent(new Event("minions-counts-updated"));
      }
    } catch (e) {
      console.error("Failed to permanently delete asset:", e);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
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

  // Filtered queue items based on active queue filter
  const queueAssets = listFilter === "PENDING_REVIEW"
    ? assets.filter((a) => a.status === "PENDING_REVIEW")
    : listFilter === "PUBLISHED"
      ? assets.filter((a) => a.status === "PUBLISHED")
      : listFilter === "UNPUBLISHED"
        ? assets.filter((a) => a.status === "UNPUBLISHED")
        : assets;

  const currentQueueIndex = queueAssets.findIndex((a) => a.id === activeAsset.id);
  const unpublishedCount = assets.filter((a) => a.status === "UNPUBLISHED").length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-32 lg:pb-16">
      
      {/* ── 1. ACTIVE REVIEW QUEUE RIBBON (Frictionless Queue Management) ── */}
      <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-4 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2D3D]/60 pb-3">
          
          {/* Left: Queue Title & Status Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00C9A7]" />
              <span className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider font-mono">
                Editorial Review Queue
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#070B0F] p-1 rounded-xl border border-[#1F2D3D] flex-wrap">
              <button
                onClick={() => setListFilter("PENDING_REVIEW")}
                className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  listFilter === "PENDING_REVIEW"
                    ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F1F5F9]"
                }`}
              >
                Needs Review ({pendingCount})
              </button>
              <button
                onClick={() => setListFilter("ALL")}
                className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  listFilter === "ALL"
                    ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F1F5F9]"
                }`}
              >
                All Drafts ({assets.length})
              </button>
              <button
                onClick={() => setListFilter("PUBLISHED")}
                className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  listFilter === "PUBLISHED"
                    ? "bg-[#00C9A7] text-[#070B0F] font-bold shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F1F5F9]"
                }`}
              >
                Published ({assets.filter(a => a.status === "PUBLISHED").length})
              </button>
              {unpublishedCount > 0 && (
                <button
                  onClick={() => setListFilter("UNPUBLISHED")}
                  className={`px-2.5 py-0.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    listFilter === "UNPUBLISHED"
                      ? "bg-[#F59E0B] text-[#070B0F] font-bold shadow-sm"
                      : "text-[#F59E0B] hover:bg-[#161D26]"
                  }`}
                >
                  Offline ({unpublishedCount})
                </button>
              )}
            </div>
          </div>

          {/* Right: Quick Sequential Navigation */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center gap-1 bg-[#070B0F] p-1 rounded-xl border border-[#1F2D3D]">
              <button
                onClick={handlePrevDraft}
                title="Previous Draft (Key: [ )"
                className="px-2 py-1 rounded-lg text-xs font-bold text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26] transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <span className="px-2 text-[11px] font-mono font-bold text-[#00C9A7] select-none">
                {currentAssetIndex + 1} / {assets.length}
              </span>

              <button
                onClick={handleNextDraft}
                title="Next Draft (Key: ] )"
                className="px-2 py-1 rounded-lg text-xs font-bold text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26] transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Queue Card Rail (Tactile 1-Click Draft Switcher with Auto-Spotlight Scroll) */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
          {queueAssets.map((asset, idx) => {
            const isCurrent = asset.id === activeAsset.id;
            return (
              <button
                key={asset.id}
                id={`queue-card-${asset.id}`}
                onClick={() => setSelectedAssetId(asset.id)}
                className={`flex items-center gap-3 p-2.5 px-3 rounded-xl border text-left shrink-0 transition-all duration-200 cursor-pointer min-w-[250px] max-w-[290px] relative ${
                  isCurrent
                    ? "bg-[#161D26] border-[#00C9A7] shadow-lg shadow-[#00C9A7]/20 ring-2 ring-[#00C9A7] scale-[1.02] z-10 opacity-100"
                    : "bg-[#070B0F] border-[#1F2D3D] hover:border-[#2A3D52] hover:bg-[#161D26]/70 opacity-65 hover:opacity-100"
                }`}
              >
                {/* Micro Thumbnail */}
                <div className={`w-9 h-9 rounded-lg overflow-hidden bg-[#161D26] border shrink-0 flex items-center justify-center transition-all ${
                  isCurrent ? "border-[#00C9A7] ring-1 ring-[#00C9A7]/50" : "border-[#1F2D3D]"
                }`}>
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

                {/* Info block */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-mono font-bold ${isCurrent ? "text-[#00C9A7]" : "text-[#94A3B8]"}`}>
                      Draft #{idx + 1}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isCurrent
                          ? "bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/40"
                          : asset.status === "PUBLISHED"
                            ? "bg-[#00C9A7]/20 text-[#00C9A7]"
                            : asset.status === "PENDING_REVIEW"
                              ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                              : "bg-[#64748B]/20 text-[#94A3B8]"
                      }`}
                    >
                      {isCurrent ? "● Spotlight" : asset.status === "PENDING_REVIEW" ? "Needs Review" : asset.status}
                    </span>
                  </div>

                  <div className={`text-xs font-semibold truncate ${isCurrent ? "text-[#F1F5F9] font-bold" : "text-[#CBD5E1]"}`}>
                    {asset.title}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-mono">
                    <span>{asset.audience}</span>
                    <span>•</span>
                    <span>{asset.claim_checks ? `${asset.claim_checks.filter(c => c.verified === 'Y').length}/${asset.claim_checks.length} Claims` : 'Draft'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Top Header / Active Draft Title ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {isStandaloneRoute && (
            <Link
              href="/editorial"
              className="p-2.5 rounded-xl bg-[#0F1419] border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26] hover:border-[#2A3D52] transition-all shrink-0"
              title="Return to Editorial Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
              <span className="text-[#64748B] tracking-wider uppercase font-semibold">Active Review Target</span>
              <span className="text-[#2A3D52]">/</span>
              <span className="text-[#00C9A7] font-bold">Draft {currentAssetIndex + 1} of {assets.length}</span>
              <span className="text-[#2A3D52]">•</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/30">
                v{activeAsset.version}.0
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

            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#F1F5F9] mt-1 truncate">
              {editedTitle}
            </h1>
          </div>
        </div>

        {/* Live Status Badge or Link */}
        <div className="flex items-center gap-2.5 shrink-0">
          {activeAsset.status === "PUBLISHED" ? (
            <a
              href={activeAsset.blog_url || `https://getminions.ai/blog/${activeAsset.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/30 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Live on Blog</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          ) : (
            <span className="flex items-center gap-1.5 bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 text-xs font-semibold px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
              Waiting for Review
            </span>
          )}
        </div>
      </div>

      {/* ── Fresh Publish Success Notification Toast ── */}
      {publishPhase === "DONE" && (
        <div className="bg-[#00C9A7]/10 border border-[#00C9A7]/30 p-3.5 px-4 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#00C9A7] shrink-0" />
            <div className="text-xs text-[#F1F5F9]">
              <span className="font-bold text-[#00C9A7]">Published Live:</span> Staged article, 2K cover art, and social webhooks are live!
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={activeAsset.blog_url || `https://getminions.ai/blog/${activeAsset.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono font-bold text-[#00C9A7] hover:underline flex items-center gap-1"
            >
              <span>View Post</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setPublishPhase("IDLE")}
              className="text-[#64748B] hover:text-[#F1F5F9] p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── TWO-PANEL EXPANSIVE EDITORIAL LAYOUT (8 Cols Reading / 4 Cols Sticky Inspector) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ══════════════════════════════════════════════════════════
            LEFT EXPANSIVE PANEL: Article Preview, 16:9 Cover, Social (8 Cols)
            ══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. 16:9 Cover Image Card */}
          <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-4 sm:p-5 space-y-3 shadow-xl">
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

            {/* Cover Image Bottom Info Bar */}
            {activeAsset.hero_image_url && (
              <div className="flex items-center justify-between gap-3 bg-[#070B0F] border border-[#1F2D3D] rounded-xl px-3.5 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#00C9A7] shrink-0"></span>
                  <span className="text-xs font-semibold text-[#F1F5F9] truncate">
                    16:9 Commercial Studio Cover Art Staged
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={activeAsset.hero_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#161D26] hover:bg-[#1E2733] text-xs font-medium text-[#00C9A7] border border-[#00C9A7]/30 hover:border-[#00C9A7] transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Open full resolution cover image"
                  >
                    <span>View 2K Art</span>
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
                <div className="bg-[#070B0F] border border-[#1F2D3D] rounded-xl p-4 overflow-y-auto max-h-[560px] space-y-4 max-w-full">
                  <div className="border-b border-[#1F2D3D] pb-3">
                    <h2 className="text-lg font-bold text-[#F1F5F9] leading-tight break-words [overflow-wrap:anywhere]">{editedTitle}</h2>
                    {editedHook && <p className="text-xs text-[#94A3B8] italic mt-1 break-words [overflow-wrap:anywhere]">{editedHook}</p>}
                  </div>
                  <div className="space-y-3 text-xs text-[#E2E8F0] font-sans leading-relaxed max-w-full">
                    {(() => {
                      const normalized = (editedBody || "")
                        .replace(/^(\s*#{1,6}\s+[^\n]+)/gm, "\n\n$1\n\n")
                        .replace(/!\[([^\]]*)\]\s*\((https?:\/\/[^)\s]+)\)/g, "\n\n![$1]($2)\n\n")
                        .replace(/(```[\s\S]*?```)/g, "\n\n$1\n\n")
                        .replace(/^(\s*>[^\n]+)/gm, "\n\n$1\n\n")
                        .replace(/(?:^|\n|\s+)(Rule\s+\d+:)/gi, "\n\n$1")
                        .replace(/\n{3,}/g, "\n\n");
                      return normalized.split("\n\n").map((chunk, idx) => {
                        const trimmed = chunk.trim();
                        if (!trimmed) return null;

                        // Markdown Image Match
                        const imgMatch = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^)\s]+)\)$/) || trimmed.match(/!\[(.*?)\]\((https?:\/\/[^)\s]+)\)/);
                        if (imgMatch) {
                          const altText = imgMatch[1] || "Editorial Image";
                          const imgSrc = imgMatch[2];
                          return (
                            <figure key={idx} className="my-3 space-y-1 w-full max-w-full">
                              <div className="relative overflow-hidden rounded-xl border border-[#1F2D3D] bg-[#0F1419] aspect-[16/9] w-full max-w-full">
                                <img
                                  src={imgSrc}
                                  alt={altText}
                                  className="w-full h-full object-cover object-center"
                                  loading="lazy"
                                />
                              </div>
                              {altText && altText.trim() && (
                                <figcaption className="text-center text-[10px] font-mono text-[#94A3B8] italic truncate">
                                  {altText}
                                </figcaption>
                              )}
                            </figure>
                          );
                        }

                        // Standalone image URL or Pollinations URL
                        if (/^\(?(https?:\/\/[^\s)]+\.(png|jpe?g|webp|svg|gif)(\?[^\s)]*)?)\)?$/i.test(trimmed) || /^\(?(https?:\/\/image\.pollinations\.ai\/[^\s)]+)\)?$/i.test(trimmed)) {
                          const rawUrl = trimmed.replace(/^\(|\)$/g, "").trim();
                          return (
                            <figure key={idx} className="my-3 space-y-1 w-full max-w-full">
                              <div className="relative overflow-hidden rounded-xl border border-[#1F2D3D] bg-[#0F1419] aspect-[16/9] w-full max-w-full">
                                <img
                                  src={rawUrl}
                                  alt="Editorial Visual"
                                  className="w-full h-full object-cover object-center"
                                  loading="lazy"
                                />
                              </div>
                            </figure>
                          );
                        }

                        // Rule Callout Card
                        if (/^Rule\s+\d+:/i.test(trimmed)) {
                          const ruleMatch = trimmed.match(/^(Rule\s+\d+:)\s*([\s\S]*)$/i);
                          const ruleHeader = ruleMatch ? ruleMatch[1] : "Rule";
                          const ruleBody = ruleMatch ? ruleMatch[2] : trimmed;

                          return (
                            <div
                              key={idx}
                              className="my-3 rounded-xl border border-[#00C9A7]/30 bg-[#00C9A7]/5 p-3 border-l-4 border-l-[#00C9A7]"
                            >
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wide bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/40 block w-fit mb-1.5">
                                {ruleHeader}
                              </span>
                              <p className="text-xs text-[#CBD5E1] break-words [overflow-wrap:anywhere] leading-relaxed font-medium">
                                {ruleBody}
                              </p>
                            </div>
                          );
                        }

                        if (/^#{1,6}\s+/.test(trimmed)) {
                          const lines = trimmed.split("\n");
                          const firstLine = lines[0].trim();
                          const restText = lines.slice(1).join("\n").trim();
                          const isH3 = firstLine.startsWith("###");
                          const cleanHeading = firstLine.replace(/^#{1,6}\s+/, "").trim();

                          return (
                            <div key={idx} className="space-y-1.5 pt-2">
                              {isH3 ? (
                                <h4 className="font-bold text-[#00C9A7] text-xs font-sans break-words [overflow-wrap:anywhere]">{cleanHeading}</h4>
                              ) : (
                                <h3 className="font-bold text-[#F1F5F9] text-sm text-[#00C9A7] font-sans break-words [overflow-wrap:anywhere]">{cleanHeading}</h3>
                              )}
                              {restText && <p className="text-xs text-[#CBD5E1] break-words [overflow-wrap:anywhere] leading-relaxed">{restText}</p>}
                            </div>
                          );
                        }

                        if (trimmed.startsWith("> ")) {
                          return <blockquote key={idx} className="border-l-2 border-[#ff6b4a] pl-2 italic text-[#94A3B8] break-words [overflow-wrap:anywhere]">{trimmed.replace(/^>\s*/, "")}</blockquote>;
                        }
                        return <p key={idx} className="break-words [overflow-wrap:anywhere] leading-relaxed text-[#CBD5E1]">{trimmed}</p>;
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* View Mode 3: Immersive Reading View */}
            {editorMode === "preview" && (
              <div className="space-y-6 animate-in fade-in duration-150 max-w-full">
                {/* Article Header */}
                <div className="space-y-2 border-b border-[#1F2D3D]/60 pb-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00C9A7] flex-wrap">
                    <span>{activeAsset.pillar || "Contractor Realities"}</span>
                    <span>•</span>
                    <span>{readingTimeMinutes} min read</span>
                    <span>•</span>
                    <span className="text-[#94A3B8]">{wordCount} words</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#F1F5F9] leading-tight break-words [overflow-wrap:anywhere] font-sans">
                    {editedTitle}
                  </h1>
                  {(editedHook || activeAsset.hook) && (
                    <p className="text-xs sm:text-sm font-medium text-[#94A3B8] italic border-l-2 border-[#00C9A7] pl-3 py-0.5 break-words [overflow-wrap:anywhere] font-sans">
                      {editedHook || activeAsset.hook}
                    </p>
                  )}
                </div>

                {/* Body Paragraphs & Formatted Markdown */}
                <div className="prose-container space-y-5 max-w-[780px] w-full font-sans">
                  {(() => {
                    const normalized = (editedBody || "")
                      .replace(/^(\s*#{1,6}\s+[^\n]+)/gm, "\n\n$1\n\n")
                      .replace(/!\[([^\]]*)\]\s*\((https?:\/\/[^)\s]+)\)/g, "\n\n![$1]($2)\n\n")
                      .replace(/(```[\s\S]*?```)/g, "\n\n$1\n\n")
                      .replace(/^(\s*>[^\n]+)/gm, "\n\n$1\n\n")
                      .replace(/(?:^|\n|\s+)(Rule\s+\d+:)/gi, "\n\n$1")
                      .replace(/\n{3,}/g, "\n\n");
                    return normalized.split("\n\n").map((chunk, idx) => {
                      const trimmed = chunk.trim();
                      if (!trimmed) return null;

                      // 1. Markdown Image Tag: `![alt](url)`
                      const imgMatch = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^)\s]+)\)$/) || trimmed.match(/!\[(.*?)\]\((https?:\/\/[^)\s]+)\)/);
                      if (imgMatch) {
                        const altText = imgMatch[1] || "Editorial Image";
                        const imgSrc = imgMatch[2];
                        return (
                          <figure key={idx} className="my-6 space-y-2 w-full max-w-full">
                            <div className="relative overflow-hidden rounded-2xl border border-[#1F2D3D] bg-[#070B0F] aspect-[16/9] w-full max-w-full shadow-lg group">
                              <img
                                src={imgSrc}
                                alt={altText}
                                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
                                loading="lazy"
                              />
                              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
                            </div>
                            {altText && altText.trim() && (
                              <figcaption className="text-center text-xs font-mono text-[#94A3B8] italic truncate px-2">
                                {altText}
                              </figcaption>
                            )}
                          </figure>
                        );
                      }

                      // 2. Standalone image URL wrapped in parens or raw url: e.g. `(https://image.pollinations.ai/...)` or `https://...png`
                      if (/^\(?(https?:\/\/[^\s)]+\.(png|jpe?g|webp|svg|gif)(\?[^\s)]*)?)\)?$/i.test(trimmed) || /^\(?(https?:\/\/image\.pollinations\.ai\/[^\s)]+)\)?$/i.test(trimmed)) {
                        const rawUrl = trimmed.replace(/^\(|\)$/g, "").trim();
                        return (
                          <figure key={idx} className="my-6 space-y-2 w-full max-w-full">
                            <div className="relative overflow-hidden rounded-2xl border border-[#1F2D3D] bg-[#070B0F] aspect-[16/9] w-full max-w-full shadow-lg group">
                              <img
                                src={rawUrl}
                                alt="Editorial Graphic"
                                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
                                loading="lazy"
                              />
                              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
                            </div>
                          </figure>
                        );
                      }

                      // 3. Rule Callout Card (Rule 1: ..., Rule 2: ..., Rule 3: ...)
                      if (/^Rule\s+\d+:/i.test(trimmed)) {
                        const ruleMatch = trimmed.match(/^(Rule\s+\d+:)\s*([\s\S]*)$/i);
                        const ruleHeader = ruleMatch ? ruleMatch[1] : "Rule";
                        const ruleBody = ruleMatch ? ruleMatch[2] : trimmed;

                        return (
                          <div
                            key={idx}
                            className="my-6 rounded-2xl border border-[#00C9A7]/30 bg-[#00C9A7]/5 p-5 sm:p-6 border-l-4 border-l-[#00C9A7] shadow-sm"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wide bg-[#00C9A7]/20 text-[#00C9A7] border border-[#00C9A7]/40">
                                {ruleHeader}
                              </span>
                            </div>
                            <p className="text-base sm:text-lg leading-relaxed text-[#F1F5F9] font-medium">
                              {ruleBody}
                            </p>
                          </div>
                        );
                      }

                      // Section Headings: H1 / H2 / H3
                      if (/^#{1,6}\s+/.test(trimmed)) {
                        const lines = trimmed.split("\n");
                        const firstLine = lines[0].trim();
                        const restText = lines.slice(1).join("\n").trim();
                        const isH3 = firstLine.startsWith("###");
                        const cleanTitle = firstLine.replace(/^#{1,6}\s+/, "").trim();

                        return (
                          <div key={idx} className="space-y-3 pt-4">
                            {isH3 ? (
                              <h3 className="text-base sm:text-lg font-bold text-[#00C9A7] pt-2 flex items-center gap-2 break-words [overflow-wrap:anywhere] font-sans">
                                <CornerDownRight className="w-4 h-4 text-[#00C9A7] shrink-0" />
                                <span>{cleanTitle}</span>
                              </h3>
                            ) : (
                              <h2 className="text-lg sm:text-2xl font-extrabold text-[#F1F5F9] pb-2 border-b border-[#1F2D3D]/60 flex items-center gap-2.5 break-words [overflow-wrap:anywhere] font-sans tracking-tight">
                                <span className="text-[#00C9A7] font-mono text-base font-bold shrink-0">#</span>
                                <span>{cleanTitle}</span>
                              </h2>
                            )}
                            {restText && (
                              <p className="text-[15px] sm:text-[16px] text-[#E2E8F0] leading-[1.8] font-normal tracking-normal font-sans break-words [overflow-wrap:anywhere]">
                                {restText}
                              </p>
                            )}
                          </div>
                        );
                      }

                      // Code snippet block
                      if (trimmed.startsWith("```")) {
                        const lines = trimmed.split("\n");
                        const lang = lines[0].replace("```", "").trim() || "json";
                        const codeContent = lines.slice(1, lines[lines.length - 1].startsWith("```") ? -1 : undefined).join("\n");
                        return (
                          <div
                            key={idx}
                            className="bg-[#070B0F] border border-[#1F2D3D] rounded-xl overflow-hidden my-4 shadow-inner max-w-full"
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
                            <pre className="p-3 sm:p-4 text-xs font-mono text-[#00C9A7] overflow-x-auto leading-relaxed max-w-full">
                              {codeContent}
                            </pre>
                          </div>
                        );
                      }

                      // Numbered or Bullet list
                      if (trimmed.startsWith("1. ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                        const items = trimmed.split("\n");
                        return (
                          <ul key={idx} className="space-y-2 my-3 pl-2 max-w-full">
                            {items.map((item, iIndex) => (
                              <li key={iIndex} className="text-[15px] sm:text-[16px] text-[#F1F5F9]/90 font-sans leading-relaxed flex items-start gap-2.5 break-words [overflow-wrap:anywhere]">
                                <span className="text-[#00C9A7] font-mono font-bold text-xs mt-1 shrink-0">▸</span>
                                <span>{item.replace(/^(\d+\.|\*|-)\s+/, "")}</span>
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
                            className="border-l-2 border-[#ff6b4a] bg-[#ff6b4a]/5 p-3.5 rounded-r-xl text-sm sm:text-[15px] font-sans italic text-[#F1F5F9]/90 my-3 break-words [overflow-wrap:anywhere]"
                          >
                            {trimmed.replace(/^>\s*/, "")}
                          </blockquote>
                        );
                      }

                      // Standard Editorial Paragraph
                      return (
                        <p
                          key={idx}
                          className="text-[15px] sm:text-[16px] text-[#E2E8F0] leading-[1.8] font-normal tracking-normal font-sans selection:bg-[#00C9A7]/20 break-words [overflow-wrap:anywhere]"
                        >
                          {trimmed}
                        </p>
                      );
                    });
                  })()}
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
            RIGHT PANEL: Streamlined Sticky Review Inspector (4 Cols)
            ══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          
          {/* 1. Review Decision & Quick Action Hub */}
          <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F2D3D]/60">
              <span className="text-xs font-bold font-mono text-[#F1F5F9] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C9A7]" />
                Review & Decision
              </span>
              {isDirty ? (
                <span className="text-[10px] font-mono text-[#F59E0B] font-bold bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/30 animate-pulse">
                  ● Unsaved Edits
                </span>
              ) : (
                <span className="text-[10px] font-mono text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 rounded border border-[#00C9A7]/30">
                  {activeAsset.status}
                </span>
              )}
            </div>

            {/* Quick Queue Navigation in Sticky Dock */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <button
                onClick={handlePrevDraft}
                className="flex-1 py-1.5 px-2 rounded-lg bg-[#070B0F] hover:bg-[#161D26] border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Previous Draft ( [ )"
              >
                <ChevronLeft className="w-3 h-3 text-[#00C9A7]" />
                <span>Prev Draft</span>
              </button>

              <span className="text-[10px] font-mono text-[#64748B] shrink-0 font-bold px-1">
                {currentAssetIndex + 1} / {assets.length}
              </span>

              <button
                onClick={handleNextDraft}
                className="flex-1 py-1.5 px-2 rounded-lg bg-[#070B0F] hover:bg-[#161D26] border border-[#1F2D3D] text-[#94A3B8] hover:text-[#F1F5F9] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Next Draft ( ] )"
              >
                <span>Next Draft</span>
                <ChevronRight className="w-3 h-3 text-[#00C9A7]" />
              </button>
            </div>

            {/* Quick Save Draft Button */}
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDirty
                  ? "bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] shadow-md shadow-[#00C9A7]/20"
                  : "bg-[#161D26] hover:bg-[#1E2733] text-[#F1F5F9] border border-[#1F2D3D]"
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? "Saving to Database..." : isDirty ? "Save Draft Changes" : "Draft Synced to Database ✓"}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono rounded bg-black/20 text-current">
                ⌘S
              </kbd>
            </button>

            {/* Main Publish Decision & Live Visibility Hub */}
            {activeAsset.status === "PUBLISHED" ? (
              <div className="space-y-2 pt-1">
                <div className="w-full bg-[#00C9A7]/15 border border-[#00C9A7] text-[#00C9A7] p-2.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4" />
                    <span>Live on getminions.ai</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
                </div>

                <a
                  href={activeAsset.blog_url || `https://getminions.ai/blog/${activeAsset.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] text-[#F1F5F9] text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-[#00C9A7]" />
                  <span>View Live Blog Post</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {/* 1-Click Reversible Unpublish Toggle */}
                <button
                  onClick={() => setToggleLiveConfirmOpen(true)}
                  className="w-full bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Hide from public site without deleting content"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Unpublish (Hide from Public)</span>
                </button>

                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Permanently delete post and claim verifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            ) : activeAsset.status === "UNPUBLISHED" ? (
              <div className="space-y-2.5 pt-1">
                <div className="w-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] p-2.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4" />
                    <span>Unpublished (Offline)</span>
                  </div>
                  <span className="text-[10px] font-mono font-normal">Hidden from public</span>
                </div>

                {/* 1-Click Restore to Live */}
                <button
                  onClick={() => setToggleLiveConfirmOpen(true)}
                  className="w-full bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00C9A7]/20 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Republish (Put Live on Blog)</span>
                </button>

                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Permanently delete post and claim verifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={handleApproveAndPublish}
                  disabled={publishPhase !== "IDLE"}
                  className="w-full bg-[#00C9A7] hover:bg-[#00A88A] active:scale-[0.98] text-[#070B0F] font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-[#00C9A7]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-75 cursor-pointer"
                >
                  {publishPhase === "IDLE" && (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & 1-Click Publish Live</span>
                    </>
                  )}

                  {publishPhase === "SYNCING" && (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#070B0F]" />
                      <span>1/3 Syncing Supabase...</span>
                    </>
                  )}

                  {publishPhase === "BROADCASTING" && (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#070B0F]" />
                      <span>2/3 Broadcasting CDN...</span>
                    </>
                  )}

                  {publishPhase === "EMITTING" && (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#070B0F]" />
                      <span>3/3 Emitting Webhook...</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Permanently delete this draft and its claim verifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Draft</span>
                </button>
              </div>
            )}

            {/* Compact Metadata Chips */}
            <div className="pt-2 border-t border-[#1F2D3D]/60 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="px-2.5 py-1.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D]/60 flex items-center justify-between">
                  <span className="text-[#64748B]">Audience:</span>
                  <span className="text-[#F1F5F9] font-bold">{activeAsset.audience}</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D]/60 flex items-center justify-between">
                  <span className="text-[#64748B]">Length:</span>
                  <span className="text-[#F1F5F9] font-bold">{wordCount}w</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D]/60 flex items-center justify-between">
                  <span className="text-[#64748B]">Read Time:</span>
                  <span className="text-[#F1F5F9] font-bold">~{readingTimeMinutes}m</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D]/60 flex items-center justify-between">
                  <span className="text-[#64748B]">Cost:</span>
                  <span className="text-[#00C9A7] font-bold">${costBreakdown.total.toFixed(4)}</span>
                </div>
              </div>

              {/* Expandable Cost Details Toggle */}
              <div className="pt-1">
                <button
                  onClick={() => setShowCostDetails(!showCostDetails)}
                  className="w-full text-left flex items-center justify-between text-[11px] font-mono text-[#64748B] hover:text-[#94A3B8] py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-[#00C9A7]" />
                    Model Rate Breakdown
                  </span>
                  {showCostDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showCostDetails && (
                  <div className="p-2.5 rounded-lg bg-[#070B0F] border border-[#1F2D3D]/60 space-y-1 text-[10px] font-mono text-[#94A3B8] animate-in fade-in duration-150">
                    <div className="flex justify-between">
                      <span>• Strategist (qwen3.7-max):</span>
                      <span className="text-[#F1F5F9]">${costBreakdown.strategist.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Writer (qwen-plus):</span>
                      <span className="text-[#F1F5F9]">${costBreakdown.writer.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Editor (qwen3.7-flash):</span>
                      <span className="text-[#F1F5F9]">${costBreakdown.editor.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Visual Art (qwen-image-3.0):</span>
                      <span className="text-[#F1F5F9]">${costBreakdown.coverArt.toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Compact Claims Verification Gate */}
          <div className="bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F2D3D]/60">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00C9A7]" />
                <span className="text-xs font-bold text-[#F1F5F9] font-mono uppercase tracking-wider">
                  Claims Gate
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

            {/* Scrollable Claims Checklist */}
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {activeAsset.claim_checks && activeAsset.claim_checks.length > 0 ? (
                activeAsset.claim_checks.map((claim) => {
                  const isVerified = claim.verified === "Y";
                  return (
                    <div
                      key={claim.id}
                      className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                        isVerified
                          ? "bg-[#070B0F] border-[#00C9A7]/30 hover:border-[#00C9A7]/60"
                          : "bg-[#070B0F] border-[#F59E0B]/40 hover:border-[#F59E0B]/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded font-mono ${
                            claim.source_type === "GO_BENCHMARK"
                              ? "bg-[#00C9A7]/15 text-[#00C9A7]"
                              : claim.source_type === "OPERATOR_DISPATCH_DATA"
                                ? "bg-[#3B82F6]/15 text-[#3B82F6]"
                                : "bg-[#ff6b4a]/15 text-[#ff6b4a]"
                          }`}
                        >
                          {claim.source_type === "GO_BENCHMARK"
                            ? "Benchmark"
                            : claim.source_type === "OPERATOR_DISPATCH_DATA"
                              ? "Field Metric"
                              : "Voice Telemetry"}
                        </span>

                        <button
                          onClick={() => toggleClaimStatus(claim.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            isVerified
                              ? "bg-[#00C9A7]/20 text-[#00C9A7]"
                              : "bg-[#F59E0B]/20 text-[#F59E0B]"
                          }`}
                        >
                          {isVerified ? <Check className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                          <span>{isVerified ? "Verified" : "Flagged"}</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-[#F1F5F9] font-medium leading-snug">
                        "{claim.claim_text}"
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-[#64748B] font-mono">
                  No claims checks attached to this draft.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE-FIRST FLOATING ACTION BAR (VISIBLE ON PHONES & TABLETS - SITS ABOVE BOTTOM DOCK) ── */}
      <div className="lg:hidden fixed bottom-12.5 left-0 right-0 z-35 bg-[#0F1419]/95 backdrop-blur-xl border-t border-[#1F2D3D] p-2.5 px-4 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="font-bold text-[#00C9A7]">Draft {currentAssetIndex + 1}/{assets.length}</span>
            <span className="text-[#64748B]">•</span>
            <span className="text-[#94A3B8]">{wordCount}w</span>
            <span className="text-[#64748B]">•</span>
            <span className={allClaimsVerified ? "text-[#00C9A7]" : "text-[#F59E0B]"}>
              {verifiedClaimsCount}/{totalClaims} Claims
            </span>
          </div>
          <div className="text-xs font-bold text-[#F1F5F9] truncate">
            {editedTitle}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isDirty
                ? "bg-[#00C9A7] text-[#070B0F] border-[#00C9A7]"
                : "bg-[#161D26] text-[#94A3B8] border-[#1F2D3D]"
            }`}
            title="Save Draft (⌘S)"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>

          {activeAsset.status === "PUBLISHED" || publishPhase === "DONE" ? (
            <a
              href={activeAsset.blog_url || `https://getminions.ai/blog/${activeAsset.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-[#00C9A7] text-[#070B0F] rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-sm"
            >
              <span>Live</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <button
              onClick={handleApproveAndPublish}
              disabled={publishPhase !== "IDLE"}
              className="px-3.5 py-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg shadow-[#00C9A7]/20 disabled:opacity-50 cursor-pointer"
            >
              {publishPhase !== "IDLE" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing</span>
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

      {/* ── CUSTOM CONFIRMATION MODALS (REPLACING BROWSER ALERTS) ── */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Permanently Delete Asset"
        description={`⚠️ Are you sure you want to permanently delete ${activeAsset.id}? This will permanently remove the blog post, draft content, and all claim verifications from the database.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handlePermanentDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={toggleLiveConfirmOpen}
        title={activeAsset.status === "PUBLISHED" ? "Unpublish Post" : "Republish Post Live"}
        description={
          activeAsset.status === "PUBLISHED"
            ? `Are you sure you want to unpublish "${activeAsset.title}"? It will immediately be taken down from getminions.ai/blog and returned to the review queue without deleting any content.`
            : `Are you sure you want to republish "${activeAsset.title}" live to getminions.ai/blog?`
        }
        confirmLabel={activeAsset.status === "PUBLISHED" ? "Unpublish Post" : "Republish Live"}
        cancelLabel="Cancel"
        variant={activeAsset.status === "PUBLISHED" ? "warning" : "primary"}
        isLoading={isTogglingLive}
        onConfirm={handleToggleLiveStatus}
        onClose={() => setToggleLiveConfirmOpen(false)}
      />
    </div>
  );
}


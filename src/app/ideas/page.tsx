"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  X,
  Radio,
  Tag,
  Layers,
  ArrowRight,
  TrendingUp,
  Globe,
  MessageSquare,
  AlertCircle,
  Edit3,
  Trash2,
  Unlock,
  SlidersHorizontal,
  Check
} from "lucide-react";
import { IdeaItem, AudienceLane, TargetTrade, IdeaSource, IdeaStatus } from "@/lib/types";
import { INITIAL_IDEAS } from "@/lib/api";

const TRADES: TargetTrade[] = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Pest Control",
  "Voice AI",
  "Systems Architecture",
  "Operations"
];

const AUDIENCES: AudienceLane[] = ["ICP", "PEER", "BRIDGE"];

const STATUS_FILTERS: Array<"ALL" | IdeaStatus> = [
  "ALL",
  "HARVESTED",
  "CLAIMED",
  "DRAFTED",
  "PUBLISHED",
  "REJECTED"
];

function formatRelativeTime(dateString: string): string {
  try {
    const now = Date.now();
    const date = new Date(dateString).getTime();
    const diffSeconds = Math.max(0, Math.floor((now - date) / 1000));

    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
}

export default function IdeaStreamPage() {
  const [ideas, setIdeas] = useState<IdeaItem[]>(INITIAL_IDEAS);
  const [selectedAudience, setSelectedAudience] = useState<string>("ALL");
  const [selectedTrade, setSelectedTrade] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isInjectOpen, setIsInjectOpen] = useState(false);

  // Claiming lock & loader state to prevent race conditions
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [justClaimedIds, setJustClaimedIds] = useState<Set<string>>(new Set());
  const [draftError, setDraftError] = useState<string | null>(null);

  // Detail Idea Modal State
  const [detailIdea, setDetailIdea] = useState<IdeaItem | null>(null);

  // Edit Idea Modal State
  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editTrade, setEditTrade] = useState<TargetTrade>("HVAC");
  const [editAudience, setEditAudience] = useState<AudienceLane>("ICP");
  const [editStatus, setEditStatus] = useState<IdeaStatus>("HARVESTED");
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Slide-over form state
  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formTrade, setFormTrade] = useState<TargetTrade | "">("");
  const [formAudience, setFormAudience] = useState<AudienceLane>("ICP");
  const [formSource] = useState<IdeaSource>("MANUAL");
  const [formTagsInput, setFormTagsInput] = useState("");
  const [formTags, setFormTags] = useState<string[]>(["Manual"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from API on mount if available
  useEffect(() => {
    async function loadIdeas() {
      try {
        const res = await fetch("/api/ideas");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setIdeas(data);
          }
        }
      } catch {
        // Fallback to initial ideas
      }
    }
    loadIdeas();
  }, []);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const clean = formTagsInput.trim().replace(/^,+|,+$/g, "");
      if (clean && !formTags.includes(clean)) {
        setFormTags([...formTags, clean]);
        setFormTagsInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter(t => t !== tagToRemove));
  };

  const openEditModal = (idea: IdeaItem) => {
    setEditingIdea(idea);
    setEditTitle(idea.title || idea.raw_idea || "");
    setEditExcerpt(idea.excerpt || idea.angle || "");
    setEditTrade((idea.target_trade as TargetTrade) || "HVAC");
    setEditAudience((idea.audience as AudienceLane) || "ICP");
    setEditStatus((idea.status as IdeaStatus) || "HARVESTED");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea || !editTitle.trim() || isUpdating) return;
    setIsUpdating(true);

    const payload = {
      title: editTitle.trim(),
      raw_idea: editTitle.trim(),
      excerpt: editExcerpt.trim(),
      angle: editExcerpt.trim(),
      target_trade: editTrade,
      trade: editTrade,
      audience: editAudience,
      status: editStatus,
    };

    try {
      const res = await fetch(`/api/ideas/${editingIdea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIdeas(prev =>
          prev.map(item =>
            item.id === editingIdea.id
              ? {
                  ...item,
                  title: payload.title,
                  raw_idea: payload.raw_idea,
                  excerpt: payload.excerpt,
                  angle: payload.angle,
                  target_trade: payload.trade,
                  audience: payload.audience,
                  status: payload.status,
                }
              : item
          )
        );
        setToastMessage(`Idea ${editingIdea.id} updated successfully!`);
      }
    } catch (err) {
      console.error("Failed to update idea:", err);
    } finally {
      setIsUpdating(false);
      setEditingIdea(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleDeleteIdea = async (ideaId: string, ideaTitle: string) => {
    if (!confirm(`Are you sure you want to delete idea "${ideaTitle}" (${ideaId})? Any drafted asset will remain safely decoupled.`)) return;

    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIdeas(prev => prev.filter(i => (i.id !== ideaId && i.ideaId !== ideaId)));
        setToastMessage(`Idea ${ideaId} deleted successfully.`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete idea:", err);
    }
  };

  const handleResetClaim = async (ideaId: string) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_claim: true, status: "REFINED" }),
      });

      if (res.ok) {
        setIdeas(prev =>
          prev.map(i =>
            (i.id === ideaId || i.ideaId === ideaId)
              ? { ...i, status: "REFINED" as IdeaStatus }
              : i
          )
        );
        setJustClaimedIds(prev => {
          const next = new Set(prev);
          next.delete(ideaId);
          return next;
        });
        setToastMessage(`Idea ${ideaId} claim released & returned to REFINED status.`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to reset claim:", err);
    }
  };

  const handleInjectManualTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || isSubmitting) return;
    if (!formTrade) {
      setToastMessage("Pick the actual Target Trade before injecting, it does not default to HVAC.");
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setIsSubmitting(true);
    const newTags = formTagsInput.trim()
      ? Array.from(new Set([...formTags, formTagsInput.trim()]))
      : formTags;

    const payload = {
      title: formTitle.trim(),
      raw_idea: formTitle.trim(),
      excerpt: formExcerpt.trim() || "Manual editorial topic injected for automated strategy and drafting pipeline.",
      angle: formExcerpt.trim() || "Manual editorial topic injected for automated strategy and drafting pipeline.",
      trade: formTrade,
      target_trade: formTrade,
      audience: formAudience,
      source: "MANUAL",
      tags: newTags
    };

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created: IdeaItem = await res.json();
        setIdeas(prev => [created, ...prev]);
        setIsInjectOpen(false);
        setFormTitle("");
        setFormExcerpt("");
        setFormTrade("");
        setFormTags(["Manual"]);
        setFormTagsInput("");
        setToastMessage(`Idea ${created.id} injected into the live stream.`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        const errBody = await res.json().catch(() => ({}));
        setToastMessage(`Failed to inject idea: ${errBody.error || res.statusText}`);
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err) {
      setToastMessage(`Failed to inject idea: ${err instanceof Error ? err.message : "network error"}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefineAndDraft = async (ideaId: string) => {
    // Immediately lock button to prevent double-click / claim race conditions
    setClaimingIds(prev => new Set(prev).add(ideaId));
    setDraftError(null);

    const idea = ideas.find(item => item.id === ideaId || item.ideaId === ideaId);

    try {
      const res = await fetch("/api/pipeline/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea_id: idea?.ideaId || idea?.id || ideaId,
          title: idea?.title || idea?.raw_idea,
          audience: idea?.audience,
          target_trade: idea?.target_trade
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || `Request failed (HTTP ${res.status})`);
      }

      setIdeas(prev =>
        prev.map(item =>
          item.id === ideaId || item.ideaId === ideaId
            ? { ...item, status: "CLAIMED" as IdeaStatus }
            : item
        )
      );
      setJustClaimedIds(prev => new Set(prev).add(ideaId));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not reach the drafting pipeline.";
      setDraftError(message);
    } finally {
      setClaimingIds(prev => {
        const next = new Set(prev);
        next.delete(ideaId);
        return next;
      });
    }
  };

  // Filtered Ideas calculation
  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      // Audience filter
      if (selectedAudience !== "ALL" && idea.audience !== selectedAudience) return false;

      // Trade filter
      if (selectedTrade !== "ALL") {
        const t = (idea.target_trade || "").toLowerCase();
        if (!t.includes(selectedTrade.toLowerCase())) return false;
      }

      // Status filter
      if (selectedStatus !== "ALL") {
        const st = (idea.status || "").toUpperCase();
        if (st !== selectedStatus) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (idea.title || idea.raw_idea || "").toLowerCase().includes(q);
        const excerptMatch = (idea.excerpt || idea.angle || "").toLowerCase().includes(q);
        const idMatch = (idea.ideaId || idea.id || "").toLowerCase().includes(q);
        const tagMatch = idea.tags?.some(tag => tag.toLowerCase().includes(q)) ?? false;
        if (!titleMatch && !excerptMatch && !idMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [ideas, selectedAudience, selectedTrade, selectedStatus, searchQuery]);

  // Audience Badge Styling Helper
  const getAudienceBadgeClass = (aud: AudienceLane) => {
    switch (aud) {
      case "ICP":
        return "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30";
      case "PEER":
        return "bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30";
      case "BRIDGE":
        return "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30";
      default:
        return "bg-[#161D26] text-[#94A3B8] border-[#1F2D3D]";
    }
  };

  // Source Tag Styling Helper
  const getSourceTag = (source: string) => {
    const s = source.toUpperCase();
    if (s.includes("GOOGLE_TRENDS")) {
      return {
        label: "GOOGLE_TRENDS",
        className: "bg-[#00C9A7]/15 text-[#00C9A7] border-[#00C9A7]/30"
      };
    }
    if (s.includes("REDDIT")) {
      return {
        label: "REDDIT",
        className: "bg-[#F97316]/15 text-[#F97316] border-[#F97316]/30"
      };
    }
    if (s.includes("HACKER_NEWS")) {
      return {
        label: "HACKER_NEWS",
        className: "bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/30"
      };
    }
    return {
      label: "MANUAL",
      className: "bg-[#1E2733] text-[#94A3B8] border-[#2A3D52]"
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 selection:bg-[#00C9A7]/30 selection:text-[#00C9A7]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2D3D] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-widest text-[#00C9A7] uppercase px-2.5 py-0.5 rounded-full bg-[#00C9A7]/10 border border-[#00C9A7]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] animate-pulse" />
              Workflow 01 · Signal Harvester
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F1F5F9]">
            Idea Stream
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 max-w-2xl">
            Continuous intake stream of high-intent content opportunities harvested from search trends, technician forums, and operator telemetry.
          </p>
        </div>

        <button
          onClick={() => setIsInjectOpen(true)}
          className="inline-flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/15 transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Inject Manual Topic
        </button>
      </div>

      {/* Filter Bar (Sticky Container with full-bleed backdrop & zero desktop gap) */}
      <div className="sticky top-14 md:top-0 z-30 bg-[#0a0d12] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pt-3 pb-3.5 space-y-3 border-b border-[#1F2D3D] shadow-xl shadow-black/40">
        {/* Row 1: Search & Audience Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ideas by title, keyword, ID, or trade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F1419] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl pl-9 pr-8 py-2 text-xs text-[#F1F5F9] placeholder:text-[#64748B] outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F1F5F9] text-xs p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Audience Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] mr-1 shrink-0">
                Audience:
              </span>
              <button
                onClick={() => setSelectedAudience("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  selectedAudience === "ALL"
                    ? "bg-[#00C9A7]/15 text-[#00C9A7] border-[#00C9A7]/40 shadow-sm"
                    : "bg-[#0F1419] text-[#94A3B8] border-[#1F2D3D] hover:text-[#F1F5F9] hover:border-[#2A3D52]"
                }`}
              >
                All
              </button>
              {AUDIENCES.map((aud) => {
                const isActive = selectedAudience === aud;
                let activeStyle = "bg-[#00C9A7]/15 text-[#00C9A7] border-[#00C9A7]/40";
                if (aud === "ICP") activeStyle = "bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/50 shadow-sm";
                if (aud === "PEER") activeStyle = "bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/50 shadow-sm";
                if (aud === "BRIDGE") activeStyle = "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50 shadow-sm";

                return (
                  <button
                    key={aud}
                    onClick={() => setSelectedAudience(aud)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isActive
                        ? activeStyle
                        : "bg-[#0F1419] text-[#94A3B8] border-[#1F2D3D] hover:text-[#F1F5F9] hover:border-[#2A3D52]"
                    }`}
                  >
                    {aud}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Scrolling Trades Pill Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-[#1F2D3D]/40">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] mr-1 shrink-0">
              Trade:
            </span>
            <button
              onClick={() => setSelectedTrade("ALL")}
              className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                selectedTrade === "ALL"
                  ? "bg-[#00C9A7]/15 text-[#00C9A7] border-[#00C9A7]/40 font-bold"
                  : "bg-[#0F1419] text-[#94A3B8] border-[#1F2D3D] hover:text-[#F1F5F9] hover:border-[#2A3D52]"
              }`}
            >
              All Trades
            </button>
            {TRADES.map((trade) => {
              const isSelected = selectedTrade === trade;
              return (
                <button
                  key={trade}
                  onClick={() => setSelectedTrade(trade)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#00C9A7]/15 text-[#00C9A7] border-[#00C9A7]/40 font-bold"
                      : "bg-[#0F1419] text-[#94A3B8] border-[#1F2D3D] hover:text-[#F1F5F9] hover:border-[#2A3D52]"
                  }`}
                >
                  {trade}
                </button>
              );
            })}
          </div>

          {/* Row 3: Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 border-t border-[#1F2D3D]/40">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] mr-1 shrink-0">
              Status:
            </span>
            {STATUS_FILTERS.map((st) => {
              const isSelected = selectedStatus === st;
              const count = st === "ALL" 
                ? ideas.length 
                : ideas.filter(i => (i.status || "").toUpperCase() === st).length;

              return (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-[#161D26] text-[#F1F5F9] border border-[#00C9A7]/60 shadow-sm"
                      : "bg-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#0F1419]"
                  }`}
                >
                  <span className="capitalize">{st.toLowerCase()}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isSelected ? "bg-[#00C9A7]/20 text-[#00C9A7]" : "bg-[#161D26] text-[#64748B]"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drafting Pipeline Error */}
        {draftError && (
          <div className="bg-[#2A1215] border border-[#7F1D1D] rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#F87171] mt-0.5 shrink-0" />
            <div className="flex-1 text-xs text-[#FCA5A5]">
              <span className="font-semibold">Could not start drafting: </span>
              {draftError}
            </div>
            <button
              onClick={() => setDraftError(null)}
              className="text-[#FCA5A5] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredIdeas.length === 0 && (
          <div className="bg-[#0F1419] border border-[#1F2D3D] rounded-2xl p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#64748B] mx-auto" />
            <h3 className="text-base font-bold text-[#F1F5F9]">No ideas found matching filters</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              Try adjusting your Audience, Trade, or Status filters, or inject a new manual editorial signal.
            </p>
            <button
              onClick={() => {
                setSelectedAudience("ALL");
                setSelectedTrade("ALL");
                setSelectedStatus("ALL");
                setSearchQuery("");
              }}
              className="mt-2 text-xs font-semibold text-[#00C9A7] hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Card Grid (2 Columns on Desktop, 1 on Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredIdeas.map((idea) => {
            const rawId = idea.ideaId || idea.id || "IDEA-0000";
            const ideaTitle = idea.title || idea.raw_idea || "Untitled Signal";
            const ideaExcerpt = idea.excerpt || idea.angle || "No excerpt or angle notes available.";
            const ideaAudience = idea.audience || "ICP";
            const ideaTrade = idea.target_trade || "HVAC";
            const ideaSource = idea.source || "MANUAL";
            const ideaStatus = (idea.status || "HARVESTED").toUpperCase();
            const sourceInfo = getSourceTag(ideaSource);
            const isClaiming = claimingIds.has(idea.id) || claimingIds.has(rawId);
            const isClaimed = ideaStatus === "CLAIMED" || justClaimedIds.has(idea.id) || justClaimedIds.has(rawId);
            const isDrafted = ideaStatus === "DRAFTED";
            const isPublished = ideaStatus === "PUBLISHED";
            const isRejected = ideaStatus === "REJECTED";

            return (
              <div
                key={idea.id || rawId}
                onClick={() => setDetailIdea(idea)}
                className="bg-[#0F1419] hover:bg-[#161D26] border border-[#1F2D3D] hover:border-[#00C9A7]/50 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between space-y-4 group shadow-sm relative overflow-hidden cursor-pointer active:scale-[0.99]"
              >
                {/* Hover Glow Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C9A7]/5 blur-2xl pointer-events-none group-hover:bg-[#00C9A7]/10 transition-colors" />

                {/* Top Badge Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* Left: Audience Badge + Trade Tag + Source Tag */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Audience Badge (Always top-left) */}
                      <span
                        className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${getAudienceBadgeClass(
                          ideaAudience
                        )}`}
                      >
                        {ideaAudience}
                      </span>

                      {/* Trade Tag (Gray Pill) */}
                      <span className="text-[10px] font-medium bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D] px-2 py-0.5 rounded-full">
                        {ideaTrade}
                      </span>

                      {/* Source Tag (Color Coded) */}
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${sourceInfo.className}`}
                      >
                        {sourceInfo.label}
                      </span>
                    </div>

                    {/* Right: Idea ID & Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-mono text-[#64748B] font-medium mr-1">
                        {rawId}
                      </span>

                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(idea);
                        }}
                        className="p-1 rounded-md text-[#64748B] hover:text-[#00C9A7] hover:bg-[#161D26] border border-transparent hover:border-[#1F2D3D] transition-all cursor-pointer"
                        title="Edit Idea details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Unlock Button (if claimed) */}
                      {isClaimed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetClaim(idea.id || rawId);
                          }}
                          className="p-1 rounded-md text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 transition-all cursor-pointer"
                          title="Release Lock & Unclaim Idea"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteIdea(idea.id || rawId, ideaTitle);
                        }}
                        className="p-1 rounded-md text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 border border-transparent hover:border-[#EF4444]/30 transition-all cursor-pointer"
                        title="Delete Idea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title (Bold 16px, 2-line clamp) */}
                  <h3 className="text-[16px] font-bold leading-snug text-[#F1F5F9] line-clamp-2 group-hover:text-white transition-colors">
                    {ideaTitle}
                  </h3>

                  {/* Excerpt (Muted 13px, 3-line clamp) */}
                  <p className="text-[13px] text-[#94A3B8] leading-relaxed line-clamp-3">
                    {ideaExcerpt}
                  </p>

                  {/* Optional Tags */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {idea.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-[#64748B] bg-[#070B0F] border border-[#1F2D3D] px-2 py-0.2 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Ingested Date & CTA Button */}
                <div className="flex items-center justify-between pt-3.5 border-t border-[#1F2D3D] gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#64748B]">
                    <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Ingested {formatRelativeTime(idea.created_at)}</span>
                  </div>

                  {/* Bottom Right: Action CTA / Status Badge */}
                  <div onClick={(e) => e.stopPropagation()}>
                    {isPublished ? (
                      <Link
                        href="/published"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00C9A7] bg-[#00C9A7]/10 border border-[#00C9A7]/30 px-3 py-1.5 rounded-lg hover:bg-[#00C9A7]/20 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Published ↗
                      </Link>
                    ) : isDrafted ? (
                      <Link
                        href="/editorial"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/30 px-3 py-1.5 rounded-lg hover:bg-[#3B82F6]/20 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Draft Ready →
                      </Link>
                    ) : isClaimed ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1.5 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                        CLAIMED (Drafting...)
                      </div>
                    ) : isRejected ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] bg-[#161D26] border border-[#1F2D3D] px-2.5 py-1.5 rounded-lg">
                        Rejected
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRefineAndDraft(idea.id || rawId)}
                        disabled={isClaiming}
                        className="inline-flex items-center gap-1.5 bg-[#00C9A7]/10 hover:bg-[#00C9A7] text-[#00C9A7] hover:text-[#070B0F] border border-[#00C9A7]/30 hover:border-[#00C9A7] text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <span>Refine & Draft</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      {/* Slide-over / Modal for "+ Inject Manual Topic" */}
      {isInjectOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => !isSubmitting && setIsInjectOpen(false)}
          />

          {/* Slide-over Drawer */}
          <div className="relative w-full max-w-lg bg-[#0F1419] border-l border-[#1F2D3D] h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between p-6 border-b border-[#1F2D3D]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.5 rounded border border-[#00C9A7]/20">
                      Manual Ingestion
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#F1F5F9]">
                    Inject Manual Topic
                  </h2>
                </div>
                <button
                  onClick={() => setIsInjectOpen(false)}
                  disabled={isSubmitting}
                  className="text-[#94A3B8] hover:text-[#F1F5F9] p-2 rounded-lg hover:bg-[#161D26] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form id="inject-topic-form" onSubmit={handleInjectManualTopic} className="p-6 space-y-5">
                {/* Field: Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#F1F5F9] mb-1.5">
                    Topic Title / Raw Signal <span className="text-[#00C9A7]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Attic Thermal Saturation: Why 2.5-Hour Callback Redos Drain HVAC Margins"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl px-3.5 py-2.5 text-xs text-[#F1F5F9] placeholder:text-[#64748B] outline-none transition-all font-medium"
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Clear, punchy headline focused on trade mechanics or operational friction.
                  </p>
                </div>

                {/* Field: Trade */}
                <div>
                  <label className="block text-xs font-semibold text-[#F1F5F9] mb-1.5">
                    Target Trade <span className="text-[#00C9A7]">*</span>
                  </label>
                  <select
                    required
                    value={formTrade}
                    onChange={(e) => {
                      const t = e.target.value as TargetTrade;
                      setFormTrade(t);
                      if (!formTags.includes(t)) {
                        setFormTags([...formTags.filter(x => !TRADES.includes(x as TargetTrade)), t]);
                      }
                    }}
                    className="w-full bg-[#161D26] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl px-3.5 py-2.5 text-xs text-[#F1F5F9] outline-none transition-all cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#0F1419]">
                      Select the actual trade this topic is about...
                    </option>
                    {TRADES.map((t) => (
                      <option key={t} value={t} className="bg-[#0F1419]">
                        {t}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    This drives the asset's trade label end to end. It does not default to HVAC, pick the one that actually matches the topic.
                  </p>
                </div>

                {/* Field: Audience */}
                <div>
                  <label className="block text-xs font-semibold text-[#F1F5F9] mb-1.5">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {AUDIENCES.map((aud) => {
                      const isSelected = formAudience === aud;
                      let badge = "ICP (Contractors)";
                      if (aud === "PEER") badge = "PEER (Architects)";
                      if (aud === "BRIDGE") badge = "BRIDGE (Cross-Tech)";

                      return (
                        <button
                          type="button"
                          key={aud}
                          onClick={() => setFormAudience(aud)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? getAudienceBadgeClass(aud) + " font-bold shadow-sm ring-1 ring-[#00C9A7]/30"
                              : "bg-[#161D26] text-[#94A3B8] border-[#1F2D3D] hover:border-[#2A3D52]"
                          }`}
                        >
                          <div className="text-xs font-bold">{aud}</div>
                          <div className="text-[10px] opacity-80">{badge}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Field: Source (MANUAL) */}
                <div>
                  <label className="block text-xs font-semibold text-[#F1F5F9] mb-1.5">
                    Source
                  </label>
                  <div className="flex items-center gap-2 bg-[#161D26] border border-[#1F2D3D] rounded-xl px-3.5 py-2 text-xs text-[#94A3B8]">
                    <span className="w-2 h-2 rounded-full bg-[#64748B]" />
                    <span className="font-mono font-bold text-[#F1F5F9]">MANUAL</span>
                    <span className="text-[11px] text-[#64748B]">— Operator manual signal injection</span>
                  </div>
                </div>

                {/* Field: Excerpt / Angle */}
                <div>
                  <label className="block text-xs font-semibold text-[#F1F5F9] mb-1.5">
                    Strategic Excerpt / Angle Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the unit economics, the operational failure mode, or the contrarian thesis for the Strategist agent..."
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    className="w-full bg-[#161D26] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl p-3.5 text-xs text-[#F1F5F9] placeholder:text-[#64748B] outline-none transition-all resize-none"
                  />
                </div>

                {/* Field: Tags */}
                <div>
                  <label className="block text-xs font-semibold text-[#F1F5F9] mb-1.5">
                    Tags
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 p-2 bg-[#161D26] border border-[#1F2D3D] rounded-xl min-h-[42px] items-center">
                      {formTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[11px] bg-[#070B0F] border border-[#1F2D3D] text-[#F1F5F9] px-2 py-0.5 rounded-md"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-[#64748B] hover:text-[#EF4444]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Type tag & press Enter..."
                        value={formTagsInput}
                        onChange={(e) => setFormTagsInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="bg-transparent text-xs text-[#F1F5F9] placeholder:text-[#64748B] outline-none flex-1 min-w-[120px] px-1 py-0.5"
                      />
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Press comma or Enter to add tags.
                    </p>
                  </div>
                </div>
              </form>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-[#1F2D3D] bg-[#070B0F]/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsInjectOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="inject-topic-form"
                disabled={isSubmitting || !formTitle.trim() || !formTrade}
                className="inline-flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] disabled:opacity-50 text-[#070B0F] text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/15 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Injecting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    Inject into Active Stream
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. EDIT IDEA SLIDE-OVER DRAWER / MODAL ── */}
      {editingIdea && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-[#0F1419] border-l border-[#1F2D3D] h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer Header */}
            <div>
              <div className="p-6 border-b border-[#1F2D3D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#00C9A7]" />
                  <div>
                    <h2 className="text-base font-bold text-[#F1F5F9]">
                      Edit Strategy & Signal
                    </h2>
                    <p className="text-xs text-[#64748B] font-mono">
                      {editingIdea.id || editingIdea.ideaId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingIdea(null)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Edit Form */}
              <form id="edit-idea-form" onSubmit={handleSaveEdit} className="p-6 space-y-5">
                {/* Title / Signal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1.5">
                    <span>Topic Title / Core Signal</span>
                    <span className="text-[#00C9A7]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#070B0F] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl px-3.5 py-2.5 text-xs text-[#F1F5F9] outline-none transition-colors"
                  />
                </div>

                {/* Excerpt / Angle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8]">
                    Strategic Angle & Key Realities
                  </label>
                  <textarea
                    rows={4}
                    value={editExcerpt}
                    onChange={(e) => setEditExcerpt(e.target.value)}
                    className="w-full bg-[#070B0F] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl px-3.5 py-2.5 text-xs text-[#F1F5F9] outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Target Trade & Audience Lane */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8]">
                      Target Trade
                    </label>
                    <select
                      value={editTrade}
                      onChange={(e) => setEditTrade(e.target.value as TargetTrade)}
                      className="w-full bg-[#070B0F] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl px-3 py-2.5 text-xs text-[#F1F5F9] outline-none transition-colors cursor-pointer"
                    >
                      {TRADES.map((t) => (
                        <option key={t} value={t} className="bg-[#0F1419] text-[#F1F5F9]">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8]">
                      Audience Lane
                    </label>
                    <select
                      value={editAudience}
                      onChange={(e) => setEditAudience(e.target.value as AudienceLane)}
                      className="w-full bg-[#070B0F] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl px-3 py-2.5 text-xs text-[#F1F5F9] outline-none transition-colors cursor-pointer"
                    >
                      {AUDIENCES.map((a) => (
                        <option key={a} value={a} className="bg-[#0F1419] text-[#F1F5F9]">
                          {a} ({a === "ICP" ? "Contractor" : a === "PEER" ? "Engineer" : "Bridge"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8]">
                    Pipeline Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as IdeaStatus)}
                    className="w-full bg-[#070B0F] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl px-3 py-2.5 text-xs text-[#F1F5F9] outline-none transition-colors cursor-pointer"
                  >
                    <option value="HARVESTED" className="bg-[#0F1419]">HARVESTED (Ready)</option>
                    <option value="REFINED" className="bg-[#0F1419]">REFINED (Ready for Writer)</option>
                    <option value="CLAIMED" className="bg-[#0F1419]">CLAIMED (Locked)</option>
                    <option value="DRAFTED" className="bg-[#0F1419]">DRAFTED (Asset Generated)</option>
                    <option value="PUBLISHED" className="bg-[#0F1419]">PUBLISHED (Live)</option>
                    <option value="REJECTED" className="bg-[#0F1419]">REJECTED (Archived)</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Edit Drawer Footer */}
            <div className="p-6 border-t border-[#1F2D3D] bg-[#070B0F]/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDeleteIdea(editingIdea.id || editingIdea.ideaId || "", editTitle)}
                className="px-3 py-2 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161D26] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-idea-form"
                  disabled={isUpdating || !editTitle.trim()}
                  className="inline-flex items-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] disabled:opacity-50 text-[#070B0F] text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/15 transition-all cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IDEA DETAIL MODAL & DRAWER */}
      {detailIdea && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F1419] border border-[#1F2D3D] ring-1 ring-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1F2D3D] flex items-start justify-between gap-4 bg-[#070B0F]/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${getAudienceBadgeClass(detailIdea.audience || "ICP")}`}>
                    {detailIdea.audience || "ICP"}
                  </span>
                  <span className="text-[10px] font-medium bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D] px-2.5 py-0.5 rounded-full">
                    {detailIdea.target_trade || "HVAC"}
                  </span>
                  <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${getSourceTag(detailIdea.source || "MANUAL").className}`}>
                    {getSourceTag(detailIdea.source || "MANUAL").label}
                  </span>
                  <span className="text-xs font-mono text-[#64748B]">
                    {detailIdea.ideaId || detailIdea.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748B] font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Harvested {new Date(detailIdea.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              <button
                onClick={() => setDetailIdea(null)}
                className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#161D26] border border-transparent hover:border-[#1F2D3D] transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#F1F5F9]">
              {/* Full Topic Headline */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00C9A7]">
                  Topic & Working Headline
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold leading-snug text-white">
                  {detailIdea.title || detailIdea.raw_idea}
                </h2>
              </div>

              {/* Full Strategic Angle / Rationale */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                  Strategic Angle & Real-World Thesis
                </div>
                <div className="p-4 rounded-xl bg-[#070B0F] border border-[#1F2D3D] text-sm text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                  {detailIdea.excerpt || detailIdea.angle || "No extended strategic thesis recorded."}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[#161D26]/60 border border-[#1F2D3D] space-y-1">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase">Audience Objective</div>
                  <div className="text-xs font-semibold text-white">
                    {detailIdea.audience === "ICP" 
                      ? "Direct to Home Service Operators (Contractors)"
                      : detailIdea.audience === "PEER"
                      ? "Technical & Systems Architecture Peers"
                      : "Bridge / Strategic Market Investors"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161D26]/60 border border-[#1F2D3D] space-y-1">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase">Pipeline Status</div>
                  <div className="text-xs font-semibold text-[#00C9A7] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse" />
                    <span>{detailIdea.status || "HARVESTED"}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {detailIdea.tags && detailIdea.tags.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase">Signal Keywords</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {detailIdea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-[#94A3B8] bg-[#070B0F] border border-[#1F2D3D] px-2.5 py-1 rounded-lg font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="p-4 sm:p-6 border-t border-[#1F2D3D] bg-[#070B0F]/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ideaToEdit = detailIdea;
                    setDetailIdea(null);
                    openEditModal(ideaToEdit);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-[#94A3B8] hover:text-white bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Signal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = detailIdea.id || detailIdea.ideaId || "";
                    const titleToDelete = detailIdea.title || detailIdea.raw_idea || "";
                    setDetailIdea(null);
                    handleDeleteIdea(idToDelete, titleToDelete);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 border border-transparent hover:border-[#EF4444]/30 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {detailIdea.status === "PUBLISHED" ? (
                  <Link
                    href="/published"
                    onClick={() => setDetailIdea(null)}
                    className="inline-flex items-center justify-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/15 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>View in Published Stream ↗</span>
                  </Link>
                ) : detailIdea.status === "DRAFTED" ? (
                  <Link
                    href="/editorial"
                    onClick={() => setDetailIdea(null)}
                    className="inline-flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#3B82F6]/20 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Open in Editorial Studio →</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      const idToDraft = detailIdea.id || detailIdea.ideaId || "";
                      setDetailIdea(null);
                      handleRefineAndDraft(idToDraft);
                    }}
                    disabled={claimingIds.has(detailIdea.id) || claimingIds.has(detailIdea.ideaId || "")}
                    className="inline-flex items-center justify-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] disabled:opacity-50 text-[#070B0F] text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#00C9A7]/15 transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Refine & Launch Draft Pipeline (Workflow 02)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00C9A7] text-[#070B0F] px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

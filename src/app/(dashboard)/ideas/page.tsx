"use client";

import {
  useState,
  useMemo,
  useEffect,
} from "react";
import {
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Loader2,
  X,
  Layers,
  AlertCircle,
  Edit3,
  Trash2,
  Check,
  LayoutGrid,
  SlidersHorizontal,
} from "lucide-react";
import { IdeaItem, IdeaStatus } from "@/types";
import ScheduleModal from "@/components/ideas/ScheduleModal";
import QueueBuilderView from "@/components/ideas/QueueBuilderView";
import DraftingProgressHUD, { DraftingJob } from "@/components/common/DraftingProgressHUD";
import HarvestingProgressHUD, { HarvestingJob } from "@/components/common/HarvestingProgressHUD";
import ConfirmModal from "@/components/ui/ConfirmModal";
import IdeaCard from "@/components/ideas/IdeaCard";
import IdeaDetailModal from "@/components/ideas/IdeaDetailModal";
import EmptyState, { LoadingState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api-client";
import { useApiResource } from "@/hooks/useApiResource";

import {
} from "@/constants/ideaBadges";
import {
  IDEA_STAGES,
  IDEA_STAGE_LABELS,
  IDEA_STAGE_HINTS,
  toIdeaStage,
  type IdeaStage,
} from "@/constants/ideaStage";

import { formatPostTime } from "@/lib/postTime";
import { buttonStyles } from "@/components/ui/Button";
import { segment } from "@/components/ui/segment";
/**
 * Topics are per-tenant now, loaded from /api/ideas/topics. The old hardcoded
 * HVAC / Plumbing / Electrical / Roofing / Pest Control list came from the
 * original home-services product and was shown to every tenant regardless of
 * industry, so an AI consultancy was asked to file its ideas under "Roofing".
 */


/**
 * Filter on the STAGE an idea is in, not its raw status string.
 *
 * These chips used to be the literal statuses HARVESTED / QUEUED / CLAIMED /
 * DRAFTED / PUBLISHED / REJECTED, compared with `===` against `idea.status`.
 * The pipeline only ever writes REFINED, REVIEW, PICKED and QUEUED, so five of
 * the six chips always read 0 and an idea in REFINED matched nothing at all --
 * present in the database, invisible in the UI, which reads as "my idea was
 * deleted". `toIdeaStage` maps every status the pipeline writes onto a stage.
 */
const STAGE_FILTERS: Array<"ALL" | IdeaStage> = ["ALL", ...IDEA_STAGES];

interface DraftingStatus {
  drafting_on: boolean;
  timezone: string;
  next_slot_at: string | null;
}

export default function IdeaStreamPage() {
  const {
    data: ideas,
    isLoading: ideasLoading,
    error: ideasError,
    reload: reloadIdeas,
    setData: setIdeas,
  } = useApiResource<IdeaItem[]>("/api/ideas", [], { errorMessage: "Could not load ideas" });
  const { data: draftingStatus } = useApiResource<DraftingStatus | null>(
    "/api/plan/status",
    null,
    { errorMessage: "Could not load drafting status" }
  );

  const [selectedStage, setSelectedStage] = useState<"ALL" | IdeaStage>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isInjectOpen, setIsInjectOpen] = useState(false);

  // Claiming lock & loader state to prevent race conditions
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [justClaimedIds, setJustClaimedIds] = useState<Set<string>>(new Set());
  const [draftError, setDraftError] = useState<string | null>(null);
  const [queueingIds, setQueueingIds] = useState<Set<string>>(new Set());

  // Live Drafting Multi-Agent Progress HUD state
  const [activeDraftingJob, setActiveDraftingJob] = useState<DraftingJob | null>(null);
  const [activeHarvestJob, setActiveHarvestJob] = useState<HarvestingJob | null>(null);
  const [isFirstRun, setIsFirstRun] = useState(false);

  // View mode: Stream cards vs Drag & Drop Queue Builder vs Editorial Calendar
  const [viewMode, setViewMode] = useState<"stream" | "queue">("queue");

  // Scheduling Modal State
  const [schedulingIdea, setSchedulingIdea] = useState<IdeaItem | null>(null);

  // Detail Idea Modal State
  const [detailIdea, setDetailIdea] = useState<IdeaItem | null>(null);

  // Edit Idea Modal State
  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editStatus, setEditStatus] = useState<IdeaStatus>("REFINED");
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Onboarding owns the first harvest, then hands its concrete run id to this
  // screen. That lets a new user see real work in progress rather than a
  // generic dashboard and a promise that something might happen later.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const runId = params.get("onboarding_run");
    if (!runId) return;

    const startFirstRun = window.setTimeout(() => {
      setIsFirstRun(true);
      setViewMode("stream");
      setActiveHarvestJob({ runId, startedAt: Date.now() });
    }, 0);
    window.history.replaceState({}, document.title, window.location.pathname);
    return () => window.clearTimeout(startFirstRun);
  }, []);

  useEffect(() => {
    if (!activeHarvestJob) return;

    const pollRun = async () => {
      try {
        const response = await fetch(`/api/pipeline/runs/${activeHarvestJob.runId}`);
        if (!response.ok) return;
        const run = (await response.json()) as { status?: string };
        // FAILED has to clear the job too. While it did not, a run that died
        // left the HUD spinning forever with no way to tell it apart from a
        // slow one -- and every DRAFT run in production was stuck RUNNING.
        if (run.status === "COMPLETED" || run.status === "FAILED") {
          await reloadIdeas();
          setActiveHarvestJob(null);
          if (run.status === "FAILED") {
            setToastMessage("We couldn’t find new ideas this time. Please try again.");
          }
        }
      } catch {
        // The HUD remains visible and keeps polling; a transient request
        // failure should never make the user think their first run vanished.
      }
    };

    const interval = window.setInterval(pollRun, 3500);
    return () => window.clearInterval(interval);
  }, [activeHarvestJob, reloadIdeas]);

  /**
   * Refresh the stream while any run is in flight, and once more shortly after
   * it clears.
   *
   * Ideas and assets are written by n8n straight into the database, so this page
   * has no way to learn about them except by asking again. Without this the user
   * had to reload the browser to see work that had already finished, which made
   * a working pipeline look broken.
   */
  useEffect(() => {
    if (!activeHarvestJob && !activeDraftingJob) return;
    const interval = window.setInterval(() => {
      void reloadIdeas();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [activeHarvestJob, activeDraftingJob, reloadIdeas]);

  /**
   * Pick up work finished in another tab, by the scheduler, or while this tab
   * was in the background. Refetching only on focus keeps this close to free
   * compared with polling a page nobody is looking at.
   */
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") void reloadIdeas();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [reloadIdeas]);

  // Slide-over form state
  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formSourceUrl, setFormSourceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Adds an idea to the production queue at the next free position. */
  const handleQueueIdea = async (idea: IdeaItem) => {
    const targetId = idea.id || idea.ideaId;
    const nextOrder = ideas.filter((i) => i.status === "QUEUED").length + 1;
    setQueueingIds((prev) => new Set(prev).add(targetId));
    try {
      await apiClient.patch(`/api/ideas/${targetId}`, {
        status: "QUEUED",
        queue_order: nextOrder,
      });
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === targetId ? { ...i, status: "QUEUED", queue_order: nextOrder } : i
        )
      );
      setToastMessage(`Added to Up next (#${nextOrder})`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage("Could not add to Up next");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setQueueingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  /** Removes an idea from the production queue, back to HARVESTED. */
  const handleUnqueueIdea = async (idea: IdeaItem) => {
    const targetId = idea.id || idea.ideaId;
    setQueueingIds((prev) => new Set(prev).add(targetId));
    try {
      await apiClient.patch(`/api/ideas/${targetId}`, {
        status: "HARVESTED",
        queue_order: null,
      });
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === targetId ? { ...i, status: "HARVESTED", queue_order: null } : i
        )
      );
      setToastMessage("Removed from Up next");
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage("Could not remove from Up next");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setQueueingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const openEditModal = (idea: IdeaItem) => {
    setEditingIdea(idea);
    setEditTitle(idea.title || idea.raw_idea || "");
    setEditExcerpt(idea.excerpt || idea.angle || "");
    setEditStatus((idea.status as IdeaStatus) || "REFINED");
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

  // Delete modal state
  const [deleteIdeaTarget, setDeleteIdeaTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingIdea, setIsDeletingIdea] = useState(false);

  const handleConfirmDeleteIdea = async () => {
    if (!deleteIdeaTarget) return;
    setIsDeletingIdea(true);
    try {
      const res = await fetch(`/api/ideas/${deleteIdeaTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIdeas(prev => prev.filter(i => (i.id !== deleteIdeaTarget.id && i.ideaId !== deleteIdeaTarget.id)));
        setToastMessage(`Idea ${deleteIdeaTarget.id} deleted successfully.`);
        setTimeout(() => setToastMessage(null), 3000);
        if (editingIdea?.id === deleteIdeaTarget.id || editingIdea?.ideaId === deleteIdeaTarget.id) {
          setEditingIdea(null);
        }
        if (detailIdea?.id === deleteIdeaTarget.id || detailIdea?.ideaId === deleteIdeaTarget.id) {
          setDetailIdea(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete idea:", err);
    } finally {
      setIsDeletingIdea(false);
      setDeleteIdeaTarget(null);
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
    setIsSubmitting(true);
    const payload = {
      title: formTitle.trim(),
      raw_idea: formTitle.trim(),
      excerpt: formExcerpt.trim() || "An idea added by your team.",
      angle: formExcerpt.trim() || "An idea added by your team.",
      // One ICP per tenant; PEER/BRIDGE were retired on 2026-09-23.
      audience: "ICP",
      source: formSourceUrl.trim() ? "MANUAL_REFERENCE" : "MANUAL",
      source_url: formSourceUrl.trim() || null,
      source_title: null,
      signals: formSourceUrl.trim() ? [
        {
          title: formTitle.trim(),
          url: formSourceUrl.trim(),
          source: "Manual Reference",
          snippet: formExcerpt.trim() || formTitle.trim(),
          published_at: new Date().toISOString(),
        }
      ] : [],
      tags: ["Manual"]
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
        setFormSourceUrl("");
        setToastMessage(`Idea added to your stream.`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        const errBody = await res.json().catch(() => ({}));
        setToastMessage(`Could not add idea: ${errBody.error || res.statusText}`);
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err) {
      setToastMessage(`Could not add idea: ${err instanceof Error ? err.message : "network error"}`);
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
    const startedAt = Date.now();

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
        throw new Error(data.error || data.message || `Request failed (HTTP ${res.status})`);
      }

      // Launch Live Multi-Agent Drafting HUD
      setActiveDraftingJob({
        ideaId: idea?.ideaId || idea?.id || ideaId,
        title: idea?.title || idea?.raw_idea || "Untitled Strategic Topic",
        audience: idea?.audience,
        targetTrade: idea?.target_trade,
        startedAt,
        runId: data.run_id
      });

      setIdeas(prev =>
        prev.map(item =>
          item.id === ideaId || item.ideaId === ideaId
            ? { ...item, status: "CLAIMED" as IdeaStatus }
            : item
        )
      );
      setJustClaimedIds(prev => new Set(prev).add(ideaId));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not start your draft.";
      setDraftError(message);
      setActiveDraftingJob(null);
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
      // Stage filter -- compare mapped stages, never raw status strings.
      if (selectedStage !== "ALL" && toIdeaStage(idea.status) !== selectedStage) return false;

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
  }, [ideas, selectedStage, searchQuery]);

  const queuedIdeas = ideas
    .filter((idea) => idea.status === "QUEUED")
    .sort((a, b) => (a.queue_order ?? 999) - (b.queue_order ?? 999));
  const nextQueuedIdea = queuedIdeas[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 selection:bg-brand/30 selection:text-brand">
      {/* Page Header - Clean, Executive & Compact */}
      {isFirstRun && (
        <section className="relative overflow-hidden rounded-2xl border border-brand/35 bg-brand/[0.07] px-5 py-4 shadow-lg shadow-brand/5">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-brand/10 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-brand/15">
              <Sparkles className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Your first ideas are being prepared</p>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
                Minions is using your Brand Brief to find relevant angles. When they arrive, choose the one you want turned into your first draft.
              </p>
            </div>
          </div>
        </section>
      )}
      <section className="relative overflow-hidden rounded-[1.75rem] border-2 border-b-4 border-brand/35 border-b-brand-edge/70 bg-[linear-gradient(135deg,#0F1C1D_0%,#10171D_62%,#0E1419_100%)] p-5 sm:p-7">
        <span className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-brand">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Ideas
            </p>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
              Choose what gets written next
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Add a promising idea to Up next. Minions turns the first one into a draft automatically.
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-brand/25 bg-canvas/45 p-3 sm:min-w-[280px]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-lg font-black text-brand">
              {queuedIdeas.length}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-ink">{queuedIdeas.length === 1 ? "1 idea queued" : queuedIdeas.length + " ideas queued"}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                {nextQueuedIdea ? (nextQueuedIdea.title || nextQueuedIdea.raw_idea) : "Choose an idea below to get started."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Ideas views" className="grid grid-cols-2 rounded-2xl border border-line bg-surface p-1.5 shadow-inner">
          <button type="button" role="tab" aria-selected={viewMode === "queue"} onClick={() => setViewMode("queue")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-all cursor-pointer ${viewMode === "queue" ? segment.on : segment.off}`}>
            <Layers className="h-4 w-4" aria-hidden="true" />
            <span>Up next</span>
            {queuedIdeas.length > 0 && <span className="rounded-full bg-canvas/60 px-1.5 py-0.5 text-[10px] tabular-nums">{queuedIdeas.length}</span>}
          </button>
          <button type="button" role="tab" aria-selected={viewMode === "stream"} onClick={() => setViewMode("stream")} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition-all cursor-pointer ${viewMode === "stream" ? segment.on : segment.off}`}>
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            <span>All ideas</span>
          </button>
        </div>

        <button type="button" onClick={() => setIsInjectOpen(true)} className={buttonStyles({ variant: "secondary", size: "sm", className: "w-full sm:w-auto" })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add your own idea</span>
        </button>
      </div>

      {/* Stream-Only Sticky Filter Bar */}
      {viewMode === "stream" && (
        <div className="sticky top-14 md:top-0 z-30 bg-[#0a0d12] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pt-3 pb-3.5 space-y-3 border-b border-line shadow-xl shadow-black/40">
          {/* Row 1: Search & Audience Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ideas by title or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-h-11 w-full bg-surface border border-line focus:border-brand rounded-xl pl-9 pr-8 py-2 text-xs text-ink placeholder:text-subtle outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-subtle hover:text-ink"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>

            <details className="lg:hidden rounded-xl border border-line bg-surface px-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                <SlidersHorizontal className="h-4 w-4 text-brand" />
                <span>Filters</span>
                {selectedStage !== "ALL" && <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand">Active</span>}
                <span className="ml-auto text-xs text-muted">Tap to adjust</span>
              </summary>
              <div className="grid grid-cols-1 gap-3 border-t border-line py-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-muted">
                  <span>Stage</span>
                  <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value as "ALL" | IdeaStage)} className="min-h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink">
                    {STAGE_FILTERS.map((stage) => <option key={stage} value={stage}>{stage === "ALL" ? "All stages" : IDEA_STAGE_LABELS[stage]}</option>)}
                  </select>
                </label>
              </div>
            </details>


            {/* Row 3: Stage Filters */}
            <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-line/40 scrollbar-none">
              <span className="text-[11px] font-mono uppercase tracking-wider text-subtle mr-1 shrink-0">
                Stage:
              </span>
              {STAGE_FILTERS.map((stage) => {
                const isSelected = selectedStage === stage;
                const count =
                  stage === "ALL"
                    ? ideas.length
                    : ideas.filter((i) => toIdeaStage(i.status) === stage).length;
                const label = stage === "ALL" ? "All" : IDEA_STAGE_LABELS[stage];

                return (
                  <button
                    key={stage}
                    onClick={() => setSelectedStage(stage)}
                    title={stage === "ALL" ? "Every idea" : IDEA_STAGE_HINTS[stage]}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-surface-2 text-ink border border-brand/60 shadow-sm"
                        : "bg-transparent text-muted hover:text-ink hover:bg-surface"
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? "bg-brand/20 text-brand" : "bg-surface-2 text-subtle"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
        </div>
      )}

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

      {/* Conditional Rendering: Queue Builder vs Calendar View vs Stream View */}
      {viewMode === "queue" ? (
        <QueueBuilderView
          ideas={ideas}
          draftingLabel={draftingStatus?.drafting_on
            ? draftingStatus.next_slot_at
              ? `Next draft ${formatPostTime(draftingStatus.next_slot_at, draftingStatus.timezone)}`
              : "Drafting automatically"
            : draftingStatus ? "Automatic drafting off" : null}
          draftingOn={draftingStatus?.drafting_on === true}
          onUpdateIdeas={setIdeas}
          onSelectIdea={(idea) => setDetailIdea(idea)}
          onToast={(msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      ) : (
        <div className="space-y-6">
          {ideasLoading && <LoadingState label="Loading idea stream…" />}

          {!ideasLoading && ideas.length === 0 && (
            <EmptyState
              title={ideasError ? "Could not load ideas" : "No ideas yet"}
              description={
                ideasError ??
                "Add your first idea to get started, or check back soon for new ideas."
              }
            />
          )}

          {/* Filters exclude everything that was loaded */}
          {!ideasLoading && ideas.length > 0 && filteredIdeas.length === 0 && (
            <div className="bg-surface border border-line rounded-2xl p-12 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-subtle mx-auto" />
              <h3 className="text-base font-bold text-ink">No ideas found matching filters</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Try adjusting your filters or add a new idea.
              </p>
              <button
                onClick={() => {
                  setSelectedStage("ALL");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs font-semibold text-brand hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}

        {/* Card Grid (2 Columns on Desktop, 1 on Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id || idea.ideaId}
              idea={idea}
              claimingIds={claimingIds}
              queueingIds={queueingIds}
              justClaimedIds={justClaimedIds}
              onOpenDetail={setDetailIdea}
              onResetClaim={handleResetClaim}
              onQueue={handleQueueIdea}
              onUnqueue={handleUnqueueIdea}
              onEdit={openEditModal}
              onRequestDelete={setDeleteIdeaTarget}
            />
          ))}
        </div>
      </div>
      )}

      {/* Slide-over / Modal for "+ Add an Idea" */}
      {isInjectOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => !isSubmitting && setIsInjectOpen(false)}
          />

          {/* Slide-over Drawer */}
          <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden border-l border-line bg-surface shadow-2xl animate-in slide-in-from-right duration-200" role="dialog" aria-modal="true" aria-labelledby="add-idea-title">
            {/* Drawer Header and form scroll as one bounded panel region */}
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4 sm:px-6 sm:py-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                      Add an idea
                    </span>
                  </div>
                  <h2 id="add-idea-title" className="text-lg font-bold text-ink">
                    Add your idea
                  </h2>
                </div>
                <button
                  onClick={() => setIsInjectOpen(false)}
                  aria-label="Close add idea"
                  disabled={isSubmitting}
                  className="text-muted hover:text-ink p-2 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form id="inject-topic-form" onSubmit={handleInjectManualTopic} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
                {/* Field: Title */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Idea title <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The customer question our industry keeps answering badly"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-surface-2 border border-line focus:border-brand rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-subtle outline-none transition-all font-medium"
                  />
                  <p className="text-[11px] text-subtle mt-1">
                    Name the specific problem, question, or decision this idea tackles for your ideal customer.
                  </p>
                </div>

                {/* Field: Source & Verification URL */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Source link <span className="text-subtle font-normal">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://news.ycombinator.com/... or https://techcrunch.com/..."
                      value={formSourceUrl}
                      onChange={(e) => setFormSourceUrl(e.target.value)}
                      className="w-full bg-surface-2 border border-line focus:border-brand rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-subtle outline-none transition-all font-mono"
                    />
                  </div>

                </div>

                {/* Field: Excerpt / Angle */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Angle or notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="What might others be missing, and what experience or evidence gives you a useful perspective? An idea, rough angle, or source is enough; future implications are optional."
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    className="w-full bg-surface-2 border border-line focus:border-brand rounded-xl p-3.5 text-xs text-ink placeholder:text-subtle outline-none transition-all resize-none"
                  />
                </div>

              </form>
            </div>

            {/* Drawer Footer */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line bg-canvas/90 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={() => setIsInjectOpen(false)}
                disabled={isSubmitting}
                className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="inject-topic-form"
                disabled={isSubmitting || !formTitle.trim()}
                className={buttonStyles({ size: "sm", className: "w-full sm:w-auto" })}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding idea…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    Add idea
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
            className="w-full max-w-lg bg-surface border-l border-line h-[100dvh] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer Header */}
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 p-5 sm:p-6 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-brand" />
                  <div>
                    <h2 className="text-base font-bold text-ink">
                      Edit idea
                    </h2>
                    <p className="text-xs text-subtle font-mono">
                      {editingIdea.id || editingIdea.ideaId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingIdea(null)}
                  aria-label="Close edit idea"
                  className="min-h-11 min-w-11 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Edit Form */}
              <form id="edit-idea-form" onSubmit={handleSaveEdit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-8 sm:px-6 sm:py-6">
                <div className="space-y-5">
                {/* Title / Signal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                    <span>Idea title</span>
                    <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="min-h-11 w-full bg-canvas border border-line focus:border-brand rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none transition-colors"
                  />
                </div>

                {/* Excerpt / Angle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted">
                    Angle or notes
                  </label>
                  <textarea
                    rows={4}
                    value={editExcerpt}
                    onChange={(e) => setEditExcerpt(e.target.value)}
                    className="w-full bg-canvas border border-line focus:border-brand rounded-xl px-3.5 py-2.5 text-xs text-ink outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                </div>

              </form>
            </div>

            {/* Edit Drawer Footer */}
            <div className="shrink-0 p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-line bg-canvas/90 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDeleteIdeaTarget({ id: editingIdea.id || editingIdea.ideaId || "", title: editTitle })}
                className="min-h-11 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  disabled={isUpdating}
                  className="min-h-11 px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-2 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-idea-form"
                  disabled={isUpdating || !editTitle.trim()}
                  className={buttonStyles({ size: "sm" })}
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

      {detailIdea && (
        <IdeaDetailModal
          idea={detailIdea}
          claimingIds={claimingIds}
          onClose={() => setDetailIdea(null)}
          onDraft={handleRefineAndDraft}
          onEdit={openEditModal}
          onSchedule={setSchedulingIdea}
          onRequestDelete={setDeleteIdeaTarget}
        />
      )}

      {/* SCHEDULE MODAL */}
      <ScheduleModal
        isOpen={!!schedulingIdea}
        onClose={() => setSchedulingIdea(null)}
        idea={schedulingIdea}
        onScheduleSuccess={(updated) => {
          setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          if (detailIdea?.id === updated.id) {
            setDetailIdea(updated);
          }
          setToastMessage(`Scheduled: ${updated.title || updated.raw_idea}`);
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-[80] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-2xl border border-brand/30 bg-surface-2 px-4 py-3 text-sm font-semibold text-ink shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 sm:bottom-6">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Live Multi-Agent Drafting Progress HUD */}
      <DraftingProgressHUD
        job={activeDraftingJob}
        onDismiss={() => setActiveDraftingJob(null)}
      />

      <HarvestingProgressHUD
        job={activeHarvestJob}
        onDismiss={() => setActiveHarvestJob(null)}
      />

      {/* Delete Idea Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteIdeaTarget)}
        title="Delete idea?"
        description={`Delete “${deleteIdeaTarget?.title}”? This cannot be undone. Any draft already created will stay safe.`}
        confirmLabel="Delete idea"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeletingIdea}
        onConfirm={handleConfirmDeleteIdea}
        onClose={() => setDeleteIdeaTarget(null)}
      />
    </div>
  );
}

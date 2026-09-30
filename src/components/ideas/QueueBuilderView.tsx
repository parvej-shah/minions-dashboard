"use client";

import React, { useState, useMemo } from "react";
import {
  IdeaItem,
} from "@/types";
import {
  GripVertical,
  Sparkles,
  Plus,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  Layers,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { buttonStyles } from "@/components/ui/Button";
import { segment } from "@/components/ui/segment";
interface QueueBuilderViewProps {
  ideas: IdeaItem[];
  onUpdateIdeas: (updater: (prev: IdeaItem[]) => IdeaItem[]) => void;
  onSelectIdea: (idea: IdeaItem) => void;
  onDraftIdea: (ideaId: string) => Promise<void>;
  isDrafting: boolean;
  onToast: (msg: string) => void;
}

export default function QueueBuilderView({
  ideas,
  onUpdateIdeas,
  onSelectIdea,
  onDraftIdea,
  isDrafting,
  onToast
}: QueueBuilderViewProps) {
  const [searchPool, setSearchPool] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<string>("ALL");
  // Every workspace now writes for one ICP. Keep this surface focused on the reader.
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDropTargetQueue, setIsDropTargetQueue] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Partition ideas into:
  // 1. Queued ideas (status === "QUEUED" or has queue_order)
  // 2. Harvested pool (status === "HARVESTED" or "REFINED")
  const queuedIdeas = useMemo(() => {
    return ideas
      .filter((i) => i.status === "QUEUED")
      .sort((a, b) => {
        const orderA = a.queue_order !== undefined && a.queue_order !== null ? a.queue_order : 999;
        const orderB = b.queue_order !== undefined && b.queue_order !== null ? b.queue_order : 999;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      });
  }, [ideas]);

  const poolIdeas = useMemo(() => {
    return ideas.filter((i) => {
      if (i.status === "QUEUED" || i.status === "DRAFTED" || i.status === "PUBLISHED" || i.status === "REJECTED") {
        return false;
      }
      // REVIEW/PICKED are the real statuses a drafted/in-flight idea actually carries;
      // draftAssetId is the authoritative "already has a draft" signal regardless of status.
      if (i.status === "REVIEW" || i.status === "PICKED" || i.draftAssetId) {
        return false;
      }
      // Apply filters
      if (selectedTrade !== "ALL" && i.target_trade !== selectedTrade) return false;
      if (searchPool.trim()) {
        const query = searchPool.toLowerCase();
        const title = (i.title || i.raw_idea || "").toLowerCase();
        const excerpt = (i.excerpt || i.angle || "").toLowerCase();
        const trade = (i.target_trade || "").toLowerCase();
        const id = (i.ideaId || i.id || "").toLowerCase();
        if (!title.includes(query) && !excerpt.includes(query) && !trade.includes(query) && !id.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [ideas, selectedTrade, searchPool]);

  // Sync queue state to backend API
  const persistQueueState = async (newQueueList: IdeaItem[], removedIdeaIds: string[] = []) => {
    setIsSavingOrder(true);
    try {
      const queueUpdates = newQueueList.map((item, idx) => ({
        id: item.id || item.ideaId,
        queue_order: idx + 1,
        status: "QUEUED"
      }));

      const removedUpdates = removedIdeaIds.map((id) => ({
        id,
        queue_order: null,
        status: "HARVESTED"
      }));

      const allUpdates = [...queueUpdates, ...removedUpdates];

      const res = await fetch("/api/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueItems: allUpdates })
      });

      if (!res.ok) {
        throw new Error("Failed to save queue changes to database");
      }
    } catch (err) {
      console.error("Queue sync error:", err);
      onToast("⚠️ Failed to sync queue changes to server");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // 1. Add item to queue (appends to bottom or specific index)
  const addToQueue = (idea: IdeaItem, targetIndex?: number) => {
    const existingIndex = queuedIdeas.findIndex((i) => i.id === idea.id);
    const updatedQueue = [...queuedIdeas];

    if (existingIndex >= 0) {
      // Already in queue, reorder
      updatedQueue.splice(existingIndex, 1);
    }

    const itemToAdd: IdeaItem = { ...idea, status: "QUEUED" };

    if (typeof targetIndex === "number" && targetIndex >= 0) {
      updatedQueue.splice(targetIndex, 0, itemToAdd);
    } else {
      updatedQueue.push(itemToAdd);
    }

    // Update local state optimistically
    onUpdateIdeas((prev) =>
      prev.map((i) => {
        const queuedMatchIdx = updatedQueue.findIndex((q) => q.id === i.id);
        if (queuedMatchIdx >= 0) {
          return { ...i, status: "QUEUED", queue_order: queuedMatchIdx + 1 };
        }
        return i;
      })
    );

    persistQueueState(updatedQueue);
    onToast(`Added "${idea.title || idea.raw_idea}" to Production Queue (#${(typeof targetIndex === 'number' ? targetIndex : updatedQueue.length - 1) + 1})`);
  };

  // 2. Remove item from queue back to pool
  const removeFromQueue = (ideaId: string) => {
    const removedIdea = queuedIdeas.find((i) => i.id === ideaId);
    const updatedQueue = queuedIdeas.filter((i) => i.id !== ideaId);

    onUpdateIdeas((prev) =>
      prev.map((i) => {
        if (i.id === ideaId) {
          return { ...i, status: "HARVESTED", queue_order: null };
        }
        const remainingIdx = updatedQueue.findIndex((q) => q.id === i.id);
        if (remainingIdx >= 0) {
          return { ...i, queue_order: remainingIdx + 1 };
        }
        return i;
      })
    );

    persistQueueState(updatedQueue, [ideaId]);
    if (removedIdea) {
      onToast(`Moved "${removedIdea.title || removedIdea.raw_idea}" back to Harvested Pool`);
    }
  };

  // 3. Move item Up / Down in Queue
  const moveQueueItem = (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= queuedIdeas.length) return;

    const updatedQueue = [...queuedIdeas];
    const [moved] = updatedQueue.splice(currentIndex, 1);
    updatedQueue.splice(targetIndex, 0, moved);

    onUpdateIdeas((prev) =>
      prev.map((i) => {
        const idx = updatedQueue.findIndex((q) => q.id === i.id);
        if (idx >= 0) {
          return { ...i, queue_order: idx + 1 };
        }
        return i;
      })
    );

    persistQueueState(updatedQueue);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, ideaId: string) => {
    setDraggedIdeaId(ideaId);
    e.dataTransfer.setData("text/plain", ideaId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverQueue = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDropTargetQueue(true);
  };

  const handleDragLeaveQueue = () => {
    setIsDropTargetQueue(false);
  };

  const handleDropOnQueue = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTargetQueue(false);
    setDragOverIndex(null);

    const ideaId = e.dataTransfer.getData("text/plain") || draggedIdeaId;
    if (!ideaId) return;

    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;

    addToQueue(idea, dragOverIndex !== null ? dragOverIndex : undefined);
    setDraggedIdeaId(null);
  };

  const handleDropOnPool = (e: React.DragEvent) => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData("text/plain") || draggedIdeaId;
    if (!ideaId) return;

    const isCurrentlyQueued = queuedIdeas.some((i) => i.id === ideaId);
    if (isCurrentlyQueued) {
      removeFromQueue(ideaId);
    }
    setDraggedIdeaId(null);
  };

  const getAudienceColor = (aud?: string) => {
    switch (aud) {
      case "ICP":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const [mobileTab, setMobileTab] = useState<"queue" | "pool">("queue");

  return (
    <div className="space-y-4">
      {/* Queue overview */}
      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
            <Layers aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="text-sm font-bold tracking-tight text-white">Production Queue</h2>
              <span className="whitespace-nowrap rounded-full border border-brand/20 bg-brand/10 px-2 py-1 text-[10px] font-semibold text-brand">
                Drafts twice daily · 09:00 & 15:00 UTC
              </span>
              {isSavingOrder && (
                <span role="status" className="inline-flex items-center gap-1 text-[10px] text-brand">
                  <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" /> Saving
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Add ideas to the queue. Minions drafts the first one automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Mobile Column Switcher */}
      <div role="tablist" aria-label="Queue and ideas" className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-sm lg:hidden">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "queue"}
          onClick={() => setMobileTab("queue")}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${mobileTab === "queue" ? segment.on : segment.off}`}
        >
          <Layers aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>Queue <span className="tabular-nums">{queuedIdeas.length}</span></span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "pool"}
          onClick={() => setMobileTab("pool")}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${mobileTab === "pool" ? segment.on : segment.off}`}
        >
          <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>Ideas <span className="tabular-nums">{poolIdeas.length}</span></span>
        </button>
      </div>

      {/* Two-Column Drag and Drop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Harvested Ideas Pool (7 Cols on desktop) */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnPool}
          className={`lg:col-span-7 bg-surface rounded-2xl border border-line p-4 sm:p-5 space-y-4 shadow-lg flex-col max-h-[85vh] ${
            mobileTab === "pool" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-subtle" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Harvested Ideas Pool ({poolIdeas.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-subtle">
              Tap Add to move an idea into production
            </span>
          </div>

          {/* Pool Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6 relative">
              <Search className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchPool}
                onChange={(e) => setSearchPool(e.target.value)}
                placeholder="Filter pool..."
                className="w-full bg-canvas border border-line focus:border-brand rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full bg-canvas border border-line rounded-xl px-2 py-1.5 text-xs text-muted outline-none cursor-pointer"
              >
                <option value="ALL">All Trades</option>
                <option value="HVAC">HVAC</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Roofing">Roofing</option>
                <option value="Pest Control">Pest Control</option>
                <option value="Voice AI">Voice AI</option>
              </select>
            </div>
          </div>

          {/* Pool Card Scroll Area */}
          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[240px] lg:min-h-[300px]">
            {poolIdeas.length === 0 ? (
              <div className="p-8 text-center text-xs text-subtle italic space-y-1">
                <AlertCircle className="w-5 h-5 mx-auto text-[#475569]" />
                <div>No ideas matching this filter in the pool.</div>
              </div>
            ) : (
              poolIdeas.map((idea) => (
                <div
                  key={idea.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idea.id)}
                  className={`p-3.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-line hover:border-brand/40 transition-all flex items-start sm:items-center justify-between gap-3 group cursor-grab active:cursor-grabbing shadow-xs ${
                    draggedIdeaId === idea.id ? "opacity-40 border-dashed border-brand" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-1 rounded text-[#475569] group-hover:text-muted cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelectIdea(idea)}>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getAudienceColor(idea.audience)}`}>
                          {idea.audience || "ICP"}
                        </span>
                        <span className="text-[10px] font-medium bg-canvas text-muted px-2 py-0.2 rounded border border-line">
                          {idea.target_trade || "—"}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white group-hover:text-brand line-clamp-1 transition-colors">
                        {idea.title || idea.raw_idea}
                      </div>

                      <div className="text-[11px] text-muted line-clamp-1 mt-0.5">
                        {idea.excerpt || idea.angle}
                      </div>
                    </div>
                  </div>

                  {/* Add to Queue Button */}
                  <button
                    type="button"
                    onClick={() => addToQueue(idea)}
                    className={buttonStyles({ variant: "soft", size: "sm", className: "shrink-0" })}
                    title="Add to production queue"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Production Draft Queue (5 Cols on desktop) */}
        <div
          onDragOver={handleDragOverQueue}
          onDragLeave={handleDragLeaveQueue}
          onDrop={handleDropOnQueue}
          className={`lg:col-span-5 bg-surface rounded-2xl border transition-all p-4 sm:p-5 space-y-4 shadow-xl flex-col max-h-[85vh] ${
            mobileTab === "queue" ? "flex" : "hidden lg:flex"
          } ${
            isDropTargetQueue
              ? "border-brand ring-2 ring-brand/20 bg-brand/5"
              : "border-line"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line pb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Production Queue ({queuedIdeas.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-brand bg-brand/10 border border-brand/30 px-2 py-0.5 rounded-full font-bold">
              Auto-Draft Active
            </span>
          </div>

          {/* Queue Items List */}
          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[240px] lg:min-h-[300px]">
            {queuedIdeas.length === 0 ? (
              <div className="h-48 border-2 border-dashed border-line rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-2">
                <Layers className="w-6 h-6 text-[#475569]" />
                <div className="text-xs font-semibold text-muted">
                  Your queue is empty
                </div>
                <p className="text-[11px] text-subtle max-w-xs">
                  Choose an idea from the Ideas tab to add it here.
                </p>
              </div>
            ) : (
              queuedIdeas.map((idea, index) => {
                const isFirst = index === 0;

                return (
                  <div
                    key={idea.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idea.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(index);
                    }}
                    className={`p-3.5 rounded-xl border transition-all flex items-start sm:items-center justify-between gap-2.5 group cursor-grab active:cursor-grabbing shadow-sm relative ${
                      isFirst
                        ? "bg-brand/10 border-brand/50 shadow-lg shadow-brand/5"
                        : "bg-surface-2 hover:bg-surface-3 border-line"
                    } ${dragOverIndex === index ? "border-t-2 border-t-brand" : ""}`}
                  >
                    {/* Rank Badge & Grip */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="p-0.5 rounded text-[#475569] group-hover:text-muted">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg text-xs font-mono font-extrabold flex items-center justify-center ${
                          isFirst
                            ? "bg-brand text-canvas"
                            : index === 1
                            ? "bg-[#3B82F6] text-white"
                            : "bg-canvas text-muted border border-line"
                        }`}
                      >
                        #{index + 1}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelectIdea(idea)}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {isFirst && (
                          <span className="text-[9px] font-mono font-bold text-brand bg-brand/20 px-1.5 rounded uppercase whitespace-nowrap shrink-0">
                            Next Up
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1 rounded whitespace-nowrap shrink-0 ${getAudienceColor(idea.audience)}`}>
                          {idea.audience || "ICP"}
                        </span>
                        <span className="text-[9px] font-mono text-subtle whitespace-nowrap shrink-0">
                          {idea.target_trade || "—"}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white truncate group-hover:text-brand transition-colors">
                        {idea.title || idea.raw_idea}
                      </div>
                    </div>

                    {/* Controls: Up, Down, Remove */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveQueueItem(index, "up")}
                        disabled={index === 0}
                        className="p-2.5 sm:p-1.5 rounded text-subtle hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveQueueItem(index, "down")}
                        disabled={index === queuedIdeas.length - 1}
                        className="p-2.5 sm:p-1.5 rounded text-subtle hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromQueue(idea.id)}
                        className="p-2.5 sm:p-1.5 rounded text-subtle hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer ml-1"
                        title="Remove from queue"
                      >
                        <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

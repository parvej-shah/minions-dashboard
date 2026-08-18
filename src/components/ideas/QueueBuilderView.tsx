"use client";

import React, { useState, useMemo } from "react";
import { IdeaItem, AudienceLane, TargetTrade } from "@/lib/types";
import { 
  GripVertical, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  X, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Loader2,
  AlertCircle,
  HelpCircle
} from "lucide-react";

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
  const [selectedAudience, setSelectedAudience] = useState<string>("ALL");
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
      if (selectedAudience !== "ALL" && i.audience !== selectedAudience) return false;
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
  }, [ideas, selectedTrade, selectedAudience, searchPool]);

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
    } catch (err: any) {
      console.error("Queue sync error:", err);
      onToast("⚠️ Failed to sync queue changes to server");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // 1. Add item to queue (appends to bottom or specific index)
  const addToQueue = (idea: IdeaItem, targetIndex?: number) => {
    const existingIndex = queuedIdeas.findIndex((i) => i.id === idea.id);
    let updatedQueue = [...queuedIdeas];

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
      case "PEER":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "BRIDGE":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner - Slim & Modern */}
      <div className="bg-[#0F1419] p-3 px-4 rounded-xl border border-[#1F2D3D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#00C9A7]/10 border border-[#00C9A7]/30 flex items-center justify-center text-[#00C9A7] shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Production Queue
              </h2>
              <span className="text-[10px] font-mono font-bold text-[#00C9A7] bg-[#00C9A7]/10 px-2 py-0.2 rounded-full border border-[#00C9A7]/20">
                Twice Daily (09:00 & 15:00 UTC)
              </span>
              {isSavingOrder && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#00C9A7]">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  <span>Syncing...</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] truncate max-w-xl">
              Drag candidate topics into the queue. Workflow 02 automatically drafts the top #1 item on schedule.
            </p>
          </div>
        </div>

        {/* Quick Execution Button for #1 Item */}
        <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
          {queuedIdeas.length > 0 ? (
            <button
              onClick={() => onDraftIdea(queuedIdeas[0].id || queuedIdeas[0].ideaId || "")}
              disabled={isDrafting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] disabled:opacity-50 text-[#070B0F] text-xs font-extrabold px-4 py-2 rounded-xl shadow-md shadow-[#00C9A7]/20 transition-all active:scale-95 cursor-pointer"
            >
              {isDrafting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Drafting #1 in Queue...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Draft #1 Now: &quot;{queuedIdeas[0].title ? queuedIdeas[0].title.slice(0, 24) + '...' : queuedIdeas[0].id}&quot;</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-[11px] text-[#64748B] italic bg-[#161D26] px-3 py-1.5 rounded-lg border border-[#1F2D3D]">
              Queue is empty. Drag an idea below to queue it.
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Drag and Drop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Harvested Ideas Pool (7 Cols on desktop) */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnPool}
          className="lg:col-span-7 bg-[#0F1419] rounded-2xl border border-[#1F2D3D] p-5 space-y-4 shadow-lg flex flex-col max-h-[85vh]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2D3D] pb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#64748B]" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Harvested Ideas Pool ({poolIdeas.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">
              Drag to Queue or click &quot;+ Add&quot;
            </span>
          </div>

          {/* Pool Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6 relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchPool}
                onChange={(e) => setSearchPool(e.target.value)}
                placeholder="Filter pool..."
                className="w-full bg-[#070B0F] border border-[#1F2D3D] focus:border-[#00C9A7] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full bg-[#070B0F] border border-[#1F2D3D] rounded-xl px-2 py-1.5 text-xs text-[#94A3B8] outline-none cursor-pointer"
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

            <div className="sm:col-span-3">
              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="w-full bg-[#070B0F] border border-[#1F2D3D] rounded-xl px-2 py-1.5 text-xs text-[#94A3B8] outline-none cursor-pointer"
              >
                <option value="ALL">All Audiences</option>
                <option value="ICP">ICP (Contractors)</option>
                <option value="PEER">PEER (Engineers)</option>
                <option value="BRIDGE">BRIDGE (Investors)</option>
              </select>
            </div>
          </div>

          {/* Pool Card Scroll Area */}
          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[300px]">
            {poolIdeas.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B] italic space-y-1">
                <AlertCircle className="w-5 h-5 mx-auto text-[#475569]" />
                <div>No ideas matching this filter in the pool.</div>
              </div>
            ) : (
              poolIdeas.map((idea) => (
                <div
                  key={idea.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idea.id)}
                  className={`p-3.5 rounded-xl bg-[#161D26] hover:bg-[#1E2733] border border-[#1F2D3D] hover:border-[#00C9A7]/40 transition-all flex items-center justify-between gap-3 group cursor-grab active:cursor-grabbing shadow-xs ${
                    draggedIdeaId === idea.id ? "opacity-40 border-dashed border-[#00C9A7]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-1 rounded text-[#475569] group-hover:text-[#94A3B8] cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelectIdea(idea)}>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getAudienceColor(idea.audience)}`}>
                          {idea.audience || "ICP"}
                        </span>
                        <span className="text-[10px] font-medium bg-[#070B0F] text-[#94A3B8] px-2 py-0.2 rounded border border-[#1F2D3D]">
                          {idea.target_trade || "HVAC"}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white group-hover:text-[#00C9A7] line-clamp-1 transition-colors">
                        {idea.title || idea.raw_idea}
                      </div>

                      <div className="text-[11px] text-[#94A3B8] line-clamp-1 mt-0.5">
                        {idea.excerpt || idea.angle}
                      </div>
                    </div>
                  </div>

                  {/* Add to Queue Button */}
                  <button
                    type="button"
                    onClick={() => addToQueue(idea)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#00C9A7]/10 hover:bg-[#00C9A7] text-[#00C9A7] hover:text-[#070B0F] border border-[#00C9A7]/30 text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Add to production queue"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add</span>
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
          className={`lg:col-span-5 bg-[#0F1419] rounded-2xl border transition-all p-5 space-y-4 shadow-xl flex flex-col max-h-[85vh] ${
            isDropTargetQueue
              ? "border-[#00C9A7] ring-2 ring-[#00C9A7]/20 bg-[#00C9A7]/5"
              : "border-[#1F2D3D]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#1F2D3D] pb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00C9A7] animate-pulse" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Production Queue ({queuedIdeas.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#00C9A7] bg-[#00C9A7]/10 border border-[#00C9A7]/30 px-2 py-0.5 rounded-full font-bold">
              Auto-Draft Active
            </span>
          </div>

          {/* Queue Items List */}
          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[300px]">
            {queuedIdeas.length === 0 ? (
              <div className="h-48 border-2 border-dashed border-[#1F2D3D] rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-2">
                <Layers className="w-6 h-6 text-[#475569]" />
                <div className="text-xs font-semibold text-[#94A3B8]">
                  Drop Ideas Here to Queue
                </div>
                <p className="text-[11px] text-[#64748B] max-w-xs">
                  Drag any topic from the left pool to queue it for automated drafting.
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
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 group cursor-grab active:cursor-grabbing shadow-sm relative ${
                      isFirst
                        ? "bg-[#00C9A7]/10 border-[#00C9A7]/50 shadow-lg shadow-[#00C9A7]/5"
                        : "bg-[#161D26] hover:bg-[#1E2733] border-[#1F2D3D]"
                    } ${dragOverIndex === index ? "border-t-2 border-t-[#00C9A7]" : ""}`}
                  >
                    {/* Rank Badge & Grip */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="p-0.5 rounded text-[#475569] group-hover:text-[#94A3B8]">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg text-xs font-mono font-extrabold flex items-center justify-center ${
                          isFirst
                            ? "bg-[#00C9A7] text-[#070B0F]"
                            : index === 1
                            ? "bg-[#3B82F6] text-white"
                            : "bg-[#070B0F] text-[#94A3B8] border border-[#1F2D3D]"
                        }`}
                      >
                        #{index + 1}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelectIdea(idea)}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {isFirst && (
                          <span className="text-[9px] font-mono font-bold text-[#00C9A7] bg-[#00C9A7]/20 px-1.5 rounded uppercase">
                            Next Up
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1 rounded ${getAudienceColor(idea.audience)}`}>
                          {idea.audience || "ICP"}
                        </span>
                        <span className="text-[9px] font-mono text-[#64748B]">
                          {idea.target_trade || "HVAC"}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white truncate group-hover:text-[#00C9A7] transition-colors">
                        {idea.title || idea.raw_idea}
                      </div>
                    </div>

                    {/* Controls: Up, Down, Remove */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveQueueItem(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded text-[#64748B] hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveQueueItem(index, "down")}
                        disabled={index === queuedIdeas.length - 1}
                        className="p-1 rounded text-[#64748B] hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromQueue(idea.id)}
                        className="p-1 rounded text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer ml-1"
                        title="Remove from queue"
                      >
                        <X className="w-3.5 h-3.5" />
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

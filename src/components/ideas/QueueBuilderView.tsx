"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Layers,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { IdeaItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { cardStyles } from "@/components/ui/Card";
import { segment } from "@/components/ui/segment";

interface QueueBuilderViewProps {
  ideas: IdeaItem[];
  draftingLabel: string | null;
  draftingOn: boolean;
  onUpdateIdeas: (updater: (prev: IdeaItem[]) => IdeaItem[]) => void;
  onSelectIdea: (idea: IdeaItem) => void;
  onToast: (msg: string) => void;
}

const ideaId = (idea: IdeaItem) => idea.id || idea.ideaId || "";
const ideaTitle = (idea: IdeaItem) => idea.title || idea.raw_idea || "Untitled idea";

export default function QueueBuilderView({
  ideas,
  draftingLabel,
  draftingOn,
  onUpdateIdeas,
  onSelectIdea,
  onToast,
}: QueueBuilderViewProps) {
  const [searchPool, setSearchPool] = useState("");
  const [mobileTab, setMobileTab] = useState<"queue" | "pool">("queue");
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDropTargetQueue, setIsDropTargetQueue] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [pendingIdeaId, setPendingIdeaId] = useState<string | null>(null);

  const queuedIdeas = useMemo(
    () => ideas
      .filter((idea) => idea.status === "QUEUED")
      .sort((a, b) => (a.queue_order ?? 999) - (b.queue_order ?? 999)),
    [ideas]
  );

  const poolIdeas = useMemo(() => ideas.filter((idea) => {
    if (["QUEUED", "DRAFTED", "PUBLISHED", "REJECTED", "REVIEW", "PICKED"].includes(idea.status || "") || idea.draftAssetId) {
      return false;
    }
    if (!searchPool.trim()) return true;
    const query = searchPool.toLowerCase();
    return [ideaTitle(idea), idea.excerpt || idea.angle || "", idea.target_trade || ""]
      .some((value) => value.toLowerCase().includes(query));
  }), [ideas, searchPool]);

  const persistQueueState = async (newQueue: IdeaItem[], removedIds: string[] = []) => {
    const queueItems = [
      ...newQueue.map((item, index) => ({
        id: ideaId(item),
        queue_order: index + 1,
        status: "QUEUED",
      })),
      ...removedIds.map((id) => ({ id, queue_order: null, status: "HARVESTED" })),
    ];

    try {
      const response = await fetch("/api/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueItems }),
      });
      if (!response.ok) throw new Error("Queue update failed");
      return true;
    } catch (error) {
      console.error("Queue sync error:", error);
      onToast("Could not save that change. Please try again.");
      return false;
    }
  };

  const applyQueueLocally = (newQueue: IdeaItem[], removedIds: string[] = []) => {
    const removed = new Set(removedIds);
    onUpdateIdeas((previous) => previous.map((item) => {
      const position = newQueue.findIndex((queued) => ideaId(queued) === ideaId(item));
      if (position >= 0) return { ...item, status: "QUEUED", queue_order: position + 1 };
      if (removed.has(ideaId(item))) return { ...item, status: "HARVESTED", queue_order: null };
      return item;
    }));
  };

  const addToQueue = async (idea: IdeaItem, targetIndex?: number) => {
    const id = ideaId(idea);
    if (!id || pendingIdeaId) return;
    setPendingIdeaId(id);

    const updatedQueue = queuedIdeas.filter((item) => ideaId(item) !== id);
    const queuedIdea = { ...idea, status: "QUEUED" as const };
    if (typeof targetIndex === "number" && targetIndex >= 0) updatedQueue.splice(targetIndex, 0, queuedIdea);
    else updatedQueue.push(queuedIdea);

    const saved = await persistQueueState(updatedQueue);
    if (saved) {
      applyQueueLocally(updatedQueue);
      onToast(`Added “${ideaTitle(idea)}” to Up next.`);
      setMobileTab("queue");
    }
    setPendingIdeaId(null);
  };

  const removeFromQueue = async (id: string) => {
    if (!id || pendingIdeaId) return;
    setPendingIdeaId(id);
    const removed = queuedIdeas.find((idea) => ideaId(idea) === id);
    const updatedQueue = queuedIdeas.filter((idea) => ideaId(idea) !== id);
    const saved = await persistQueueState(updatedQueue, [id]);
    if (saved) {
      applyQueueLocally(updatedQueue, [id]);
      onToast(`Removed “${removed ? ideaTitle(removed) : "Idea"}” from Up next.`);
    }
    setPendingIdeaId(null);
  };

  const moveQueueItem = async (currentIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= queuedIdeas.length || isSavingOrder) return;
    const updatedQueue = [...queuedIdeas];
    const [moved] = updatedQueue.splice(currentIndex, 1);
    updatedQueue.splice(targetIndex, 0, moved);
    applyQueueLocally(updatedQueue);
    setIsSavingOrder(true);
    await persistQueueState(updatedQueue);
    setIsSavingOrder(false);
  };

  const handleDragStart = (event: React.DragEvent, id: string) => {
    setDraggedIdeaId(id);
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnQueue = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDropTargetQueue(false);
    const id = event.dataTransfer.getData("text/plain") || draggedIdeaId;
    const idea = ideas.find((item) => ideaId(item) === id);
    if (idea) void addToQueue(idea, dragOverIndex ?? undefined);
    setDraggedIdeaId(null);
    setDragOverIndex(null);
  };

  const handleDropOnPool = (event: React.DragEvent) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") || draggedIdeaId;
    if (id && queuedIdeas.some((idea) => ideaId(idea) === id)) void removeFromQueue(id);
    setDraggedIdeaId(null);
  };

  return (
    <div className="space-y-5">

      <div role="tablist" aria-label="Up next and available ideas" className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-sm lg:hidden">
        <button type="button" role="tab" aria-selected={mobileTab === "queue"} onClick={() => setMobileTab("queue")} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all cursor-pointer ${mobileTab === "queue" ? segment.on : segment.off}`}>
          <Layers className="h-4 w-4" aria-hidden="true" /> Up next <span className="tabular-nums">{queuedIdeas.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={mobileTab === "pool"} onClick={() => setMobileTab("pool")} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all cursor-pointer ${mobileTab === "pool" ? segment.on : segment.off}`}>
          <Sparkles className="h-4 w-4" aria-hidden="true" /> Choose <span className="tabular-nums">{poolIdeas.length}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <section
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDropOnPool}
          className={`${cardStyles("default", "space-y-4 lg:col-span-7")} ${mobileTab === "pool" ? "block" : "hidden lg:block"}`}
        >
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-brand">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Choose an idea
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-ink">Ideas worth developing</h3>
            <p className="mt-1 text-xs text-muted">Open an idea for context, or add it directly to Up next.</p>
          </div>

          <div>
            <label className="relative">
              <span className="sr-only">Search available ideas</span>
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
              <input value={searchPool} onChange={(event) => setSearchPool(event.target.value)} placeholder="Search ideas" className="min-h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm text-ink outline-none transition-colors focus:border-brand" />
            </label>
          </div>

          <div className="space-y-3">
            {poolIdeas.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-line px-6 py-12 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-subtle" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-ink">No ideas match this view</p>
                <p className="mt-1 text-xs text-muted">Clear your search and try again.</p>
              </div>
            ) : poolIdeas.map((idea) => {
              const id = ideaId(idea);
              return (
                <article key={id} draggable onDragStart={(event) => handleDragStart(event, id)} className="group rounded-2xl border-2 border-b-4 border-line bg-surface-2 p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40">
                  <div className="flex items-start gap-3">
                    <GripVertical className="mt-1 hidden h-4 w-4 shrink-0 cursor-grab text-subtle lg:block" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <h4 className="mt-1 text-sm font-extrabold leading-snug text-ink">{ideaTitle(idea)}</h4>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{idea.excerpt || idea.angle || "Open this idea to see the thinking behind it."}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                    <button type="button" onClick={() => onSelectIdea(idea)} className="min-h-10 cursor-pointer rounded-xl px-2 text-xs font-bold text-muted transition-colors hover:bg-surface-3 hover:text-ink">View details</button>
                    <Button size="sm" variant="soft" loading={pendingIdeaId === id} disabled={Boolean(pendingIdeaId && pendingIdeaId !== id)} icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => void addToQueue(idea)}>
                      Add to Up next
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          onDragOver={(event) => { event.preventDefault(); setIsDropTargetQueue(true); }}
          onDragLeave={() => setIsDropTargetQueue(false)}
          onDrop={handleDropOnQueue}
          className={`${cardStyles("raised", `space-y-4 transition-colors lg:col-span-5 ${isDropTargetQueue ? "border-brand bg-brand/5" : ""}`)} ${mobileTab === "queue" ? "block" : "hidden lg:block"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand">Writing order</p>
              <h3 className="mt-1 text-lg font-extrabold text-ink">Up next</h3>
            </div>
            {draftingLabel && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${draftingOn ? "bg-brand/10 text-brand" : "bg-surface-2 text-muted"}`}>
                {draftingLabel}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {queuedIdeas.length === 0 ? (
              <button type="button" onClick={() => setMobileTab("pool")} className="flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line p-6 text-center transition-colors hover:border-brand/50 hover:bg-brand/5">
                <Plus className="h-7 w-7 text-brand" aria-hidden="true" />
                <span className="mt-3 text-sm font-extrabold text-ink">Choose your next idea</span>
                <span className="mt-1 max-w-xs text-xs text-muted">Add one idea and Minions will know what to write next.</span>
              </button>
            ) : queuedIdeas.map((idea, index) => {
              const id = ideaId(idea);
              const isFirst = index === 0;
              return (
                <article key={id} draggable onDragStart={(event) => handleDragStart(event, id)} onDragOver={(event) => { event.preventDefault(); setDragOverIndex(index); }} className={`rounded-2xl border-2 border-b-4 p-4 transition-all ${isFirst ? "border-brand/50 border-b-brand-edge/70 bg-brand/10" : "border-line bg-surface-2"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${isFirst ? "bg-brand text-brand-ink" : "border border-line bg-canvas text-muted"}`}>{index + 1}</div>
                    <button type="button" onClick={() => onSelectIdea(idea)} className="min-w-0 flex-1 cursor-pointer text-left">
                      {isFirst && <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand">Next draft</span>}
                      <span className="mt-0.5 block text-sm font-extrabold leading-snug text-ink">{ideaTitle(idea)}</span>
                    </button>
                    {pendingIdeaId === id ? <Loader2 className="mt-1 h-4 w-4 animate-spin text-brand" aria-label="Removing idea" /> : (
                      <button type="button" onClick={() => void removeFromQueue(id)} aria-label={`Remove ${ideaTitle(idea)} from Up next`} className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl text-subtle transition-colors hover:bg-danger/10 hover:text-danger">
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted"><GripVertical className="h-3.5 w-3.5" aria-hidden="true" /> Drag to reorder</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => void moveQueueItem(index, "up")} disabled={index === 0 || isSavingOrder} aria-label={`Move ${ideaTitle(idea)} up`} className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-surface-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-25"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                      <button type="button" onClick={() => void moveQueueItem(index, "down")} disabled={index === queuedIdeas.length - 1 || isSavingOrder} aria-label={`Move ${ideaTitle(idea)} down`} className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-surface-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-25"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

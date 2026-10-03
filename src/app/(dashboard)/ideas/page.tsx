"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Plus, Sparkles, X } from "lucide-react";
import AddIdeaDrawer from "@/components/ideas/AddIdeaDrawer";
import DraftingProgressHUD from "@/components/common/DraftingProgressHUD";
import EditIdeaDrawer from "@/components/ideas/EditIdeaDrawer";
import HarvestingProgressHUD from "@/components/common/HarvestingProgressHUD";
import IdeaCard from "@/components/ideas/IdeaCard";
import IdeaDetailModal from "@/components/ideas/IdeaDetailModal";
import IdeaFilters from "@/components/ideas/IdeaFilters";
import IdeasSkeleton from "@/components/ideas/IdeasSkeleton";
import ScheduleModal from "@/components/ideas/ScheduleModal";
import { buttonStyles } from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import Toast from "@/components/ui/Toast";
import { isIdea, useIdeaStream } from "@/hooks/useIdeaStream";
import { useToast } from "@/hooks/useToast";
import { filterIdeas, type StageFilter } from "@/lib/ideaFilter";
import type { IdeaItem } from "@/types";

interface DeleteTarget {
  id: string;
  title: string;
}

export default function IdeaStreamPage() {
  const toast = useToast(3000);
  const stream = useIdeaStream(toast.show);
  const { ideas, setIdeas } = stream;

  const [stage, setStage] = useState<StageFilter>("ALL");
  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailIdea, setDetailIdea] = useState<IdeaItem | null>(null);
  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null);
  const [schedulingIdea, setSchedulingIdea] = useState<IdeaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const visibleIdeas = useMemo(() => filterIdeas(ideas, stage, query), [ideas, stage, query]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const deleted = await stream.deleteIdea(deleteTarget.id);
    if (deleted) {
      if (editingIdea && isIdea(editingIdea, deleteTarget.id)) setEditingIdea(null);
      if (detailIdea && isIdea(detailIdea, deleteTarget.id)) setDetailIdea(null);
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  if (stream.isLoading) return <IdeasSkeleton />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 selection:bg-brand/30 selection:text-brand">
      {stream.isFirstRun && (
        <section className="relative overflow-hidden rounded-2xl border border-brand/35 bg-brand/[0.07] px-5 py-4 shadow-lg shadow-brand/5">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-brand/10 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-brand/15">
              <Sparkles className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Your first ideas are being prepared</p>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
                Minions is using your Brand Brief to find relevant angles. When they arrive, Minions will use the oldest available idea for your first draft.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[1.75rem] border-2 border-b-4 border-brand/35 border-b-brand-edge/70 bg-[linear-gradient(135deg,#0F1C1D_0%,#10171D_62%,#0E1419_100%)] p-5 sm:p-7">
        <span className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-brand">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Ideas
          </p>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">Your ideas</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            When automatic drafting is on, Minions picks the oldest available idea and turns it into a draft.
          </p>
        </div>
      </section>

      <div className="flex justify-end border-b border-line pb-4">
        <button type="button" onClick={() => setIsAddOpen(true)} className={buttonStyles({ variant: "secondary", size: "sm", className: "w-full sm:w-auto" })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add your own idea</span>
        </button>
      </div>

      <IdeaFilters ideas={ideas} stage={stage} query={query} onStageChange={setStage} onQueryChange={setQuery} />

      {stream.draftError && (
        <div className="bg-[#2A1215] border border-[#7F1D1D] rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#F87171] mt-0.5 shrink-0" />
          <div className="flex-1 text-xs text-[#FCA5A5]">
            <span className="font-semibold">Could not start drafting: </span>
            {stream.draftError}
          </div>
          <button onClick={stream.clearDraftError} className="text-[#FCA5A5] hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {ideas.length === 0 && (
          <EmptyState
            title={stream.error ? "Could not load ideas" : "No ideas yet"}
            description={stream.error ?? "Add your first idea to get started, or check back soon for new ideas."}
          />
        )}

        {ideas.length > 0 && visibleIdeas.length === 0 && (
          <div className="bg-surface border border-line rounded-2xl p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-subtle mx-auto" />
            <h3 className="text-base font-bold text-ink">No ideas found matching filters</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">Try adjusting your filters or add a new idea.</p>
            <button
              onClick={() => {
                setStage("ALL");
                setQuery("");
              }}
              className="mt-2 text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleIdeas.map((idea) => (
            <IdeaCard
              key={idea.id || idea.ideaId}
              idea={idea}
              claimingIds={stream.claimingIds}
              justClaimedIds={stream.justClaimedIds}
              onOpenDetail={setDetailIdea}
              onResetClaim={stream.resetClaim}
              onDraft={stream.startDraft}
              onEdit={setEditingIdea}
              onRequestDelete={setDeleteTarget}
            />
          ))}
        </div>
      </div>

      {isAddOpen && (
        <AddIdeaDrawer
          onClose={() => setIsAddOpen(false)}
          onCreated={(created) => {
            setIdeas((prev) => [created, ...prev]);
            setIsAddOpen(false);
            toast.show("Idea added to your stream.");
          }}
          onFailed={(message) => toast.show(message, 5000)}
        />
      )}

      {editingIdea && (
        <EditIdeaDrawer
          key={editingIdea.id}
          idea={editingIdea}
          onClose={() => setEditingIdea(null)}
          onSaved={(changes) => {
            setIdeas((prev) => prev.map((item) => (item.id === editingIdea.id ? { ...item, ...changes } : item)));
            toast.show(`Idea ${editingIdea.id} updated successfully!`);
            setEditingIdea(null);
          }}
          onFailed={(message) => toast.show(message, 5000)}
          onRequestDelete={setDeleteTarget}
        />
      )}

      {detailIdea && (
        <IdeaDetailModal
          idea={detailIdea}
          claimingIds={stream.claimingIds}
          onClose={() => setDetailIdea(null)}
          onDraft={stream.startDraft}
          onEdit={setEditingIdea}
          onSchedule={setSchedulingIdea}
          onRequestDelete={setDeleteTarget}
        />
      )}

      <ScheduleModal
        isOpen={!!schedulingIdea}
        onClose={() => setSchedulingIdea(null)}
        idea={schedulingIdea}
        onScheduleSuccess={(updated) => {
          setIdeas((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          if (detailIdea?.id === updated.id) setDetailIdea(updated);
          toast.show(`Scheduled: ${updated.title || updated.raw_idea}`, 5000);
        }}
      />

      <Toast message={toast.message} position="lifted" />

      <DraftingProgressHUD job={stream.draftingJob} onDismiss={stream.dismissDraftingJob} />
      <HarvestingProgressHUD job={stream.harvestJob} onDismiss={stream.dismissHarvestJob} />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete idea?"
        description={`Delete “${deleteTarget?.title}”? This cannot be undone. Any draft already created will stay safe.`}
        confirmLabel="Delete idea"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

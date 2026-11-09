"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AddIdeaDrawer from "@/components/ideas/AddIdeaDrawer";
import EditIdeaDrawer from "@/components/ideas/EditIdeaDrawer";
import HarvestingProgressHUD from "@/components/common/HarvestingProgressHUD";
import IdeaDetailModal from "@/components/ideas/IdeaDetailModal";
import IdeaRow from "@/components/ideas/IdeaRow";
import IdeasSkeleton from "@/components/ideas/IdeasSkeleton";
import ScheduleModal from "@/components/ideas/ScheduleModal";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Segmented, SearchField } from "@/components/ui/Filters";
import { PageHeader, StatusLabel } from "@/components/ui/Text";
import Toast from "@/components/ui/Toast";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { useApiResource } from "@/hooks/useApiResource";
import { isIdea, useIdeaStream } from "@/hooks/useIdeaStream";
import { useToast } from "@/hooks/useToast";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { shortWhen } from "@/lib/drafts/decision";
import { countIdeas, ideaGroup, ideasFor, type IdeaView, type PlannedSlot } from "@/lib/ideas/list";
import type { IdeaItem } from "@/types";

interface DeleteTarget {
  id: string;
  title: string;
}

const EMPTY: Record<IdeaView, string> = {
  next: "No ideas waiting. Add one, or Minions finds new ones from your brand and sources.",
  written: "Nothing written from your ideas yet.",
  aside: "Nothing set aside.",
};

const titleOf = (idea: IdeaItem) => idea.title || idea.raw_idea || "Untitled idea";

/** Ideas (task 25): an ordered list, the top one is written next. */
export default function IdeasPage() {
  const toast = useToast(3000);
  const stream = useIdeaStream(toast.show);
  const { ideas, setIdeas } = stream;
  const plan = useApiResource<{ week?: { timezone: string; filler_enabled: boolean; slots: PlannedSlot[] } }>("/api/plan", {});

  const [view, setView] = useState<IdeaView>("next");
  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailIdea, setDetailIdea] = useState<IdeaItem | null>(null);
  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null);
  const [schedulingIdea, setSchedulingIdea] = useState<IdeaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tz = plan.data.week?.timezone || DEFAULT_TIMEZONE;
  const now = useMemo(() => new Date(), []);
  // Only planned slots still ahead count as "next".
  const slots = useMemo(() => (plan.data.week?.slots ?? []).filter((s) => Date.parse(s.slot_at) > now.getTime()), [plan.data.week, now]);
  const list = useMemo(() => ideasFor(ideas, view, slots, query), [ideas, view, slots, query]);
  const writing = ideas.filter((i) => ideaGroup(i) === "writing" || stream.claimingIds.has(i.id));
  const nextUp = view === "next" && !query ? list[0] : undefined;

  // Say so when an idea being written turns into a post, then stop the fast refresh.
  const wasWriting = useRef<Map<string, string>>(new Map());
  const { draftingJob, dismissDraftingJob } = stream;
  useEffect(() => {
    const nowWriting = new Map(ideas.filter((i) => ideaGroup(i) === "writing").map((i) => [i.id, titleOf(i)]));
    for (const [id, title] of wasWriting.current) {
      const idea = ideas.find((i) => i.id === id);
      if (idea && ideaGroup(idea) === "written") toast.show(`“${title}” is written. It's waiting for you in Posts.`, 5000);
    }
    wasWriting.current = nowWriting;
    if (draftingJob && nowWriting.size === 0 && stream.claimingIds.size === 0 && Date.now() - draftingJob.startedAt > 60_000) {
      dismissDraftingJob();
    }
  }, [ideas, draftingJob, dismissDraftingJob, stream.claimingIds, toast]);

  const patchStatus = async (idea: IdeaItem, status: "REJECTED" | "REFINED", done: string) => {
    try {
      await apiClient.patch(`/api/ideas/${idea.id}`, { status });
      setIdeas((prev) => prev.map((i) => (i.id === idea.id ? { ...i, status } : i)));
      toast.show(done);
    } catch (e) {
      toast.show(toErrorMessage(e, "Could not change that idea."), 5000);
    }
  };

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

  const intro = nextUp?.slotAt && plan.data.week?.filler_enabled ? (
    <>
      Minions writes the top one next, ready for you <strong className="font-semibold text-ink">{shortWhen(nextUp.slotAt, tz, now)}</strong>. Want a different one first? Tap Write now.
    </>
  ) : (
    "Tap Write now on any idea and Minions writes the post for you to review. Nothing goes out until you approve it."
  );

  return (
    <div className="mx-auto max-w-[840px] space-y-9">
      <PageHeader
        title="Ideas"
        action={
          <button type="button" onClick={() => setIsAddOpen(true)} className={buttonStyles({ size: "lg" })}>
            + Add an idea
          </button>
        }
      >
        {intro}
      </PageHeader>

      {stream.isFirstRun && (
        <Card tone="brand" pad="md">
          <StatusLabel tone="brand">Getting your first ideas</StatusLabel>
          <p className="mt-2 text-[17px] leading-relaxed text-muted">Minions is reading your brand brief for angles. They appear here in a couple of minutes.</p>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Show"
          value={view}
          onChange={setView}
          options={[
            { key: "next", label: "Up next", count: countIdeas(ideas, "next") },
            { key: "written", label: "Written" },
            { key: "aside", label: "Set aside" },
          ]}
        />
        <SearchField label="Search ideas" value={query} onChange={setQuery} />
      </div>

      {stream.draftError && (
        <p role="alert" className="flex items-start justify-between gap-3 rounded-2xl bg-danger/5 p-4 text-[15px] text-danger">
          <span>Couldn&apos;t start writing: {stream.draftError}</span>
          <button type="button" onClick={stream.clearDraftError} className="cursor-pointer text-muted hover:text-ink">Dismiss</button>
        </p>
      )}

      {writing.length > 0 && (
        <section aria-label="Being written" className="space-y-3">
          {writing.map((idea) => (
            <Card key={idea.id} pad="none" className="flex flex-wrap items-center justify-between gap-4 px-7 py-6">
              <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-1.5">
                <StatusLabel tone="brand" className="text-[13px]">Writing now · about 2 minutes</StatusLabel>
                <p className="text-[19px] font-semibold tracking-[-0.015em] text-ink">{titleOf(idea)}</p>
                <div aria-hidden="true" className="mt-1.5 h-1 max-w-[360px] overflow-hidden rounded-full bg-surface-3">
                  <div className="h-1 w-1/3 animate-[indeterminate_1.6s_ease-in-out_infinite] rounded-full bg-brand" />
                </div>
              </div>
              {ideaGroup(idea) === "writing" && (
                <button type="button" onClick={() => void stream.resetClaim(idea.id)} className="cursor-pointer px-1 py-2 text-[15px] text-muted hover:text-ink">
                  Stop
                </button>
              )}
            </Card>
          ))}
        </section>
      )}

      {stream.error && ideas.length === 0 ? (
        <Card tone="well" pad="lg" className="text-center">
          <p className="text-[17px] text-ink">We couldn&apos;t load your ideas.</p>
          <p className="mt-1 text-[15px] text-muted">{stream.error}</p>
        </Card>
      ) : list.length === 0 ? (
        <Card tone="well" pad="none" className="px-6 py-16 text-center">
          <p className="text-[17px] text-muted">{query ? `No ideas match “${query}”.` : EMPTY[view]}</p>
          {query && (
            <button type="button" onClick={() => setQuery("")} className="mt-3 cursor-pointer text-[17px] text-brand hover:underline">Clear the search</button>
          )}
        </Card>
      ) : (
        <ol aria-label={view === "next" ? "Up next" : view === "written" ? "Written" : "Set aside"}>
          {list.map(({ idea, slotAt }, i) => (
            <IdeaRow
              key={idea.id || idea.ideaId}
              idea={idea}
              view={view}
              place={i + 1}
              slotAt={slotAt}
              timezone={tz}
              now={now}
              starting={stream.claimingIds.has(idea.id) || stream.claimingIds.has(idea.ideaId)}
              onOpen={() => setDetailIdea(idea)}
              onWrite={() => void stream.startDraft(idea.id || idea.ideaId)}
              onEdit={() => setEditingIdea(idea)}
              onWriteForDay={() => setSchedulingIdea(idea)}
              onSetAside={() => void patchStatus(idea, "REJECTED", "Set aside. Find it under Set aside.")}
              onBringBack={() => void patchStatus(idea, "REFINED", "Back in Up next.")}
              onDelete={() => setDeleteTarget({ id: idea.id || idea.ideaId, title: titleOf(idea) })}
            />
          ))}
        </ol>
      )}

      {view === "next" && <p className="text-[15px] text-muted">Minions adds new ideas on its own from your brand and sources.</p>}

      {isAddOpen && (
        <AddIdeaDrawer
          onClose={() => setIsAddOpen(false)}
          onCreated={(created) => {
            setIdeas((prev) => [created, ...prev]);
            setIsAddOpen(false);
            toast.show("Idea added.");
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
            toast.show("Idea updated.");
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
          toast.show(`Set: ${titleOf(updated)}`, 5000);
        }}
      />

      <Toast message={toast.message} position="lifted" />
      <HarvestingProgressHUD job={stream.harvestJob} onDismiss={stream.dismissHarvestJob} />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete this idea?"
        description={`“${deleteTarget?.title}” is deleted for good. A post already written from it stays.`}
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

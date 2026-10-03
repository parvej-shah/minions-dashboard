"use client";

import { useEffect, useState } from "react";
import type { DraftingJob } from "@/components/common/DraftingProgressHUD";
import type { HarvestingJob } from "@/components/common/HarvestingProgressHUD";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import type { IdeaItem } from "@/types";
import { useApiResource } from "./useApiResource";

const RUN_POLL_MS = 3500;
const REFRESH_WHILE_RUNNING_MS = 5000;

type Notify = (message: string, durationMs?: number) => void;

export const isIdea = (idea: IdeaItem, id: string) => idea.id === id || idea.ideaId === id;

function withoutId(ids: Set<string>, id: string): Set<string> {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

/**
 * The idea list plus everything that changes it: drafting an idea, releasing a
 * claim, deleting, and the harvest and drafting runs that n8n writes into the
 * database behind this page's back.
 */
export function useIdeaStream(notify: Notify) {
  const {
    data: ideas,
    isLoading,
    error,
    reload,
    setData: setIdeas,
  } = useApiResource<IdeaItem[]>("/api/ideas", [], { errorMessage: "Could not load ideas" });

  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [justClaimedIds, setJustClaimedIds] = useState<Set<string>>(new Set());
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftingJob, setDraftingJob] = useState<DraftingJob | null>(null);
  const [harvestJob, setHarvestJob] = useState<HarvestingJob | null>(null);
  const [isFirstRun, setIsFirstRun] = useState(false);

  // Onboarding starts the first harvest and hands its run id over in the URL, so
  // a new user sees real work in progress instead of an empty screen.
  useEffect(() => {
    const runId = new URLSearchParams(window.location.search).get("onboarding_run");
    if (!runId) return;
    const start = window.setTimeout(() => {
      setIsFirstRun(true);
      setHarvestJob({ runId, startedAt: Date.now() });
    }, 0);
    window.history.replaceState({}, document.title, window.location.pathname);
    return () => window.clearTimeout(start);
  }, []);

  // A failed run has to clear the job too, or its overlay would spin forever.
  useEffect(() => {
    if (!harvestJob) return;
    const poll = async () => {
      try {
        const run = await apiClient.get<{ status?: string }>(`/api/pipeline/runs/${harvestJob.runId}`);
        if (run.status !== "COMPLETED" && run.status !== "FAILED") return;
        await reload();
        setHarvestJob(null);
        if (run.status === "FAILED") notify("We couldn’t find new ideas this time. Please try again.");
      } catch (err) {
        console.warn("Could not read the harvest status; the overlay keeps polling:", err);
      }
    };
    const interval = window.setInterval(poll, RUN_POLL_MS);
    return () => window.clearInterval(interval);
  }, [harvestJob, reload, notify]);

  // n8n writes ideas and drafts straight to the database, so the page only
  // learns about them by asking again.
  const isRunning = Boolean(harvestJob || draftingJob);
  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => void reload(), REFRESH_WHILE_RUNNING_MS);
    return () => window.clearInterval(interval);
  }, [isRunning, reload]);

  // Work finished in another tab, by the scheduler, or while this tab was in the
  // background shows up on return; refetching on focus costs far less than polling.
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") void reload();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [reload]);

  const startDraft = async (ideaId: string) => {
    // Locks the button at once so a double click cannot claim the idea twice.
    setClaimingIds((prev) => new Set(prev).add(ideaId));
    setDraftError(null);

    const idea = ideas.find((item) => isIdea(item, ideaId));
    const resolvedId = idea?.ideaId || idea?.id || ideaId;
    const startedAt = Date.now();

    try {
      const data = await apiClient.post<{ success?: boolean; run_id: string; error?: string; message?: string }>("/api/pipeline/draft", {
        idea_id: resolvedId,
        title: idea?.title || idea?.raw_idea,
        audience: idea?.audience,
        target_trade: idea?.target_trade,
      });
      if (!data.success) throw new Error(data.error || data.message || "Could not start your draft.");

      setDraftingJob({
        ideaId: resolvedId,
        title: idea?.title || idea?.raw_idea || "Untitled Strategic Topic",
        audience: idea?.audience,
        targetTrade: idea?.target_trade,
        startedAt,
        runId: data.run_id,
      });
      setIdeas((prev) => prev.map((item) => (isIdea(item, ideaId) ? { ...item, status: "CLAIMED" } : item)));
      setJustClaimedIds((prev) => new Set(prev).add(ideaId));
    } catch (err) {
      setDraftError(toErrorMessage(err, "Could not start your draft."));
      setDraftingJob(null);
    } finally {
      setClaimingIds((prev) => withoutId(prev, ideaId));
    }
  };

  const resetClaim = async (ideaId: string) => {
    try {
      await apiClient.patch(`/api/ideas/${ideaId}`, { reset_claim: true, status: "REFINED" });
      setIdeas((prev) => prev.map((item) => (isIdea(item, ideaId) ? { ...item, status: "REFINED" } : item)));
      setJustClaimedIds((prev) => withoutId(prev, ideaId));
      notify(`Idea ${ideaId} claim released & returned to REFINED status.`);
    } catch (err) {
      notify(toErrorMessage(err, "Could not release the claim."));
    }
  };

  const deleteIdea = async (ideaId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/ideas/${ideaId}`);
      setIdeas((prev) => prev.filter((item) => !isIdea(item, ideaId)));
      notify(`Idea ${ideaId} deleted successfully.`);
      return true;
    } catch (err) {
      notify(toErrorMessage(err, "Could not delete that idea."), 5000);
      return false;
    }
  };

  return {
    ideas,
    setIdeas,
    isLoading,
    error,
    claimingIds,
    justClaimedIds,
    draftError,
    clearDraftError: () => setDraftError(null),
    draftingJob,
    dismissDraftingJob: () => setDraftingJob(null),
    harvestJob,
    dismissHarvestJob: () => setHarvestJob(null),
    isFirstRun,
    startDraft,
    resetClaim,
    deleteIdea,
  };
}

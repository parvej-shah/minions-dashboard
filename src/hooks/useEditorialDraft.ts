"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { blogUrl, normalizeDomain } from "@/constants/config";
import type { AssetItem, AssetStatus, CoverSpecDTO } from "@/types";
import { queueFor, stepWithin, type QueueFilter } from "@/lib/drafts/queue";
import { applyOptimisticSchedule } from "@/lib/drafts/optimisticSchedule";

export type PublishState = "idle" | "pending" | "success" | "error";

export interface EditorialDraftState {
  assets: AssetItem[];
  isLoading: boolean;
  loadError: string | null;
  activeAsset: AssetItem | null;
  selectedAssetId: string | null;
  selectAsset: (id: string) => void;
  /** Steps through the drafts the Studio's filter shows. */
  nextDraft: (filter: QueueFilter) => void;
  prevDraft: (filter: QueueFilter) => void;

  edited: {
    title: string;
    hook: string;
    body: string;
    linkedin: string;
    facebook: string;
    twitter: string;
    instagram: string;
  };
  setEditedTitle: (v: string) => void;
  setEditedHook: (v: string) => void;
  setEditedBody: (v: string) => void;
  setEditedLinkedin: (v: string) => void;
  setEditedFacebook: (v: string) => void;
  setEditedTwitter: (v: string) => void;
  setEditedInstagram: (v: string) => void;
  isDirty: boolean;

  isSaving: boolean;
  lastSaved: Date | null;
  saveDraft: () => Promise<string>;

  publishState: PublishState;
  publishError: string | null;
  approveAndPublish: () => Promise<string>;
  /** Approve the draft to go out at a local date and time in the workspace's timezone. */
  schedulePost: (date: string, time: string) => Promise<string>;
  /** Send a scheduled post back to review. */
  unschedulePost: () => Promise<string>;
  /** The reviewer posted it to LinkedIn by hand: record it as out. Sends nothing. */
  markPosted: () => Promise<string>;
  /** D18: where this post goes; null returns it to the workspace's channels. */
  setPostChannels: (channels: string[] | null) => Promise<string>;

  isTogglingLive: boolean;
  toggleLiveStatus: () => Promise<string>;

  isDeleting: boolean;
  permanentlyDelete: () => Promise<string>;

  /** Deletes the post on LinkedIn, takes it off the blog and returns the draft to review. */
  isUnpublishingLinkedIn: boolean;
  unpublishFromLinkedIn: () => Promise<string>;

  toggleClaim: (claimId: string) => Promise<void>;

  /** Re-draws the active draft's cover in code, optionally with a reviewer's edit. Returns a toast message. */
  isRenderingCover: boolean;
  rerenderCover: (edit?: CoverEditInput) => Promise<string>;
  /** Reads a draft's points onto its cover (no redraw), so List, Grid and Punch can be offered. False when it failed. */
  checkCoverShape: (assetId: string) => Promise<boolean>;

  /** Drafts a second LinkedIn post of the published draft in the format it did not use, and opens it. */
  isPostingAgain: boolean;
  postAgain: () => Promise<string>;
  /** Posts this published draft again to a channel that refused it; resolves to a message. */
  retryChannel: (channel: "linkedin" | "instagram") => Promise<string>;
  retryingChannel: string | null;
}

export interface CoverEditInput {
  layout?: CoverSpecDTO["layout"];
  headline?: string;
  kicker?: string;
  emphasis?: string;
  art?: "SHAPES" | "DOODLES" | "ICONS" | "NONE";
  art_reroll?: boolean;
  list?: string[];
  grid_labels?: string[];
  punch?: { lines: string[]; checks: string[] };
}

/** The body with its leading cover image line pointed at url (the editor may hold an older one). */
function withCoverUrl(body: string, url: string): string {
  return /^!\[[^\]]*\]\([^)]*\)/.test(body) ? body.replace(/^(!\[[^\]]*\]\()[^)]*(\))/, `$1${url}$2`) : body;
}

const EMPTY_EDITS = { title: "", hook: "", body: "", linkedin: "", facebook: "", twitter: "", instagram: "" };

/**
 * All Editorial Studio data and mutation logic, out of the view layer.
 * Publishing is driven by the real network call, so the UI reports success only
 * once the request has succeeded.
 */
export function useEditorialDraft(
  initialDraftId?: string,
  blogEnabled = true,
  tenantDomain: string | null = null
): EditorialDraftState {
  // The tenant's own blog host. The Studio passes its already-loaded brand
  // settings so this hook does not issue a duplicate /api/brand request.
  // With the blog channel off nothing goes to the blog, so no message names it.
  const blogHost = blogEnabled ? (normalizeDomain(tenantDomain) ?? "").replace(/^https?:\/\//, "") : "";
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const [edited, setEdited] = useState(EMPTY_EDITS);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnpublishingLinkedIn, setIsUnpublishingLinkedIn] = useState(false);
  const [isRenderingCover, setIsRenderingCover] = useState(false);

  const activeAsset = useMemo(
    () => assets.find((a) => a.id === selectedAssetId) ?? assets[0] ?? null,
    [assets, selectedAssetId]
  );

  // Initial load. State starts empty and stays empty on failure: an empty
  // Editorial Studio is a fact the operator needs to see, not something to
  // paper over with sample drafts.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await apiClient.get<AssetItem[]>("/api/assets");
        if (cancelled) return;

        setAssets(data);
        const matched = initialDraftId
          ? data.find((a) => a.id === initialDraftId || a.slug === initialDraftId)
          : undefined;
        // With no link to a draft, open on the first one waiting for review.
        setSelectedAssetId(matched?.id ?? data.find((a) => a.status === "PENDING_REVIEW")?.id ?? data[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) setLoadError(toErrorMessage(err, "Could not load drafts"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialDraftId]);

  /**
   * Poll while any draft is still waiting on its cover image.
   *
   * The asset is saved with `hero_status: PENDING` and the cover is drawn in
   * code just after the draft is written. Without this the cover only appears
   * on a manual browser reload, which reads as the image never arriving.
   *
   * Polling stops as soon as nothing is pending, so a settled studio is idle.
   */
  const hasPendingCover = assets.some((a) => a.hero_status === "PENDING");
  useEffect(() => {
    if (!hasPendingCover) return;

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const data = await apiClient.get<AssetItem[]>("/api/assets");
          setAssets(data);
        } catch {
          // A transient failure should not disturb the editor; the next tick retries.
        }
      })();
    }, 8000);

    return () => window.clearInterval(interval);
  }, [hasPendingCover]);

  // Reset the editor buffers whenever the active draft changes.
  //
  // Adjusted during render rather than in an effect: this is derived state
  // keyed on the active asset, and an effect would render the previous draft's
  // text once before correcting itself.
  const activeAssetId = activeAsset?.id ?? null;
  const [bufferedAssetId, setBufferedAssetId] = useState<string | null>(null);

  if (bufferedAssetId !== activeAssetId) {
    setBufferedAssetId(activeAssetId);
    setEdited(
      activeAsset
        ? {
            title: activeAsset.title,
            hook: activeAsset.hook,
            body: activeAsset.body_content,
            linkedin:
              activeAsset.carousel_active && activeAsset.carousel_caption
                ? activeAsset.carousel_caption
                : activeAsset.variants.linkedin,
            facebook: activeAsset.variants.facebook,
            twitter: activeAsset.variants.twitter,
            instagram: activeAsset.variants.instagram ?? "",
          }
        : EMPTY_EDITS
    );
    setPublishState("idle");
    setPublishError(null);
  }

  // Which draft the buffers hold, for async work that finishes after a switch.
  const bufferedAssetRef = useRef<string | null>(null);
  useEffect(() => {
    bufferedAssetRef.current = bufferedAssetId;
  }, [bufferedAssetId]);

  const activeLinkedinBaseline =
    activeAsset?.carousel_active && activeAsset?.carousel_caption
      ? activeAsset.carousel_caption
      : activeAsset?.variants.linkedin;

  const isDirty = Boolean(
    activeAsset &&
      (edited.title !== activeAsset.title ||
        edited.hook !== activeAsset.hook ||
        edited.body !== activeAsset.body_content ||
        edited.linkedin !== activeLinkedinBaseline ||
        edited.facebook !== activeAsset.variants.facebook ||
        edited.twitter !== activeAsset.variants.twitter ||
        edited.instagram !== (activeAsset.variants.instagram ?? ""))
  );

  const patchActive = useCallback(
    (changes: Partial<AssetItem>) => {
      setAssets((prev) => prev.map((a) => (a.id === activeAssetId ? { ...a, ...changes } : a)));
    },
    [activeAssetId]
  );

  const selectAsset = useCallback((id: string) => setSelectedAssetId(id), []);

  const step = useCallback(
    (delta: number, filter: QueueFilter) => {
      if (!activeAssetId) return;
      const next = stepWithin(queueFor(assets, filter), assets, activeAssetId, delta);
      if (next) setSelectedAssetId(next.id);
    },
    [assets, activeAssetId]
  );

  /**
   * Writes the editor's text to the draft. Throws on failure. True when the
   * server redrew the cover because the edit left it behind (a quote or
   * figure gone, a new title).
   */
  const persistEdits = useCallback(async (): Promise<boolean> => {
    if (!activeAsset) return false;
    const payload = {
      title: edited.title.trim(),
      hook: edited.hook.trim(),
      body_content: edited.body,
      variants: {
        linkedin: edited.linkedin,
        facebook: edited.facebook,
        twitter: edited.twitter,
        instagram: edited.instagram,
      },
    };

    const { asset: saved } = await apiClient.patch<{ asset?: AssetItem }>(`/api/assets/${activeAsset.id}`, payload);
    const redrawn = Boolean(saved?.hero_image_url && saved.hero_image_url !== activeAsset.hero_image_url);
    if (saved && redrawn) {
      // Keep the editor's text, pointed at the new cover, so the next save keeps it.
      setAssets((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
      if (bufferedAssetRef.current === saved.id) setEdited((p) => ({ ...p, body: withCoverUrl(p.body, saved.hero_image_url!) }));
    } else {
      patchActive({
        title: payload.title,
        hook: payload.hook,
        body_content: payload.body_content,
        variants: payload.variants,
      });
    }
    setLastSaved(new Date());
    return redrawn;
  }, [activeAsset, edited, patchActive]);

  const saveDraft = useCallback(async (): Promise<string> => {
    if (!activeAsset || isSaving) return "";
    setIsSaving(true);

    try {
      const redrawn = await persistEdits();
      if (redrawn) return "Changes saved. The cover was redrawn to match them.";
      return activeAsset.status === "PUBLISHED"
        ? blogHost ? `Live blog updated & synced to ${blogHost}` : "Changes saved"
        : "Changes saved";
    } catch (err) {
      return toErrorMessage(err, "Could not save changes");
    } finally {
      setIsSaving(false);
    }
  }, [activeAsset, isSaving, persistEdits, blogHost]);

  const approveAndPublish = useCallback(async (): Promise<string> => {
    if (!activeAsset || publishState === "pending") return "";

    setPublishState("pending");
    setPublishError(null);

    try {
      // What the reviewer approved is what goes out: unsaved edits are saved first.
      if (isDirty) await persistEdits();
      // Mark claims OK and status PUBLISHED so the publisher workflow picks the asset up and broadcasts to LinkedIn/Facebook.
      await apiClient.patch(`/api/assets/${activeAsset.id}`, {
        claims_ok: "Y",
        status: "PUBLISHED",
        published_at: null,
      });
      await apiClient.post("/api/pipeline/publish", { asset_id: activeAsset.id });

      patchActive({
        status: "PUBLISHED",
        claims_ok: "Y",
        doc_url: blogUrl(activeAsset.slug, tenantDomain) ?? "",
        published_at: new Date().toISOString(),
        scheduled_for: null,
      });
      setPublishState("success");
      window.dispatchEvent(new Event("minions-counts-updated"));
      return blogHost ? `Published live to LinkedIn & ${blogHost}` : "Published live to LinkedIn";
    } catch (err) {
      const message = toErrorMessage(err, "Publish failed");
      setPublishState("error");
      setPublishError(message);
      return message;
    }
  }, [activeAsset, publishState, patchActive, tenantDomain, blogHost, isDirty, persistEdits]);

  const schedulePost = useCallback(async (date: string, time: string): Promise<string> => {
    if (!activeAsset || publishState === "pending") return "";
    setPublishState("pending");
    setPublishError(null);

    // Optimistically update the active draft immediately so the UI transitions instantly (0ms)
    const snapshot = { ...activeAsset };
    const optimistic = applyOptimisticSchedule(activeAsset, date, time);
    patchActive({ status: optimistic.status, scheduled_for: optimistic.scheduled_for, claims_ok: "Y" });

    try {
      if (isDirty) await persistEdits();
      const res = await apiClient.post<{ status: AssetStatus; scheduled_for: string }>(
        `/api/assets/${activeAsset.id}/schedule`,
        { date, time }
      );
      patchActive({ status: res.status, scheduled_for: res.scheduled_for, claims_ok: "Y" });
      setPublishState("idle");
      window.dispatchEvent(new Event("minions-counts-updated"));
      return "Scheduled";
    } catch (err) {
      // Roll back on network/server error
      patchActive({ status: snapshot.status, scheduled_for: snapshot.scheduled_for, claims_ok: snapshot.claims_ok });
      const message = toErrorMessage(err, "Could not schedule the post");
      setPublishState("error");
      setPublishError(message);
      return message;
    }
  }, [activeAsset, publishState, patchActive, isDirty, persistEdits]);

  const markPosted = useCallback(async (): Promise<string> => {
    if (!activeAsset || publishState === "pending") return "";
    setPublishState("pending");
    setPublishError(null);
    try {
      // The text they copied is the text on record: unsaved edits are saved first.
      if (isDirty) await persistEdits();
      const res = await apiClient.post<{ published_at: string; linkedin_went_as: "CAROUSEL" | "COVER" | null }>(`/api/assets/${activeAsset.id}/mark-posted`, {});
      patchActive({ status: "PUBLISHED", claims_ok: "Y", published_at: res.published_at, linkedin_published_at: res.published_at, linkedin_went_as: res.linkedin_went_as });
      setPublishState("success");
      window.dispatchEvent(new Event("minions-counts-updated"));
      return "Marked as posted on LinkedIn.";
    } catch (err) {
      const message = toErrorMessage(err, "Could not mark the post as posted");
      setPublishState("error");
      setPublishError(message);
      return message;
    }
  }, [activeAsset, publishState, patchActive, isDirty, persistEdits]);

  const setPostChannels = useCallback(async (channels: string[] | null): Promise<string> => {
    if (!activeAsset) return "";
    const previous = activeAsset.channels;
    patchActive({ channels: channels ?? [] });
    try {
      await apiClient.patch(`/api/assets/${activeAsset.id}`, { channels });
      return "";
    } catch (err) {
      patchActive({ channels: previous });
      return toErrorMessage(err, "Could not change where this post goes");
    }
  }, [activeAsset, patchActive]);

  const unschedulePost = useCallback(async (): Promise<string> => {
    if (!activeAsset || publishState === "pending") return "";
    setPublishState("pending");
    try {
      await apiClient.delete(`/api/assets/${activeAsset.id}/schedule`);
      patchActive({ status: "PENDING_REVIEW", scheduled_for: null });
      setPublishState("idle");
      window.dispatchEvent(new Event("minions-counts-updated"));
      return "Schedule cancelled. The draft is back in review.";
    } catch (err) {
      setPublishState("idle");
      return toErrorMessage(err, "Could not cancel the schedule");
    }
  }, [activeAsset, publishState, patchActive]);

  const toggleLiveStatus = useCallback(async (): Promise<string> => {
    if (!activeAsset) return "";
    setIsTogglingLive(true);

    const nextStatus: AssetStatus =
      activeAsset.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
    const publishedAt = nextStatus === "PUBLISHED" ? new Date().toISOString() : null;

    try {
      await apiClient.patch(`/api/assets/${activeAsset.id}`, {
        status: nextStatus,
        ...(publishedAt ? { published_at: publishedAt } : {}),
      });
      patchActive({ status: nextStatus, published_at: publishedAt });
      setPublishState(nextStatus === "PUBLISHED" ? "success" : "idle");
      window.dispatchEvent(new Event("minions-counts-updated"));

      return nextStatus === "PUBLISHED"
        ? `Post restored and published live${blogHost ? ` on ${blogHost}` : ""}`
        : "Post unpublished and hidden from the public blog";
    } catch (err) {
      return toErrorMessage(err, "Could not change live status");
    } finally {
      setIsTogglingLive(false);
    }
  }, [activeAsset, patchActive, blogHost]);

  const unpublishFromLinkedIn = useCallback(async (): Promise<string> => {
    if (!activeAsset) return "";
    setIsUnpublishingLinkedIn(true);
    try {
      const { asset } = await apiClient.post<{ asset: AssetItem }>(`/api/assets/${activeAsset.id}/unpublish-linkedin`, {});
      patchActive(asset);
      setPublishState("idle");
      window.dispatchEvent(new Event("minions-counts-updated"));
      return "Deleted from LinkedIn. The draft is back in your review queue.";
    } catch (err) {
      return toErrorMessage(err, "Could not unpublish from LinkedIn");
    } finally {
      setIsUnpublishingLinkedIn(false);
    }
  }, [activeAsset, patchActive]);

  const permanentlyDelete = useCallback(async (): Promise<string> => {
    if (!activeAsset) return "";
    setIsDeleting(true);

    try {
      await apiClient.delete(`/api/assets/${activeAsset.id}?mode=permanent`);

      const deletedIndex = assets.findIndex((a) => a.id === activeAsset.id);
      const remaining = assets.filter((a) => a.id !== activeAsset.id);
      setAssets(remaining);
      setSelectedAssetId(
        remaining.length > 0
          ? remaining[Math.max(0, Math.min(deletedIndex, remaining.length - 1))].id
          : null
      );
      window.dispatchEvent(new Event("minions-counts-updated"));
      return "Draft permanently deleted";
    } catch (err) {
      return toErrorMessage(err, "Could not delete draft");
    } finally {
      setIsDeleting(false);
    }
  }, [activeAsset, assets]);

  const toggleClaim = useCallback(
    async (claimId: string) => {
      if (!activeAsset) return;

      const claim = activeAsset.claims.find((c) => c.id === claimId);
      if (!claim) return;

      const nextVerified: "Y" | "N" = claim.verified === "Y" ? "N" : "Y";
      patchActive({
        claims: activeAsset.claims.map((c) =>
          c.id === claimId ? { ...c, verified: nextVerified } : c
        ),
      });

      try {
        await apiClient.patch(`/api/claims/${claimId}`, { verified: nextVerified });
      } catch {
        // Revert on failure so the panel does not show a state the DB rejected.
        patchActive({ claims: activeAsset.claims });
      }
    },
    [activeAsset, patchActive]
  );

  const rerenderCover = useCallback(
    async (edit: CoverEditInput = {}): Promise<string> => {
      if (!activeAsset || isRenderingCover) return "";
      setIsRenderingCover(true);
      try {
        const res = await apiClient.post<{ hero_image_url: string }>(`/api/assets/${activeAsset.id}/cover`, edit);
        // The new picture shows now; the rest of the asset follows from the refresh below.
        setAssets((prev) => prev.map((a) => (a.id === activeAsset.id ? { ...a, hero_image_url: res.hero_image_url } : a)));
        const fresh = await apiClient.get<AssetItem>(`/api/assets/${activeAsset.id}`);
        setAssets((prev) => prev.map((a) => (a.id === fresh.id ? fresh : a)));
        // Keep unsaved edits, but point their cover line at the new image, or
        // the next save would restore the old cover. Only while the editor
        // still holds this draft: if the reviewer moved on mid-draw, the
        // buffers are another draft's and reload from `fresh` on return.
        if (bufferedAssetRef.current === fresh.id) {
          setEdited((p) => ({ ...p, body: withCoverUrl(p.body, res.hero_image_url) }));
        }
        // Say what happened, so a click that changed less than asked is not a mystery.
        const c = fresh.cover;
        if (edit.art && edit.art !== "NONE" && c && !c.art_drawn) {
          return c.layout !== "HEADLINE" && c.layout !== "STATEMENT"
            ? "Cover updated. Only Headline and Statement covers have an illustration."
            : "Cover updated. The illustration was left off: the headline needed the space.";
        }
        return "Cover updated";
      } catch (err) {
        return toErrorMessage(err, "Could not update the cover");
      } finally {
        setIsRenderingCover(false);
      }
    },
    [activeAsset, isRenderingCover]
  );

  const checkCoverShape = useCallback(async (assetId: string): Promise<boolean> => {
    try {
      await apiClient.post(`/api/assets/${assetId}/cover/shape`, {});
      const fresh = await apiClient.get<AssetItem>(`/api/assets/${assetId}`);
      // Only the cover facts change: the reviewer's unsaved edits stay in their buffers.
      setAssets((prev) => prev.map((a) => (a.id === fresh.id ? { ...a, cover: fresh.cover } : a)));
      return true;
    } catch {
      return false;
    }
  }, []);

  const [isPostingAgain, setIsPostingAgain] = useState(false);
  const postAgain = useCallback(async (): Promise<string> => {
    if (!activeAsset || isPostingAgain) return "";
    setIsPostingAgain(true);
    try {
      const res = await apiClient.post<{ created: boolean; asset: AssetItem }>(`/api/assets/${activeAsset.id}/follow-up`);
      setAssets((prev) => [res.asset, ...prev.filter((a) => a.id !== res.asset.id)]);
      setSelectedAssetId(res.asset.id);
      window.dispatchEvent(new Event("minions-counts-updated"));
      const what = res.asset.follow_up_format === "CAROUSEL" ? "carousel" : "cover";
      if (!res.created) return `This draft already has a second post with the ${what}. It is open now.`;
      return `Second post drafted with the ${what}. Review it, then schedule it a few days out.`;
    } catch (err) {
      return toErrorMessage(err, "Could not draft the second post");
    } finally {
      setIsPostingAgain(false);
    }
  }, [activeAsset, isPostingAgain]);

  const [retryingChannel, setRetryingChannel] = useState<string | null>(null);
  const retryChannel = useCallback(async (channel: "linkedin" | "instagram"): Promise<string> => {
    if (!activeAsset || retryingChannel) return "";
    setRetryingChannel(channel);
    try {
      const res = await apiClient.post<{ success: boolean; error?: string; skipped?: string | null }>(`/api/assets/${activeAsset.id}/retry-publish`, { channel });
      const label = channel === "linkedin" ? "LinkedIn" : "Instagram";
      if (!res.success) {
        patchActive({ publish_failures: { ...activeAsset.publish_failures, [channel]: res.error ?? "Could not post." } });
        return `${label} did not take it. ${res.error ?? ""}`.trim();
      }
      const rest = { ...(activeAsset.publish_failures ?? {}) };
      delete rest[channel];
      patchActive({ publish_failures: rest });
      window.dispatchEvent(new Event("minions-counts-updated"));
      return res.skipped === "already_posted" ? `Already on ${label}.` : res.skipped ? `${label} is not connected or is switched off in Settings.` : `Posted to ${label}.`;
    } catch (err) {
      return toErrorMessage(err, "Could not post again");
    } finally {
      setRetryingChannel(null);
    }
  }, [activeAsset, retryingChannel, patchActive]);

  return {
    assets,
    isLoading,
    loadError,
    activeAsset,
    selectedAssetId: activeAssetId,
    selectAsset,
    nextDraft: (filter) => step(1, filter),
    prevDraft: (filter) => step(-1, filter),

    edited,
    setEditedTitle: (v) => setEdited((p) => ({ ...p, title: v })),
    setEditedHook: (v) => setEdited((p) => ({ ...p, hook: v })),
    setEditedBody: (v) => setEdited((p) => ({ ...p, body: v })),
    setEditedLinkedin: (v) => setEdited((p) => ({ ...p, linkedin: v })),
    setEditedFacebook: (v) => setEdited((p) => ({ ...p, facebook: v })),
    setEditedTwitter: (v) => setEdited((p) => ({ ...p, twitter: v })),
    setEditedInstagram: (v) => setEdited((p) => ({ ...p, instagram: v })),
    isDirty,

    isSaving,
    lastSaved,
    saveDraft,

    publishState,
    publishError,
    approveAndPublish,
    schedulePost,
    unschedulePost,
    markPosted,
    setPostChannels,

    isTogglingLive,
    toggleLiveStatus,

    isDeleting,
    permanentlyDelete,

    isUnpublishingLinkedIn,
    unpublishFromLinkedIn,

    toggleClaim,

    isRenderingCover,
    rerenderCover,
    checkCoverShape,

    isPostingAgain,
    postAgain,
    retryChannel,
    retryingChannel,
  };
}

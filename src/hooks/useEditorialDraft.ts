"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { blogUrl, normalizeDomain } from "@/constants/config";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import type { AssetItem, AssetStatus, CoverSpecDTO } from "@/types";

export type PublishState = "idle" | "pending" | "success" | "error";

export interface EditorialDraftState {
  assets: AssetItem[];
  isLoading: boolean;
  loadError: string | null;
  activeAsset: AssetItem | null;
  selectedAssetId: string | null;
  selectAsset: (id: string) => void;
  nextDraft: () => void;
  prevDraft: () => void;

  edited: {
    title: string;
    hook: string;
    body: string;
    linkedin: string;
    facebook: string;
    twitter: string;
  };
  setEditedTitle: (v: string) => void;
  setEditedHook: (v: string) => void;
  setEditedBody: (v: string) => void;
  setEditedLinkedin: (v: string) => void;
  setEditedFacebook: (v: string) => void;
  setEditedTwitter: (v: string) => void;
  isDirty: boolean;

  isSaving: boolean;
  lastSaved: Date | null;
  saveDraft: () => Promise<string>;

  publishState: PublishState;
  publishError: string | null;
  approveAndPublish: () => Promise<string>;

  isTogglingLive: boolean;
  toggleLiveStatus: () => Promise<string>;

  isDeleting: boolean;
  permanentlyDelete: () => Promise<string>;

  toggleClaim: (claimId: string) => Promise<void>;

  /** Re-draws the active draft's cover in code, optionally with a reviewer's edit. Returns a toast message. */
  isRenderingCover: boolean;
  rerenderCover: (edit?: CoverEditInput) => Promise<string>;
}

export interface CoverEditInput {
  layout?: CoverSpecDTO["layout"];
  headline?: string;
  kicker?: string;
  emphasis?: string;
}

/** The body with its leading cover image line pointed at url (the editor may hold an older one). */
function withCoverUrl(body: string, url: string): string {
  return /^!\[[^\]]*\]\([^)]*\)/.test(body) ? body.replace(/^(!\[[^\]]*\]\()[^)]*(\))/, `$1${url}$2`) : body;
}

const EMPTY_EDITS = { title: "", hook: "", body: "", linkedin: "", facebook: "", twitter: "" };

/**
 * All Editorial Studio data and mutation logic, out of the view layer.
 *
 * Notably, publishing is now driven by the actual network call: the studio was
 * previously advancing through four decorative phases on 800/1600/2400ms
 * timers and firing the real request inside the last one, so the UI reported
 * success before — and regardless of whether — the request succeeded.
 */
export function useEditorialDraft(initialDraftId?: string): EditorialDraftState {
  // The tenant's own blog host. Without it every optimistic doc_url and the
  // publish confirmation named getminions.ai, whoever owned the post.
  const { brandSettings } = useBrandSettings();
  const tenantDomain = brandSettings?.company_domain || null;
  const blogHost = (normalizeDomain(tenantDomain) ?? "").replace(/^https?:\/\//, "");
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
        setSelectedAssetId(matched?.id ?? data[0]?.id ?? null);
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
   * Cover generation runs outside the drafting workflow now (it was ~43s of a
   * ~98s run), so the asset is saved with `hero_status: PENDING` and filled in
   * a minute or so later by 04_hero_image. Without this the cover only appears
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
            linkedin: activeAsset.variants.linkedin,
            facebook: activeAsset.variants.facebook,
            twitter: activeAsset.variants.twitter,
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

  const isDirty = Boolean(
    activeAsset &&
      (edited.title !== activeAsset.title ||
        edited.hook !== activeAsset.hook ||
        edited.body !== activeAsset.body_content ||
        edited.linkedin !== activeAsset.variants.linkedin ||
        edited.facebook !== activeAsset.variants.facebook ||
        edited.twitter !== activeAsset.variants.twitter)
  );

  const patchActive = useCallback(
    (changes: Partial<AssetItem>) => {
      setAssets((prev) => prev.map((a) => (a.id === activeAssetId ? { ...a, ...changes } : a)));
    },
    [activeAssetId]
  );

  const selectAsset = useCallback((id: string) => setSelectedAssetId(id), []);

  const step = useCallback(
    (delta: number) => {
      if (assets.length <= 1 || !activeAssetId) return;
      const index = assets.findIndex((a) => a.id === activeAssetId);
      const next = (index + delta + assets.length) % assets.length;
      setSelectedAssetId(assets[next].id);
    },
    [assets, activeAssetId]
  );

  const saveDraft = useCallback(async (): Promise<string> => {
    if (!activeAsset || isSaving) return "";
    setIsSaving(true);

    const payload = {
      title: edited.title.trim(),
      hook: edited.hook.trim(),
      body_content: edited.body,
      variants: {
        linkedin: edited.linkedin,
        facebook: edited.facebook,
        twitter: edited.twitter,
      },
    };

    try {
      await apiClient.patch(`/api/assets/${activeAsset.id}`, payload);
      patchActive({
        title: payload.title,
        hook: payload.hook,
        body_content: payload.body_content,
        variants: payload.variants,
      });
      setLastSaved(new Date());
      return activeAsset.status === "PUBLISHED"
        ? blogHost ? `Live blog updated & synced to ${blogHost}` : "Changes saved"
        : "Changes saved";
    } catch (err) {
      return toErrorMessage(err, "Could not save changes");
    } finally {
      setIsSaving(false);
    }
  }, [activeAsset, isSaving, edited, patchActive, blogHost]);

  const approveAndPublish = useCallback(async (): Promise<string> => {
    if (!activeAsset || publishState === "pending") return "";

    setPublishState("pending");
    setPublishError(null);

    try {
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
  }, [activeAsset, publishState, patchActive, tenantDomain, blogHost]);

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
        const fresh = await apiClient.get<AssetItem>(`/api/assets/${activeAsset.id}`);
        setAssets((prev) => prev.map((a) => (a.id === fresh.id ? fresh : a)));
        // Keep unsaved edits, but point their cover line at the new image, or
        // the next save would restore the old cover. Only while the editor
        // still holds this draft: if the reviewer moved on mid-draw, the
        // buffers are another draft's and reload from `fresh` on return.
        if (bufferedAssetRef.current === fresh.id) {
          setEdited((p) => ({ ...p, body: withCoverUrl(p.body, res.hero_image_url) }));
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

  return {
    assets,
    isLoading,
    loadError,
    activeAsset,
    selectedAssetId: activeAssetId,
    selectAsset,
    nextDraft: () => step(1),
    prevDraft: () => step(-1),

    edited,
    setEditedTitle: (v) => setEdited((p) => ({ ...p, title: v })),
    setEditedHook: (v) => setEdited((p) => ({ ...p, hook: v })),
    setEditedBody: (v) => setEdited((p) => ({ ...p, body: v })),
    setEditedLinkedin: (v) => setEdited((p) => ({ ...p, linkedin: v })),
    setEditedFacebook: (v) => setEdited((p) => ({ ...p, facebook: v })),
    setEditedTwitter: (v) => setEdited((p) => ({ ...p, twitter: v })),
    isDirty,

    isSaving,
    lastSaved,
    saveDraft,

    publishState,
    publishError,
    approveAndPublish,

    isTogglingLive,
    toggleLiveStatus,

    isDeleting,
    permanentlyDelete,

    toggleClaim,

    isRenderingCover,
    rerenderCover,
  };
}

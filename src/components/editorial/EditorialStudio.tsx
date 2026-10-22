"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, FileText } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton, SkeletonGroup } from "@/components/ui/Skeleton";
import { useEditorialDraft } from "@/hooks/useEditorialDraft";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useToast } from "@/hooks/useToast";
import { useChannelSummary } from "@/hooks/useChannelSummary";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { normalizeDomain } from "@/constants/config";
import QueueRibbon, { type QueueFilter } from "./QueueRibbon";
import DraftHeader from "./DraftHeader";
import CoverImageCard from "./CoverImageCard";
import CarouselCard from "./CarouselCard";
import ArticleEditor, { type EditorMode } from "./ArticleEditor";
import SocialVariantTabs, { type SocialTab } from "./social/SocialVariantTabs";
import ReviewDock from "./ReviewDock";
import ClaimsGate from "./ClaimsGate";
import MobileActionBar from "./MobileActionBar";
import DraftChecks from "./DraftChecks";
import DraftScheduleModal from "@/components/schedule/DraftScheduleModal";
import { plainReviewNotes } from "@/lib/drafts/plainNotes";
import { postGoesTo } from "@/constants/postChannels";

function EditorialStudioSkeleton() {
  return (
    <SkeletonGroup label="Loading Editorial Studio" className="mx-auto max-w-[1400px] space-y-6 pb-32 lg:pb-16">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-16 min-w-64 rounded-xl" />)}
        </div>
      </section>

      <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-2xl space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-3 rounded-2xl border-2 border-line bg-canvas p-4">
              <Skeleton className="h-5 w-64 max-w-full" />
              <Skeleton className="h-4 w-72 max-w-full" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            </div>
            <div className="flex gap-2 overflow-hidden">
              {[0, 1, 2].map((item) => <Skeleton key={item} className="aspect-[4/5] w-[70%] shrink-0 rounded-lg sm:w-[220px]" />)}
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
          </section>
          <section className="space-y-4 rounded-3xl border-2 border-line bg-surface p-4 sm:p-5">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <div className="flex flex-wrap gap-2"><Skeleton className="h-11 w-28 rounded-xl" /><Skeleton className="h-11 w-28 rounded-xl" /></div>
            <div className="space-y-4 rounded-2xl border border-line bg-canvas p-4">
              <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-36" /></div>
              <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
              <Skeleton className="mx-auto aspect-[4/5] w-full max-w-[420px] rounded-xl" />
            </div>
          </section>
          <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
            <Skeleton className="h-5 w-28" />
            <div className="flex flex-col gap-4 sm:flex-row"><Skeleton className="aspect-[4/5] w-full rounded-xl sm:w-[280px]" /><Skeleton className="h-36 w-full rounded-xl" /></div>
          </section>
        </div>
        <aside className="space-y-6 lg:col-span-4">
          <section className="space-y-4 rounded-2xl border-2 border-b-4 border-line bg-surface p-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </section>
          <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </section>
        </aside>
      </div>
    </SkeletonGroup>
  );
}

export interface EditorialStudioProps {
  initialDraftId?: string;
  isStandaloneRoute?: boolean;
  /** Opens the drafting schedule on load (`?schedule=1`, used by the Mission Control Schedule button). */
  openSchedule?: boolean;
}

/**
 * Editorial Studio: composes the review queue, the article editor, the social
 * staging cards, and the decision dock.
 *
 * All data loading and mutation lives in useEditorialDraft; this component
 * wires those to the view.
 */
export default function EditorialStudio({
  initialDraftId,
  isStandaloneRoute = false,
  openSchedule = false,
}: EditorialStudioProps) {
  const channels = useChannelSummary();
  const { brandSettings: studioBrand } = useBrandSettings();
  const draft = useEditorialDraft(
    initialDraftId,
    channels?.blog ?? true,
    studioBrand?.company_domain ?? null
  );
  const { copiedKey, copy } = useCopyToClipboard(2200);
  const toast = useToast(3000);
  // Confirmation copy names the tenant's own blog, not this company's.
  const studioBlogHost =
    (normalizeDomain(studioBrand?.company_domain) ?? "your blog").replace(/^https?:\/\//, "") +
    (studioBrand?.company_domain ? "/blog" : "");

  const [scheduleOpen, setScheduleOpen] = useState(openSchedule);
  const closeSchedule = () => {
    setScheduleOpen(false);
    // Drop ?schedule=1 so a reload doesn't reopen it.
    const url = new URL(window.location.href);
    if (url.searchParams.has("schedule")) {
      url.searchParams.delete("schedule");
      window.history.replaceState(null, "", url);
    }
  };
  const scheduleButton = (
    <button
      type="button"
      onClick={() => setScheduleOpen(true)}
      className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-canvas px-3 text-xs font-semibold text-ink transition-colors hover:border-brand/50 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <CalendarClock className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" /> Schedule
    </button>
  );
  const scheduleModal = <DraftScheduleModal isOpen={scheduleOpen} onClose={closeSchedule} />;

  const [listFilter, setListFilter] = useState<QueueFilter>("ALL");
  const [editorMode, setEditorMode] = useState<EditorMode>("preview");
  const [socialTab, setSocialTab] = useState<SocialTab>("LINKEDIN");
  // Whether LinkedIn gets this draft's carousel, as the carousel card last loaded or set it.
  const [carouselOn, setCarouselOn] = useState<{ id: string; on: boolean } | null>(null);
  // A post limited to some channels (D18) previews only those.
  const goesTo = (key: string) => postGoesTo(draft.activeAsset?.channels, key);
  const enabledSocialTabs = {
    LINKEDIN: (channels?.linkedin ?? true) && goesTo("linkedin"),
    FACEBOOK: (channels?.facebook ?? true) && goesTo("facebook"),
    TWITTER: (channels?.x ?? true) && goesTo("x"),
  };
  const blogEnabled = (channels?.blog ?? true) && goesTo("blog");
  // With the carousel on, LinkedIn posts the carousel and the text written for it
  // (both in the carousel card), never the LinkedIn text or the cover below.
  const linkedinGetsCarousel = enabledSocialTabs.LINKEDIN && carouselOn?.id === draft.activeAsset?.id && carouselOn?.on === true;
  const previewTabs = { ...enabledSocialTabs, LINKEDIN: enabledSocialTabs.LINKEDIN && !linkedinGetsCarousel };
  const anySocialChannelActive = previewTabs.LINKEDIN || previewTabs.FACEBOOK || previewTabs.TWITTER;
  const coverGoesOut = !linkedinGetsCarousel || blogEnabled || enabledSocialTabs.FACEBOOK || enabledSocialTabs.TWITTER;

  // If the selected tab isn't one this tenant has connected (e.g. defaulted
  // to LinkedIn but only Facebook is on), display the first one that is,
  // without needing an effect to rewrite the underlying state.
  const firstActiveSocialTab =
    (Object.keys(previewTabs) as SocialTab[]).find((t) => previewTabs[t]) ?? "LINKEDIN";
  const displayedSocialTab = previewTabs[socialTab] ? socialTab : firstActiveSocialTab;
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [toggleLiveConfirmOpen, setToggleLiveConfirmOpen] = useState(false);

  const { activeAsset, assets, edited } = draft;

  const currentAssetIndex = activeAsset
    ? assets.findIndex((a) => a.id === activeAsset.id)
    : -1;

  const wordCount = useMemo(
    () => edited.body.trim().split(/\s+/).filter(Boolean).length,
    [edited.body]
  );
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const totalClaims = activeAsset?.claims.length ?? 0;
  const verifiedClaimsCount =
    activeAsset?.claims.filter((c) => c.verified === "Y").length ?? 0;
  const allClaimsVerified = totalClaims > 0 && verifiedClaimsCount === totalClaims;
  const reviewNotes = useMemo(
    () => (activeAsset ? plainReviewNotes(activeAsset) : []),
    [activeAsset]
  );

  const handleSave = async () => {
    const message = await draft.saveDraft();
    if (message) toast.show(message);
    setIsEditingSocial(false);
  };

  const handlePublish = async () => {
    const message = await draft.approveAndPublish();
    if (message) toast.show(message);
  };

  const handleSchedule = async (date: string, time: string): Promise<boolean> => {
    const message = await draft.schedulePost(date, time);
    if (message !== "Scheduled") {
      if (message) toast.show(message);
      return false;
    }
    toast.show("Scheduled. It goes out at the time you picked.");
    return true;
  };

  const handleUnschedule = async () => {
    const message = await draft.unschedulePost();
    if (message) toast.show(message);
  };

  const handleToggleLive = async () => {
    const message = await draft.toggleLiveStatus();
    setToggleLiveConfirmOpen(false);
    if (message) toast.show(message);
  };

  const handleDelete = async () => {
    const message = await draft.permanentlyDelete();
    setDeleteConfirmOpen(false);
    if (message) toast.show(message);
  };

  // Keyboard shortcuts: ⌘S save, ⌘Enter publish, [ / ] navigate, 1/2/3 view mode.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void handleSave();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (draft.publishState !== "pending" && activeAsset?.status !== "PUBLISHED") {
          void handlePublish();
        }
        return;
      }

      if (isInput) return;

      if (e.key === "[" || (e.altKey && e.key === "ArrowLeft")) {
        e.preventDefault();
        draft.prevDraft();
      } else if (e.key === "]" || (e.altKey && e.key === "ArrowRight")) {
        e.preventDefault();
        draft.nextDraft();
      } else if (e.key === "1") {
        setEditorMode("preview");
      } else if (e.key === "2") {
        setEditorMode("edit");
      } else if (e.key === "3") {
        setEditorMode("split");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Keep the spotlighted queue card scrolled into view.
  useEffect(() => {
    if (!draft.selectedAssetId) return;
    document
      .getElementById(`queue-card-${draft.selectedAssetId}`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [draft.selectedAssetId]);

  if (draft.isLoading) return <EditorialStudioSkeleton />;

  if (!activeAsset) {
    return (
      <div className="max-w-[1400px] mx-auto py-10">
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title={draft.loadError ? "Could not load drafts" : "No drafts in the queue"}
          description={
            draft.loadError ??
            "Nothing is waiting for review. Run the harvester and drafting pipeline from the Ideas page to generate one."
          }
          action={scheduleButton}
        />
        {scheduleModal}
      </div>
    );
  }

  const statusLabel = draft.isSaving ? null : toast.message;

  const socialVariants = anySocialChannelActive && (
    <SocialVariantTabs
      activeAsset={activeAsset}
      socialTab={displayedSocialTab}
      setSocialTab={setSocialTab}
      isEditingSocial={isEditingSocial}
      setIsEditingSocial={setIsEditingSocial}
      isSaving={draft.isSaving}
      edited={edited}
      setEditedLinkedin={draft.setEditedLinkedin}
      setEditedFacebook={draft.setEditedFacebook}
      setEditedTwitter={draft.setEditedTwitter}
      onSave={handleSave}
      onCopy={copy}
      copiedKey={copiedKey}
      enabledTabs={previewTabs}
      blogEnabled={blogEnabled}
      showCoverLink={coverGoesOut}
    />
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-32 lg:pb-16">
      <QueueRibbon
        assets={assets}
        activeAsset={activeAsset}
        listFilter={listFilter}
        setListFilter={setListFilter}
        currentAssetIndex={currentAssetIndex}
        onSelect={draft.selectAsset}
        onPrev={draft.prevDraft}
        onNext={draft.nextDraft}
        action={scheduleButton}
      />

      <DraftHeader
        activeAsset={activeAsset}
        title={edited.title}
        currentAssetIndex={currentAssetIndex}
        totalDrafts={assets.length}
        isStandaloneRoute={isStandaloneRoute}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {enabledSocialTabs.LINKEDIN && activeAsset.follow_up_format !== "COVER" && (
            <CarouselCard key={activeAsset.id} activeAsset={activeAsset} onMessage={toast.show} onCarouselOn={(on) => setCarouselOn({ id: activeAsset.id, on })} />
          )}
          {socialVariants}

          {/* Hidden only when nothing posts it: LinkedIn gets the carousel and no other channel is on. */}
          {coverGoesOut && (
            <CoverImageCard activeAsset={activeAsset} isRendering={draft.isRenderingCover} onRerender={draft.rerenderCover} onMessage={toast.show} />
          )}

          {/* Blog off: the article is never published, so it is not shown for
              editing; it stays the source the cover and carousel are made from. */}
          {blogEnabled && (
            <ArticleEditor
              activeAsset={activeAsset}
              edited={edited}
              setEditedTitle={draft.setEditedTitle}
              setEditedHook={draft.setEditedHook}
              setEditedBody={draft.setEditedBody}
              editorMode={editorMode}
              setEditorMode={setEditorMode}
              isDirty={draft.isDirty}
              isSaving={draft.isSaving}
                statusLabel={statusLabel}
              onSave={handleSave}
              onCopy={copy}
              copiedKey={copiedKey}
              wordCount={wordCount}
              readingTimeMinutes={readingTimeMinutes}
            />
          )}

        </div>

        <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-6">
          <div className="order-1"><DraftChecks notes={reviewNotes} /></div>
          {activeAsset.claims.length > 0 && (
            <div className="order-2 lg:order-3">
              <ClaimsGate
                activeAsset={activeAsset}
                verifiedClaimsCount={verifiedClaimsCount}
                totalClaims={totalClaims}
                allClaimsVerified={allClaimsVerified}
                onToggleClaim={draft.toggleClaim}
              />
            </div>
          )}
          <div id="editorial-publishing-options" tabIndex={-1} className="order-3 scroll-mt-6 outline-none lg:order-2">
            <ReviewDock
              activeAsset={activeAsset}
              isDirty={draft.isDirty}
              publishState={draft.publishState}
              onPublish={handlePublish}
              onSchedule={handleSchedule}
              onUnschedule={handleUnschedule}
              workspaceChannels={channels}
              onSetChannels={(c) => void draft.setPostChannels(c).then((m) => m && toast.show(m))}
              onMessage={toast.show}
              setToggleLiveConfirmOpen={setToggleLiveConfirmOpen}
              setDeleteConfirmOpen={setDeleteConfirmOpen}
              blogEnabled={blogEnabled}
              blogHost={(normalizeDomain(studioBrand?.company_domain) ?? "").replace(/^https?:\/\//, "")}
              onPostAgain={() => void draft.postAgain().then((m) => m && toast.show(m))}
              isPostingAgain={draft.isPostingAgain}
            />
          </div>
        </div>
      </div>

      <MobileActionBar
        activeAsset={activeAsset}
        isDirty={draft.isDirty}
        isSaving={draft.isSaving}
        onSave={handleSave}
        onReviewPublish={() => {
          const target = document.getElementById("editorial-publishing-options");
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
          target?.focus({ preventScroll: true });
        }}
      />

      <Toast
        message={toast.message}
        variant={draft.publishState === "error" ? "error" : "success"}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Permanently Delete Asset"
        description={`⚠️ Are you sure you want to permanently delete ${activeAsset.id}? This will permanently remove the blog post, draft content, and all claim verifications from the database.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={draft.isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={toggleLiveConfirmOpen}
        title={activeAsset.status === "PUBLISHED" ? "Unpublish Post" : "Republish Post Live"}
        description={
          activeAsset.status === "PUBLISHED"
            ? `Are you sure you want to unpublish "${activeAsset.title}"? It will immediately be taken down from ${studioBlogHost} and returned to the review queue without deleting any content.`
            : `Are you sure you want to republish "${activeAsset.title}" live to ${studioBlogHost}?`
        }
        confirmLabel={activeAsset.status === "PUBLISHED" ? "Unpublish Post" : "Republish Live"}
        cancelLabel="Cancel"
        variant={activeAsset.status === "PUBLISHED" ? "warning" : "primary"}
        isLoading={draft.isTogglingLive}
        onConfirm={handleToggleLive}
        onClose={() => setToggleLiveConfirmOpen(false)}
      />

      {scheduleModal}
    </div>
  );
}

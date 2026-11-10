"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import CoverImageCard from "./CoverImageCard";
import CarouselCard from "./CarouselCard";
import ArticleEditor, { type EditorMode } from "./ArticleEditor";
import SocialVariantTabs, { type SocialTab } from "./social/SocialVariantTabs";
import ReviewDecision from "./ReviewDecision";
import ApprovalUpdateAsk from "@/components/pulse/ApprovalUpdateAsk";
import { useWorkspaceTimezone } from "./SchedulePicker";
import ClaimsGate from "./ClaimsGate";
import MobileActionBar from "./MobileActionBar";
import DraftChecks, { checksSummary } from "./DraftChecks";
import DraftScheduleModal from "@/components/schedule/DraftScheduleModal";
import LinkedInModal from "@/components/distribution/LinkedInModal";
import { plainReviewNotes } from "@/lib/drafts/plainNotes";
import { postGoesTo } from "@/constants/postChannels";
import { liveLinks } from "@/lib/drafts/liveLinks";
import { nextPending, queueFor, type QueueFilter } from "@/lib/drafts/queue";
import { statusLine } from "@/lib/posts/library";
import { DEFAULT_TIMEZONE } from "@/constants/config";
import { buttonStyles } from "@/components/ui/Button";
import { StatusLabel } from "@/components/ui/Text";

function EditorialStudioSkeleton() {
  return (
    <SkeletonGroup label="Loading the post" className="mx-auto max-w-[1040px] space-y-8 pb-32 lg:pb-16">
      <div className="flex justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-40" /><Skeleton className="h-5 w-16" /></div>
      <div className="space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-3/4" /></div>
      <div className="flex flex-wrap items-start gap-12">
        <Skeleton className="h-[560px] min-w-0 flex-[999_1_520px] rounded-[28px]" />
        <div className="min-w-0 flex-[1_1_300px] space-y-5">
          <Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-16" /><Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-full rounded-full" /><Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </SkeletonGroup>
  );
}

export interface EditorialStudioProps {
  initialDraftId?: string;
  /** Opens the drafting schedule on load (`?schedule=1`). */
  openSchedule?: boolean;
  /** Opens the LinkedIn channel on load (`?linkedin=1`, where LinkedIn's sign-in comes back to). */
  openLinkedIn?: boolean;
}

/**
 * The Review screen (task 24): one post on the left, the one decision about it
 * on the right, sticky.
 *
 * All data loading and mutation lives in useEditorialDraft; this component
 * wires those to the view.
 */
export default function EditorialStudio({
  initialDraftId,
  openSchedule = false,
  openLinkedIn = false,
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

  // The schedule and LinkedIn open as modals over the Studio, from the buttons
  // in the queue bar or a ?schedule=1 / ?linkedin=1 link.
  const [panel, setPanel] = useState<"schedule" | "linkedin" | null>(openSchedule ? "schedule" : openLinkedIn ? "linkedin" : null);
  const closePanel = () => {
    setPanel(null);
    // Drop the opening param so a reload doesn't reopen it.
    const url = new URL(window.location.href);
    if (url.searchParams.has("schedule") || url.searchParams.has("linkedin")) {
      url.searchParams.delete("schedule");
      url.searchParams.delete("linkedin");
      window.history.replaceState(null, "", url);
    }
  };
  const panelButton = buttonStyles({ variant: "secondary" });
  const panelButtons = (
    <>
      <button type="button" onClick={() => setPanel("linkedin")} className={panelButton}>
        <span className="font-bold text-[#0A66C2]" aria-hidden="true">in</span> Connect LinkedIn
      </button>
      <button type="button" onClick={() => setPanel("schedule")} className={panelButton}>
        <CalendarClock className="h-4 w-4 text-brand" aria-hidden="true" /> Posting schedule
      </button>
    </>
  );
  const panelModals = (
    <>
      <DraftScheduleModal isOpen={panel === "schedule"} onClose={closePanel} />
      <LinkedInModal isOpen={panel === "linkedin"} onClose={closePanel} />
    </>
  );

  const [askFor, setAskFor] = useState<string | null>(null);
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
  const [unpublishLinkedInConfirmOpen, setUnpublishLinkedInConfirmOpen] = useState(false);

  const { activeAsset, assets, edited } = draft;

  const pending = queueFor(assets, "PENDING_REVIEW");
  // [ and ] step through the waiting posts while on one, else through all of them.
  const listFilter: QueueFilter = activeAsset?.status === "PENDING_REVIEW" ? "PENDING_REVIEW" : "ALL";
  const timezone = useWorkspaceTimezone() ?? DEFAULT_TIMEZONE;
  const takenTimes = useMemo(
    () => assets.filter((a) => a.status === "SCHEDULED" && a.scheduled_for && a.id !== activeAsset?.id).map((a) => a.scheduled_for!),
    [assets, activeAsset?.id]
  );
  const pendingIndex = activeAsset ? pending.findIndex((a) => a.id === activeAsset.id) : -1;
  const nextDraft = activeAsset ? nextPending(assets, activeAsset.id) : null;
  const nextToReview = nextDraft
    ? { left: pending.filter((a) => a.id !== activeAsset?.id).length, open: () => draft.selectAsset(nextDraft.id) }
    : null;

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
    setAskFor(activeAsset?.id ?? null);
    return true;
  };

  const handleMarkPosted = async () => {
    const message = await draft.markPosted();
    if (message) toast.show(message);
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

  const handleUnpublishLinkedIn = async () => {
    const message = await draft.unpublishFromLinkedIn();
    setUnpublishLinkedInConfirmOpen(false);
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
        draft.prevDraft(listFilter);
      } else if (e.key === "]" || (e.altKey && e.key === "ArrowRight")) {
        e.preventDefault();
        draft.nextDraft(listFilter);
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

  if (draft.isLoading) return <EditorialStudioSkeleton />;

  if (!activeAsset) {
    return (
      <div className="mx-auto max-w-[1040px] py-10">
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title={draft.loadError ? "We couldn't load your posts" : "No posts yet"}
          description={
            draft.loadError ??
            "Nothing is waiting for you. Pick an idea on the Ideas page and Minions writes the post for you to review."
          }
          action={panelButtons}
        />
        {panelModals}
      </div>
    );
  }

  const statusLabel = draft.isSaving ? null : toast.message;
  const isPublished = activeAsset.status === "PUBLISHED";
  const wentToLinkedIn = Boolean(activeAsset.linkedin_url || activeAsset.linkedin_went_as);

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

  const status = statusLine(activeAsset, timezone);
  const waitingLabel =
    pendingIndex >= 0 ? `Post ${pendingIndex + 1} of ${pending.length} waiting` : pending.length > 0 ? `${pending.length} waiting for you` : "";
  const unchecked = activeAsset.claims.filter((c) => c.verified !== "Y").length;
  const seriousNotes = reviewNotes.filter((n) => n.tone !== "tip").length;
  // "Edit text": the article when the blog is on, else the social post.
  const startEditing = () => {
    if (blogEnabled) setEditorMode("edit");
    else setIsEditingSocial(true);
    document.getElementById(blogEnabled ? "post-editor" : "post-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-[1040px] space-y-8 pb-32 lg:pb-16">
      <nav aria-label="Posts" className="flex flex-wrap items-center justify-between gap-3 text-[15px]">
        <Link href="/posts" className="text-brand hover:underline">‹ Posts</Link>
        {waitingLabel && <p className="text-muted">{waitingLabel}</p>}
        {nextDraft ? (
          <button type="button" onClick={() => draft.selectAsset(nextDraft.id)} className="cursor-pointer text-brand hover:underline">
            Next ›
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
      </nav>

      <header className="space-y-2">
        <StatusLabel tone={status.tone}>{status.text}</StatusLabel>
        <h1 className="break-words text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[40px]">{edited.title}</h1>
      </header>

      <div className="flex flex-wrap items-start gap-12">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-8">
          <div id="post-preview" className="scroll-mt-24">{socialVariants}</div>
          {enabledSocialTabs.LINKEDIN && activeAsset.follow_up_format !== "COVER" && (
            <CarouselCard key={activeAsset.id} activeAsset={activeAsset} onMessage={toast.show} onCarouselOn={(on) => setCarouselOn({ id: activeAsset.id, on })} />
          )}

          {/* Hidden only when nothing posts it: LinkedIn gets the carousel and no other channel is on. */}
          {coverGoesOut && (
            <CoverImageCard activeAsset={activeAsset} isRendering={draft.isRenderingCover} onRerender={draft.rerenderCover} onCheckShape={draft.checkCoverShape} onMessage={toast.show} />
          )}

          {/* Blog off: the article is never published, so it is not shown for
              editing; it stays the source the cover and carousel are made from. */}
          {blogEnabled && (
            <div id="post-editor" className="scroll-mt-24">
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
            </div>
          )}
        </div>

        <aside
          id="editorial-publishing-options"
          tabIndex={-1}
          aria-label="Decision"
          className="min-w-0 flex-[1_1_300px] scroll-mt-24 outline-none lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]"
        >
          <ReviewDecision
            activeAsset={activeAsset}
            isDirty={draft.isDirty}
            publishState={draft.publishState}
            onPublish={handlePublish}
            onSchedule={handleSchedule}
            onUnschedule={handleUnschedule}
            onMarkPosted={handleMarkPosted}
            onEdit={startEditing}
            takenTimes={takenTimes}
            workspaceChannels={channels}
            onSetChannels={(c) => void draft.setPostChannels(c).then((m) => m && toast.show(m))}
            onMessage={toast.show}
            setToggleLiveConfirmOpen={setToggleLiveConfirmOpen}
            setDeleteConfirmOpen={setDeleteConfirmOpen}
            setUnpublishLinkedInConfirmOpen={setUnpublishLinkedInConfirmOpen}
            blogEnabled={blogEnabled}
            onPostAgain={() => void draft.postAgain().then((m) => m && toast.show(m))}
            nextToReview={nextToReview}
            afterApprove={askFor === activeAsset.id ? <ApprovalUpdateAsk /> : undefined}
            isPostingAgain={draft.isPostingAgain}
            detailsSummary={checksSummary(reviewNotes, unchecked)}
            detailsOpen={seriousNotes + unchecked > 0}
            details={
              // The checks are for deciding to post; once it went out they are history.
              isPublished ? undefined : (
                <>
                  <DraftChecks notes={reviewNotes} />
                  {activeAsset.claims.length > 0 && (
                    <ClaimsGate
                      activeAsset={activeAsset}
                      verifiedClaimsCount={verifiedClaimsCount}
                      totalClaims={totalClaims}
                      allClaimsVerified={allClaimsVerified}
                      onToggleClaim={draft.toggleClaim}
                    />
                  )}
                </>
              )
            }
          />
        </aside>
      </div>

      <MobileActionBar
        activeAsset={activeAsset}
        isDirty={draft.isDirty}
        isSaving={draft.isSaving}
        onSave={handleSave}
        liveUrl={liveLinks(activeAsset, blogEnabled)[0]?.url ?? null}
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
        title={isPublished || activeAsset.status === "UNPUBLISHED" ? "Remove this post from Minions?" : "Delete this draft?"}
        description={
          `“${activeAsset.title}” and its checks will be deleted for good.` +
          (wentToLinkedIn ? ` The post stays on LinkedIn; ${activeAsset.linkedin_removable ? "use Unpublish from LinkedIn first" : "delete it there"} if you want it gone.` : "") +
          (blogEnabled && isPublished ? ` It also comes off ${studioBlogHost}.` : "")
        }
        confirmLabel={isPublished || activeAsset.status === "UNPUBLISHED" ? "Remove" : "Delete draft"}
        cancelLabel="Cancel"
        variant="danger"
        isLoading={draft.isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={unpublishLinkedInConfirmOpen}
        title="Unpublish from LinkedIn?"
        description={
          `“${activeAsset.title}” is deleted from LinkedIn, with its likes and comments, and LinkedIn can't bring it back.` +
          (blogEnabled && activeAsset.live_blog_url ? ` It also comes off ${studioBlogHost}.` : "") +
          " The draft goes back to your review queue, so you can edit it and publish again."
        }
        confirmLabel="Unpublish"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={draft.isUnpublishingLinkedIn}
        onConfirm={handleUnpublishLinkedIn}
        onClose={() => setUnpublishLinkedInConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={toggleLiveConfirmOpen}
        title={isPublished ? "Take it down from your blog?" : "Put it back on your blog?"}
        description={
          isPublished
            ? `“${activeAsset.title}” comes off ${studioBlogHost} right away. Nothing is deleted, and you can put it back.` +
              (wentToLinkedIn ? " The LinkedIn post stays up." : "")
            : `“${activeAsset.title}” goes back up on ${studioBlogHost}.`
        }
        confirmLabel={isPublished ? "Take it down" : "Put it back"}
        cancelLabel="Cancel"
        variant={isPublished ? "warning" : "primary"}
        isLoading={draft.isTogglingLive}
        onConfirm={handleToggleLive}
        onClose={() => setToggleLiveConfirmOpen(false)}
      />

      {panelModals}
    </div>
  );
}

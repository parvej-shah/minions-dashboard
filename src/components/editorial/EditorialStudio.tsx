"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";
import EmptyState, { LoadingState } from "@/components/ui/EmptyState";
import { useEditorialDraft } from "@/hooks/useEditorialDraft";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useToast } from "@/hooks/useToast";
import QueueRibbon, { type QueueFilter } from "./QueueRibbon";
import DraftHeader from "./DraftHeader";
import CoverImageCard from "./CoverImageCard";
import ArticleEditor, { type EditorMode } from "./ArticleEditor";
import SocialVariantTabs, { type SocialTab } from "./social/SocialVariantTabs";
import ReviewDock from "./ReviewDock";
import ClaimsGate from "./ClaimsGate";
import MobileActionBar from "./MobileActionBar";

export interface EditorialStudioProps {
  initialDraftId?: string;
  isStandaloneRoute?: boolean;
}

/**
 * Editorial Studio: composes the review queue, the article editor, the social
 * staging cards, and the decision dock.
 *
 * All data loading and mutation lives in useEditorialDraft; this component
 * wires those to the view. It was previously a single 2,119-line file that
 * also contained two copies of a markdown renderer, three social mock feeds,
 * a fake publish state machine, and a direct browser call to the n8n webhook.
 */
export default function EditorialStudio({
  initialDraftId,
  isStandaloneRoute = false,
}: EditorialStudioProps) {
  const draft = useEditorialDraft(initialDraftId);
  const { copiedKey, copy } = useCopyToClipboard(2200);
  const toast = useToast(3000);

  const [listFilter, setListFilter] = useState<QueueFilter>("ALL");
  const [editorMode, setEditorMode] = useState<EditorMode>("preview");
  const [socialTab, setSocialTab] = useState<SocialTab>("LINKEDIN");
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

  const handleSave = async () => {
    const message = await draft.saveDraft();
    if (message) toast.show(message);
    setIsEditingSocial(false);
  };

  const handlePublish = async () => {
    const message = await draft.approveAndPublish();
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

  if (draft.isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto py-10">
        <LoadingState label="Loading editorial drafts…" />
      </div>
    );
  }

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
        />
      </div>
    );
  }

  const statusLabel = draft.isSaving ? null : toast.message;

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
          <CoverImageCard activeAsset={activeAsset} />

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

          <SocialVariantTabs
            activeAsset={activeAsset}
            socialTab={socialTab}
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
          />
        </div>

        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <ReviewDock
            activeAsset={activeAsset}
            currentAssetIndex={currentAssetIndex}
            totalDrafts={assets.length}
            isDirty={draft.isDirty}
            isSaving={draft.isSaving}
            publishState={draft.publishState}
            wordCount={wordCount}
            readingTimeMinutes={readingTimeMinutes}
            onPrev={draft.prevDraft}
            onNext={draft.nextDraft}
            onSave={handleSave}
            onPublish={handlePublish}
            setToggleLiveConfirmOpen={setToggleLiveConfirmOpen}
            setDeleteConfirmOpen={setDeleteConfirmOpen}
          />

          <ClaimsGate
            activeAsset={activeAsset}
            verifiedClaimsCount={verifiedClaimsCount}
            totalClaims={totalClaims}
            allClaimsVerified={allClaimsVerified}
            onToggleClaim={draft.toggleClaim}
          />
        </div>
      </div>

      <MobileActionBar
        activeAsset={activeAsset}
        title={edited.title}
        currentAssetIndex={currentAssetIndex}
        totalDrafts={assets.length}
        wordCount={wordCount}
        verifiedClaimsCount={verifiedClaimsCount}
        totalClaims={totalClaims}
        allClaimsVerified={allClaimsVerified}
        isDirty={draft.isDirty}
        isSaving={draft.isSaving}
        publishState={draft.publishState}
        onSave={handleSave}
        onPublish={handlePublish}
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
            ? `Are you sure you want to unpublish "${activeAsset.title}"? It will immediately be taken down from getminions.ai/blog and returned to the review queue without deleting any content.`
            : `Are you sure you want to republish "${activeAsset.title}" live to getminions.ai/blog?`
        }
        confirmLabel={activeAsset.status === "PUBLISHED" ? "Unpublish Post" : "Republish Live"}
        cancelLabel="Cancel"
        variant={activeAsset.status === "PUBLISHED" ? "warning" : "primary"}
        isLoading={draft.isTogglingLive}
        onConfirm={handleToggleLive}
        onClose={() => setToggleLiveConfirmOpen(false)}
      />
    </div>
  );
}

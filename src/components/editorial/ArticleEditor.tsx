"use client";

import React from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  Layers,
  RefreshCw,
} from "lucide-react";
import MarkdownArticle from "./MarkdownArticle";
import type { AssetItem } from "@/types";

import { segment } from "@/components/ui/segment";
import { buttonStyles } from "@/components/ui/Button";
export type EditorMode = "preview" | "edit" | "split";

export interface ArticleEditorProps {
  activeAsset: AssetItem;
  edited: { title: string; hook: string; body: string };
  setEditedTitle: (v: string) => void;
  setEditedHook: (v: string) => void;
  setEditedBody: (v: string) => void;
  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;
  isDirty: boolean;
  isSaving: boolean;
  statusLabel: string | null;
  onSave: () => void;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  wordCount: number;
  readingTimeMinutes: number;
}

/**
 * The reading / editing / split panel for an article body. The reading and
 * split views render through the same MarkdownArticle.
 */
export default function ArticleEditor({
  activeAsset,
  edited,
  setEditedTitle,
  setEditedHook,
  setEditedBody,
  editorMode,
  setEditorMode,
  isDirty,
  isSaving,
  statusLabel,
  onSave,
  onCopy,
  copiedKey,
  wordCount,
  readingTimeMinutes,
}: ArticleEditorProps) {
  return (
          <div className="bg-surface rounded-2xl border border-line p-5 sm:p-6 space-y-5 shadow-xl">
            {/* Header Toolbar */}
            <div className="flex flex-col gap-3 border-b border-line pb-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex w-full items-center bg-canvas p-1 rounded-xl border border-line text-xs sm:w-auto">
                  <button
                    type="button"
                    aria-label="Reading View"
                    aria-pressed={editorMode === "preview"}
                    onClick={() => setEditorMode("preview")}
                    className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2.5 py-2 sm:flex-none sm:px-3 sm:py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      editorMode === "preview"
                        ? segment.on
                        : segment.off
                    }`}
                  >
                    <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="sm:hidden">Read</span>
                    <span className="hidden sm:inline">Reading View</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Live Editor"
                    aria-pressed={editorMode === "edit"}
                    onClick={() => setEditorMode("edit")}
                    className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2.5 py-2 sm:flex-none sm:px-3 sm:py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      editorMode === "edit"
                        ? segment.on
                        : segment.off
                    }`}
                  >
                    <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="sm:hidden">Edit</span>
                    <span className="hidden sm:inline">Live Editor</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Side-by-Side"
                    aria-pressed={editorMode === "split"}
                    onClick={() => setEditorMode("split")}
                    className={`hidden 2xl:flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      editorMode === "split"
                        ? segment.on
                        : segment.off
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Side-by-Side</span>
                  </button>
                </div>

                {/* Live Save Status */}
                <div className="flex min-w-0 items-center gap-2 sm:max-w-[190px]">
                  {isSaving ? (
                    <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] font-mono text-brand">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Saving changes…
                    </span>
                  ) : isDirty ? (
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-mono text-gold font-semibold bg-gold/10 px-2 py-1 rounded-lg border border-gold/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                      Unsaved changes
                    </span>
                  ) : (
                    <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-mono text-brand bg-brand/10 px-2 py-1 rounded-lg border border-brand/20">
                      <Check className="w-3 h-3" />
                      <span className="truncate">{statusLabel || "All changes saved"}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Save Draft (Cmd+S) & Copy */}
              <div className="flex w-full items-center gap-2 sm:w-auto 2xl:shrink-0">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className={buttonStyles({ variant: isDirty ? "primary" : "secondary", size: "sm", className: "flex-1 whitespace-nowrap sm:flex-none" })}
                  title="Save Draft (⌘S)"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Draft</span>
                  <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono rounded bg-black/20 text-current">
                    ⌘S
                  </kbd>
                </button>

                <button
                  type="button"
                  aria-label="Copy Markdown source"
                  onClick={() => onCopy(edited.body, "raw-markdown")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas text-muted border border-line transition-all hover:bg-surface-2 hover:text-ink"
                  title="Copy Markdown Source"
                >
                  {copiedKey === "raw-markdown" ? (
                    <Check className="w-4 h-4 text-brand" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* View Mode 1: Full Editor Mode */}
            {editorMode === "edit" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted flex items-center justify-between">
                    <span>Article Headline & Title</span>
                    <span className="text-[10px] font-mono text-subtle">{edited.title.length} chars</span>
                  </label>
                  <input
                    type="text"
                    value={edited.title}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Enter article headline..."
                    className="w-full bg-canvas border border-line rounded-xl px-4 py-2.5 text-sm font-bold text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">Executive Hook / Subtitle</label>
                  <input
                    type="text"
                    value={edited.hook}
                    onChange={(e) => setEditedHook(e.target.value)}
                    placeholder="One-sentence hook or thesis..."
                    className="w-full bg-canvas border border-line rounded-xl px-4 py-2 text-xs text-muted italic focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted pb-1">
                    <span className="font-semibold">Markdown Content Body</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span>{wordCount} words</span>
                      <span>•</span>
                      <span>~{readingTimeMinutes} min read</span>
                    </div>
                  </div>
                  <textarea
                    value={edited.body}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={20}
                    placeholder="Write or edit article markdown..."
                    className="w-full bg-canvas border border-line rounded-xl p-4 text-xs font-mono text-ink leading-relaxed focus:outline-none focus:border-brand resize-y"
                  />
                </div>
              </div>
            )}

            {/* View Mode 2: Split View Mode (Side-by-side Editor & Preview) */}
            {editorMode === "split" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-in fade-in duration-150">
                {/* Editor Column */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted">Headline</label>
                    <input
                      type="text"
                      value={edited.title}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted">Markdown Source</label>
                    <textarea
                      value={edited.body}
                      onChange={(e) => setEditedBody(e.target.value)}
                      rows={22}
                      className="w-full bg-canvas border border-line rounded-xl p-3 text-xs font-mono text-ink leading-relaxed focus:outline-none focus:border-brand resize-y"
                    />
                  </div>
                </div>


                {/* Live Formatted Column */}
                <div className="bg-canvas border border-line rounded-xl p-4 overflow-y-auto max-h-[560px] space-y-4 max-w-full">
                  <div className="border-b border-line pb-3">
                    <h2 className="text-lg font-bold text-ink leading-tight break-words [overflow-wrap:anywhere]">{edited.title}</h2>
                    {edited.hook && <p className="text-xs text-muted italic mt-1 break-words [overflow-wrap:anywhere]">{edited.hook}</p>}
                  </div>
                  <div className="space-y-3 text-xs text-[#E2E8F0] font-sans leading-relaxed max-w-full">
                    <MarkdownArticle
                      body={edited.body}
                      variant="compact"
                      onCopyCode={onCopy}
                      copiedKey={copiedKey}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* View Mode 3: Immersive Reading View */}
            {editorMode === "preview" && (
              <div className="space-y-6 animate-in fade-in duration-150 max-w-full">
                {/* Article Header */}
                <div className="space-y-2 border-b border-line/60 pb-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-brand flex-wrap">
                    <span>{activeAsset.pillar || "—"}</span>
                    <span>•</span>
                    <span>{readingTimeMinutes} min read</span>
                    <span>•</span>
                    <span className="text-muted">{wordCount} words</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-ink leading-tight break-words [overflow-wrap:anywhere] font-sans">
                    {edited.title}
                  </h1>
                  {(edited.hook || activeAsset.hook) && (
                    <p className="text-xs sm:text-sm font-medium text-muted italic border-l-2 border-brand pl-3 py-0.5 break-words [overflow-wrap:anywhere] font-sans">
                      {edited.hook || activeAsset.hook}
                    </p>
                  )}
                </div>


                {/* Body Paragraphs & Formatted Markdown */}
                <div className="prose-container space-y-5 max-w-[780px] w-full font-sans">
                  <MarkdownArticle
                    body={edited.body}
                    variant="reading"
                    onCopyCode={onCopy}
                    copiedKey={copiedKey}
                  />
                </div>
              </div>
            )}
          </div>
  );
}

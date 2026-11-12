"use client";

import React, { useState } from "react";
import { Loader2, Sparkles, Link2 } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { buttonStyles } from "@/components/ui/Button";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { createQuickIdeaPayload } from "@/lib/ideas/list";
import type { IdeaItem } from "@/types";

interface Props {
  onClose: () => void;
  onCreated: (idea: IdeaItem) => void;
  onFailed: (message: string) => void;
}

export default function AddIdeaDrawer({ onClose, onCreated, onFailed }: Props) {
  const [thought, setThought] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanThought = thought.trim();
    if (!cleanThought || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const base = createQuickIdeaPayload(cleanThought);
      const payload = {
        ...base,
        ...(customTitle.trim() ? { title: customTitle.trim(), raw_idea: customTitle.trim() } : {}),
        ...(sourceUrl.trim()
          ? {
              source: "MANUAL_REFERENCE",
              source_url: sourceUrl.trim(),
              signals: [
                {
                  title: customTitle.trim() || base.title,
                  url: sourceUrl.trim(),
                  source: "Manual Reference",
                  snippet: cleanThought,
                  published_at: new Date().toISOString(),
                },
              ],
            }
          : {}),
      };

      const created = await apiClient.post<IdeaItem>("/api/ideas", payload);
      onCreated(created);
    } catch (err) {
      onFailed(`Could not add idea: ${toErrorMessage(err, "network error")}`);
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      onClose={onClose}
      closeLabel="add idea"
      busy={isSubmitting}
      header={
        <div>
          <span className="mb-1 inline-block rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
            Quick Capture
          </span>
          <h2 className="text-xl font-bold text-ink">Add an idea</h2>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-full min-h-11 px-4 py-2.5 text-[15px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-idea-form"
            disabled={isSubmitting || !thought.trim()}
            className={buttonStyles({ size: "sm", className: "w-full sm:w-auto min-h-11 px-5" })}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                Add idea
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="add-idea-form" onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="quick-thought" className="block text-[14px] font-semibold text-ink mb-2">
            What&apos;s on your mind?
          </label>
          <textarea
            id="quick-thought"
            required
            autoFocus
            rows={5}
            placeholder="Paste a client question, conversation snippet, link, or voice note transcript. Minions shapes the angle and hook for you."
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            className="w-full bg-surface-2 border border-line focus:border-brand rounded-2xl p-4 text-[15px] text-ink placeholder:text-muted outline-none transition-all resize-none leading-relaxed"
          />
          <p className="text-[12px] text-muted mt-2">
            A single sentence or link is enough. You don&apos;t need to write an outline or angle.
          </p>
        </div>

        {!showAdvanced ? (
          <button
            type="button"
            onClick={() => setShowAdvanced(true)}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:underline cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            Add separate link or custom title
          </button>
        ) : (
          <div className="space-y-4 rounded-2xl border border-line bg-surface-1 p-4">
            <div>
              <label htmlFor="custom-title" className="block text-xs font-semibold text-ink mb-1.5">
                Custom title <span className="text-muted font-normal">(Optional)</span>
              </label>
              <input
                id="custom-title"
                type="text"
                placeholder="Optional headline override"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-surface-2 border border-line focus:border-brand rounded-xl px-3.5 py-2 text-xs text-ink placeholder:text-muted outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="source-url" className="block text-xs font-semibold text-ink mb-1.5">
                Source link <span className="text-muted font-normal">(Optional)</span>
              </label>
              <input
                id="source-url"
                type="url"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full bg-surface-2 border border-line focus:border-brand rounded-xl px-3.5 py-2 text-xs text-ink placeholder:text-muted outline-none transition-all"
              />
            </div>
          </div>
        )}
      </form>
    </Drawer>
  );
}

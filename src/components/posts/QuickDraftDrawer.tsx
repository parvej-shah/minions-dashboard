"use client";

import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { buttonStyles } from "@/components/ui/Button";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { createQuickIdeaPayload } from "@/lib/ideas/list";
import type { IdeaItem } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDraftStarted: () => void;
  onFailed: (message: string) => void;
}

/** Autonomous Quick Draft: converts a thought or URL directly into a draft. */
export default function QuickDraftDrawer({ isOpen, onClose, onDraftStarted, onFailed }: Props) {
  const [thought, setThought] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanThought = thought.trim();
    if (!cleanThought || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = createQuickIdeaPayload(cleanThought);
      const created = await apiClient.post<IdeaItem>("/api/ideas", payload);

      await apiClient.post("/api/pipeline/draft", {
        idea_id: created.id,
        title: created.title,
        audience: created.audience,
        target_trade: created.target_trade,
      });

      onDraftStarted();
      onClose();
      setThought("");
    } catch (err) {
      onFailed(`Could not start draft: ${toErrorMessage(err, "network error")}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      onClose={onClose}
      closeLabel="quick draft"
      busy={isSubmitting}
      header={
        <div>
          <span className="mb-1 inline-block rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
            Instant Draft
          </span>
          <h2 className="text-xl font-bold text-ink">Draft from a thought or link</h2>
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
            form="quick-draft-form"
            disabled={isSubmitting || !thought.trim()}
            className={buttonStyles({ size: "sm", className: "w-full sm:w-auto min-h-11 px-5 cursor-pointer" })}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Starting draft…</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Write draft</span>
              </span>
            )}
          </button>
        </div>
      }
    >
      <form id="quick-draft-form" onSubmit={submit} className="space-y-4 p-6 sm:p-8">
        <div>
          <label htmlFor="quick-draft-thought" className="block text-[14px] font-semibold text-ink mb-2">
            What should Minions write about?
          </label>
          <textarea
            id="quick-draft-thought"
            rows={4}
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="Type a single thought or paste an article link (e.g. Inbound voice response latency over 1.2s kills conversion, or paste https://...)"
            className="w-full resize-none rounded-2xl border border-line bg-surface-2 p-4 text-[15px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            autoFocus
            disabled={isSubmitting}
          />
          <p className="mt-2 text-xs text-muted">
            Minions will write the draft directly into your post library for you to review.
          </p>
        </div>
      </form>
    </Drawer>
  );
}

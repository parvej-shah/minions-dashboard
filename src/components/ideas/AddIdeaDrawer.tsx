"use client";

import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { buttonStyles } from "@/components/ui/Button";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import type { IdeaItem } from "@/types";

const FALLBACK_NOTE = "An idea added by your team.";
const fieldClass =
  "w-full bg-surface-2 border border-line focus:border-brand rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-subtle outline-none transition-all";

interface Props {
  onClose: () => void;
  onCreated: (idea: IdeaItem) => void;
  onFailed: (message: string) => void;
}

function newIdeaPayload(title: string, note: string, sourceUrl: string) {
  return {
    title,
    raw_idea: title,
    excerpt: note || FALLBACK_NOTE,
    angle: note || FALLBACK_NOTE,
    audience: "ICP",
    source: sourceUrl ? "MANUAL_REFERENCE" : "MANUAL",
    source_url: sourceUrl || null,
    source_title: null,
    signals: sourceUrl
      ? [{ title, url: sourceUrl, source: "Manual Reference", snippet: note || title, published_at: new Date().toISOString() }]
      : [],
    tags: ["Manual"],
  };
}

export default function AddIdeaDrawer({ onClose, onCreated, onFailed }: Props) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const created = await apiClient.post<IdeaItem>("/api/ideas", newIdeaPayload(title.trim(), note.trim(), sourceUrl.trim()));
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
          <span className="mb-1 inline-block rounded border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
            Add an idea
          </span>
          <h2 className="text-lg font-bold text-ink">Add your idea</h2>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-idea-form"
            disabled={isSubmitting || !title.trim()}
            className={buttonStyles({ size: "sm", className: "w-full sm:w-auto" })}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding idea…
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
          <label className="block text-xs font-semibold text-ink mb-1.5">
            Idea title <span className="text-brand">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. The customer question our industry keeps answering badly"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${fieldClass} font-medium`}
          />
          <p className="text-[11px] text-subtle mt-1">
            Name the specific problem, question, or decision this idea tackles for your ideal customer.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">
            Source link <span className="text-subtle font-normal">(Optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://news.ycombinator.com/... or https://techcrunch.com/..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className={`${fieldClass}`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Angle or notes</label>
          <textarea
            rows={3}
            placeholder="What might others be missing, and what experience or evidence gives you a useful perspective? An idea, rough angle, or source is enough; future implications are optional."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${fieldClass} resize-none`}
          />
        </div>
      </form>
    </Drawer>
  );
}

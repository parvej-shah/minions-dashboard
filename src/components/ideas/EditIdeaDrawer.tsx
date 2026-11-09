"use client";

import React, { useState } from "react";
import { Check, Edit3, Loader2, Trash2 } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { buttonStyles } from "@/components/ui/Button";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import type { IdeaItem, IdeaStatus } from "@/types";

const fieldClass = "w-full bg-canvas border border-line focus:border-brand rounded-xl px-3.5 py-2.5 text-ink outline-none transition-colors";

interface Props {
  idea: IdeaItem;
  onClose: () => void;
  onSaved: (changes: Pick<IdeaItem, "title" | "raw_idea" | "excerpt" | "angle" | "status">) => void;
  onFailed: (message: string) => void;
  onRequestDelete: (target: { id: string; title: string }) => void;
}

/** Mount it with `key={idea.id}` so the fields start from the idea being edited. */
export default function EditIdeaDrawer({ idea, onClose, onSaved, onFailed, onRequestDelete }: Props) {
  const [title, setTitle] = useState(idea.title || idea.raw_idea || "");
  const [note, setNote] = useState(idea.excerpt || idea.angle || "");
  const [isSaving, setIsSaving] = useState(false);
  const ideaId = idea.id || idea.ideaId;
  const status: IdeaStatus = idea.status || "REFINED";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;
    setIsSaving(true);
    const changes = { title: title.trim(), raw_idea: title.trim(), excerpt: note.trim(), angle: note.trim(), status };
    try {
      await apiClient.patch(`/api/ideas/${idea.id}`, changes);
      onSaved(changes);
    } catch (err) {
      onFailed(toErrorMessage(err, "Could not save your changes."));
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      onClose={onClose}
      closeLabel="edit idea"
      busy={isSaving}
      header={
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-brand" />
          <div>
            <h2 className="text-base font-bold text-ink">Edit idea</h2>
            <p className="text-xs text-subtle">{ideaId}</p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onRequestDelete({ id: ideaId, title })}
            className="min-h-11 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="min-h-11 px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-surface-2 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button type="submit" form="edit-idea-form" disabled={isSaving || !title.trim()} className={buttonStyles({ size: "sm" })}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <form id="edit-idea-form" onSubmit={submit} className="space-y-5 pb-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
            <span>Idea title</span>
            <span className="text-brand">*</span>
          </label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={`${fieldClass} min-h-11 text-sm`} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted">Angle or notes</label>
          <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} className={`${fieldClass} text-xs resize-none leading-relaxed`} />
        </div>
      </form>
    </Drawer>
  );
}

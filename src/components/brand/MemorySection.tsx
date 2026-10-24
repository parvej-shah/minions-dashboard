"use client";

import { useEffect, useState } from "react";
import { BookOpen, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import {
  MEMORY_DISCLOSURE_META,
  MEMORY_KIND_META,
  MEMORY_KINDS,
} from "@/constants/contentLanes";
import type { MemoryItem } from "@/types";
import Composer, { EMPTY_DRAFT, type MemoryDraft } from "@/components/brand/MemoryComposer";
import ErrorLine from "@/components/ui/ErrorLine";
import { LoadingState } from "@/components/ui/EmptyState";
import { sectionClass } from "@/components/ui/fieldStyles";

export default function MemorySection({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<MemoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<MemoryDraft>(EMPTY_DRAFT);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<MemoryItem[]>("/api/brand/memory")
      .then((rows) => !cancelled && setItems(rows))
      .catch((err) => !cancelled && setError(toErrorMessage(err, "Couldn't load your experience.")));
    return () => {
      cancelled = true;
    };
  }, []);

  function upsert(item: MemoryItem) {
    setItems((prev) => {
      const list = prev ?? [];
      return list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [item, ...list];
    });
    onChange();
  }

  async function patch(item: MemoryItem, body: Partial<Pick<MemoryItem, "disclosure" | "is_active">>) {
    setError(null);
    try {
      upsert(await apiClient.patch<MemoryItem>(`/api/brand/memory/${item.id}`, body));
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't update that item."));
    }
  }

  async function remove(item: MemoryItem) {
    const previous = items;
    setItems((prev) => (prev ?? []).filter((i) => i.id !== item.id));
    try {
      await apiClient.delete(`/api/brand/memory/${item.id}`);
      onChange();
    } catch (err) {
      setItems(previous);
      setError(toErrorMessage(err, "Couldn't remove that item."));
    }
  }

  if (!items) return error ? <ErrorLine text={error} /> : <LoadingState />;

  const grouped = MEMORY_KINDS.map((kind) => ({ kind, rows: items.filter((i) => i.kind === kind) })).filter((g) => g.rows.length);

  return (
    <div className={sectionClass}>
      <div>
        <h3 className="text-base font-bold text-ink flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand" />
          Experience &amp; activity
          <span className="rounded bg-line px-1.5 py-0.5 font-mono text-[10px] text-muted">{items.length}</span>
        </h3>
        <p className="text-xs text-muted mt-0.5">
          What you have built, learned and seen. Minions only proposes ideas it can back with something here, so
          anything you add makes your posts more yours. Never add anything confidential.
        </p>
      </div>

      {error && <ErrorLine text={error} />}

      <Composer draft={draft} setDraft={setDraft} onSaved={(item) => { upsert(item); setDraft(EMPTY_DRAFT); }} />

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-subtle">
          Nothing yet. Start with one lesson from a project that did not go to plan.
        </p>
      ) : (
        <div className="space-y-5 border-t border-line/60 pt-4">
          {grouped.map(({ kind, rows }) => (
            <div key={kind} className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-subtle">{MEMORY_KIND_META[kind].label}</h4>
              {rows.map((item) => (
                <div
                  key={item.id}
                  className={`group rounded-lg border border-line bg-canvas px-3 py-2.5 ${item.is_active ? "" : "opacity-50"}`}
                >
                  <p className="whitespace-pre-wrap text-sm text-ink">{item.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    {/* Public is the default, so only a generalized item carries a tag; the switch sits with the other controls. */}
                    {item.disclosure !== "PUBLIC" && (
                      <span title={MEMORY_DISCLOSURE_META[item.disclosure].hint} className="rounded border border-line px-1.5 py-0.5 text-muted">
                        Kept general
                      </span>
                    )}
                    <span className="text-subtle">
                      {item.used_in_ideas === 0 ? "Not used yet" : `Used in ${item.used_in_ideas} idea${item.used_in_ideas === 1 ? "" : "s"}`}
                    </span>
                    <span className="flex-1" />
                    <span className="flex items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => patch(item, { disclosure: item.disclosure === "PUBLIC" ? "GENERALIZE" : "PUBLIC" })}
                      title={item.disclosure === "PUBLIC" ? MEMORY_DISCLOSURE_META.GENERALIZE.hint : MEMORY_DISCLOSURE_META.PUBLIC.hint}
                      className="rounded px-1.5 py-0.5 text-subtle hover:text-ink cursor-pointer"
                    >
                      {item.disclosure === "PUBLIC" ? "Keep it general" : "Allow specifics"}
                    </button>
                    <button
                      type="button"
                      onClick={() => patch(item, { is_active: !item.is_active })}
                      aria-label={item.is_active ? "Stop using this" : "Use this again"}
                      title={item.is_active ? "Stop using this" : "Use this again"}
                      className="rounded p-1 text-subtle hover:text-ink cursor-pointer"
                    >
                      {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft({ id: item.id, kind: item.kind, content: item.content, disclosure: item.disclosure })}
                      aria-label="Edit"
                      className="rounded p-1 text-subtle hover:text-ink cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      aria-label="Delete"
                      className="rounded p-1 text-subtle hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Add or edit one item. Saving runs the generalization check first: contact
 * details, secrets and anything confidential block the save; names, places
 * and figures are shown with a rewrite that removes them.
 */

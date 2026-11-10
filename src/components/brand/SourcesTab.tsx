"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/EmptyState";
import {
  IDEA_SOURCE_KINDS,
  MAX_ITEMS_PER_SOURCE,
  MAX_SOURCES_PER_TENANT,
  type IdeaSourceItem,
  type IdeaSourceKind,
} from "@/constants/ideaSources";

import { Button } from "@/components/ui/Button";
import ErrorLine from "@/components/ui/ErrorLine";
import { BrandCard, brandText } from "@/components/brand/parts";
import { inputClass } from "@/components/ui/fieldStyles";

/**
 * Where the idea harvester looks for market signals, per tenant.
 *
 * Every workspace has its own feeds, matched to its industry; editing them here
 * changes the next harvest.
 */
export default function SourcesTab() {
  const [sources, setSources] = useState<IdeaSourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [kind, setKind] = useState<IdeaSourceKind>("RSS");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");

  const kindDef = IDEA_SOURCE_KINDS.find((k) => k.id === kind)!;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await apiClient.get<IdeaSourceItem[]>("/api/ideas/sources");
        if (!cancelled) setSources(rows);
      } catch (err) {
        if (!cancelled) setError(toErrorMessage(err, "Couldn't load your sources."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd() {
    if (!label.trim() || !value.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const created = await apiClient.post<IdeaSourceItem>("/api/ideas/sources", {
        kind,
        label: label.trim(),
        ...(kindDef.usesQuery ? { query: value.trim() } : { url: value.trim() }),
      });
      setSources((prev) => [...prev, created]);
      setLabel("");
      setValue("");
    } catch (err) {
      setError(toErrorMessage(err, "Couldn't add that source."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(source: IdeaSourceItem) {
    // Optimistic: the row is a checkbox, and a failed toggle is recoverable.
    setSources((prev) =>
      prev.map((s) => (s.id === source.id ? { ...s, is_active: !s.is_active } : s))
    );
    try {
      await apiClient.patch(`/api/ideas/sources/${source.id}`, { is_active: !source.is_active });
    } catch (err) {
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? { ...s, is_active: source.is_active } : s))
      );
      setError(toErrorMessage(err, "Couldn't update that source."));
    }
  }

  async function handleDelete(id: string) {
    const previous = sources;
    setSources((prev) => prev.filter((s) => s.id !== id));
    try {
      await apiClient.delete(`/api/ideas/sources/${id}`);
    } catch (err) {
      setSources(previous);
      setError(toErrorMessage(err, "Couldn't remove that source."));
    }
  }

  const title = "Where ideas come from";
  const line = "Minions reads these for things worth posting about. More varied feeds mean less repetitive ideas.";
  if (isLoading) return <BrandCard title={title} line={line}><LoadingState rows={2} /></BrandCard>;

  return (
    <BrandCard title={title} line={line}>
      {error && <ErrorLine text={error} />}

      {sources.length === 0 ? (
        <p className={`${brandText.row} ${brandText.line}`}>No feeds yet. Until you add one, Minions reads a general technology feed.</p>
      ) : (
        <ul className="space-y-2">
          {sources.map((source) => (
            <li key={source.id} className={`${brandText.row} flex items-center gap-3 py-2 pr-2`}>
              <input type="checkbox" checked={source.is_active} onChange={() => handleToggle(source)} aria-label={`Use ${source.label}`} className="h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-brand)]" />
              <div className="min-w-0 flex-1 py-1.5">
                <p className="truncate text-[15px] font-medium text-ink">{source.label}</p>
                <p className="truncate text-sm text-subtle">
                  {IDEA_SOURCE_KINDS.find((k) => k.id === source.kind)?.label || source.kind} · {source.query || source.url}
                </p>
                {source.last_error && <p className="mt-0.5 text-sm text-danger">Last read failed: {source.last_error}</p>}
              </div>
              <button type="button" onClick={() => handleDelete(source.id)} aria-label={`Remove ${source.label}`} className={brandText.iconButton}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {sources.length < MAX_SOURCES_PER_TENANT ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="space-y-2">
              <span className={brandText.label}>Type</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as IdeaSourceKind)} className={`${inputClass} cursor-pointer`}>
                {IDEA_SOURCE_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className={brandText.label}>Name</span>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Trade Weekly" className={inputClass} />
            </label>
            <label className="space-y-2">
              <span className={brandText.label}>{kindDef.usesQuery ? "Search topic" : "Feed URL"}</span>
              <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={kindDef.usesQuery ? "Topic" : "https://…"} className={inputClass} />
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={brandText.note}>{kindDef.hint}</p>
            <Button variant="secondary" onClick={handleAdd} loading={isSaving} disabled={!label.trim() || !value.trim()} className="shrink-0">
              Add source
            </Button>
          </div>
        </div>
      ) : (
        <p className={brandText.note}>
          You&apos;ve reached the limit of {MAX_SOURCES_PER_TENANT} sources. Remove one to add another. Minions takes up to {MAX_ITEMS_PER_SOURCE} items from each feed.
        </p>
      )}
    </BrandCard>
  );
}

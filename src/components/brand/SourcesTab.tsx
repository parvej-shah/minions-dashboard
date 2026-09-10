"use client";

import React, { useEffect, useState } from "react";
import { Rss, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/EmptyState";
import {
  IDEA_SOURCE_KINDS,
  MAX_ITEMS_PER_SOURCE,
  MAX_SOURCES_PER_TENANT,
  type IdeaSourceItem,
  type IdeaSourceKind,
} from "@/constants/ideaSources";

const inputClass =
  "w-full rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]";

/**
 * Where the idea harvester looks for market signals, per tenant.
 *
 * These four feeds used to be hardcoded in the n8n workflow and shared by
 * every tenant regardless of industry -- one of them was a Google News query
 * pinned to "pest control HVAC plumbing" -- which is a large part of why
 * harvested ideas repeated. Editing them here changes the next harvest.
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

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
            <Rss className="w-4 h-4 text-[#00C9A7]" />
            Where ideas come from
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            The harvester reads these feeds for market signals. More varied sources mean less
            repetitive ideas.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          {sources.length === 0 && (
            <p className="rounded-lg border border-dashed border-[#1F2D3D] px-3 py-6 text-center text-xs text-[#64748B]">
              No sources yet. The harvester falls back to a general technology feed until you add
              some.
            </p>
          )}

          {sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-3 rounded-lg border border-[#1F2D3D] bg-[#070B0F] px-3 py-2.5"
            >
              <input
                type="checkbox"
                checked={source.is_active}
                onChange={() => handleToggle(source)}
                aria-label={`Use ${source.label}`}
                className="h-4 w-4 shrink-0 accent-[#00C9A7] cursor-pointer"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-[#F1F5F9]">
                    {source.label}
                  </span>
                  <span className="shrink-0 rounded bg-[#1F2D3D] px-1.5 py-0.5 font-mono text-[10px] text-[#94A3B8]">
                    {IDEA_SOURCE_KINDS.find((k) => k.id === source.kind)?.label || source.kind}
                  </span>
                </div>
                <p className="truncate text-[11px] text-[#64748B]">{source.query || source.url}</p>
                {source.last_error && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-red-400">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Last fetch failed: {source.last_error}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(source.id)}
                aria-label={`Remove ${source.label}`}
                className="shrink-0 rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {sources.length < MAX_SOURCES_PER_TENANT ? (
          <div className="space-y-2 border-t border-[#1F2D3D]/60 pt-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as IdeaSourceKind)}
                aria-label="Source type"
                className={`${inputClass} cursor-pointer`}
              >
                {IDEA_SOURCE_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Name, e.g. Trade Weekly"
                className={inputClass}
              />
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={kindDef.usesQuery ? "Topic" : "Feed URL"}
                className={inputClass}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#64748B]">{kindDef.hint}</p>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isSaving || !label.trim() || !value.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#00C9A7] px-3 py-2 text-xs font-bold text-[#070B0F] transition-colors hover:bg-[#00C9A7]/90 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Add source
              </button>
            </div>
          </div>
        ) : (
          <p className="border-t border-[#1F2D3D]/60 pt-4 text-xs text-[#64748B]">
            You&apos;ve reached the limit of {MAX_SOURCES_PER_TENANT} sources. Remove one to add
            another. Each source contributes up to {MAX_ITEMS_PER_SOURCE} signals per harvest.
          </p>
        )}
      </div>
    </div>
  );
}

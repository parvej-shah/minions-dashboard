"use client";

import { useEffect, useState } from "react";
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
import Menu from "@/components/ui/Menu";
import { BrandCard, brandText } from "@/components/brand/parts";

/** How many items the basic card shows before "See all". */
const COMPACT_ROWS = 3;

/**
 * What the author has lived. `compact` is the basic card: one box to add, the
 * latest few, and a link to the full list, where items are grouped and edited.
 */
export default function MemorySection({ onChange, compact = false, onSeeAll }: { onChange: () => void; compact?: boolean; onSeeAll?: () => void }) {
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

  const title = compact ? "What you\u2019ve done" : "Your experience";
  const line = compact ? "Posts are only written from what\u2019s here. Add anything real." : "What you have built, learned and seen. Never add anything confidential.";
  if (!items) return <BrandCard title={title} line={line}>{error ? <ErrorLine text={error} /> : <LoadingState rows={2} />}</BrandCard>;

  const row = (item: MemoryItem) => (
    <li key={item.id} className={`${brandText.row} ${item.is_active ? "" : "opacity-50"}`}>
      <p className={`whitespace-pre-wrap text-[15px] leading-relaxed text-ink ${compact ? "line-clamp-2" : ""}`}>{item.content}</p>
      {!compact && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
          <span>{item.used_in_ideas === 0 ? "Not used yet" : `Used in ${item.used_in_ideas} idea${item.used_in_ideas === 1 ? "" : "s"}`}</span>
          {item.disclosure !== "PUBLIC" && <span title={MEMORY_DISCLOSURE_META[item.disclosure].hint}>· Kept general</span>}
          {!item.is_active && <span>· Not in use</span>}
          <span className="flex-1" />
          <Menu
            label="More"
            items={[
              { label: "Edit", onSelect: () => setDraft({ id: item.id, kind: item.kind, content: item.content, disclosure: item.disclosure }) },
              { label: item.disclosure === "PUBLIC" ? "Keep it general" : "Allow specifics", onSelect: () => patch(item, { disclosure: item.disclosure === "PUBLIC" ? "GENERALIZE" : "PUBLIC" }) },
              { label: item.is_active ? "Stop using this" : "Use this again", onSelect: () => patch(item, { is_active: !item.is_active }) },
              { label: "Delete", onSelect: () => remove(item), danger: true },
            ]}
          />
        </div>
      )}
    </li>
  );

  if (compact) {
    return (
      <BrandCard
        title={title}
        line={line}
        action={items.length > 0 && onSeeAll && <button type="button" onClick={onSeeAll} className={brandText.link}>See all {items.length}</button>}
      >
        {error && <ErrorLine text={error} />}
        <Composer simple draft={draft} setDraft={setDraft} onSaved={(item) => { upsert(item); setDraft(EMPTY_DRAFT); }} />
        {items.length > 0 && <ul className="space-y-2">{items.slice(0, COMPACT_ROWS).map(row)}</ul>}
      </BrandCard>
    );
  }

  const grouped = MEMORY_KINDS.map((kind) => ({ kind, rows: items.filter((i) => i.kind === kind) })).filter((g) => g.rows.length);

  return (
    <BrandCard title={title} line={line}>
      {error && <ErrorLine text={error} />}
      <Composer draft={draft} setDraft={setDraft} onSaved={(item) => { upsert(item); setDraft(EMPTY_DRAFT); }} />
      {items.length === 0 ? (
        <p className={`${brandText.row} ${brandText.line}`}>Nothing yet. Start with one lesson from a project that did not go to plan.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ kind, rows }) => (
            <div key={kind} className="space-y-2">
              <h3 className="text-[15px] font-medium text-muted">{MEMORY_KIND_META[kind].label}</h3>
              <ul className="space-y-2">{rows.map(row)}</ul>
            </div>
          ))}
        </div>
      )}
    </BrandCard>
  );
}

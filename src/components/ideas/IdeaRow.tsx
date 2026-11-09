"use client";

import React from "react";
import Link from "next/link";
import Menu, { type MenuItem } from "@/components/ui/Menu";
import { sourceLine, type IdeaView } from "@/lib/ideas/list";
import { shortWhen } from "@/lib/drafts/decision";
import type { IdeaItem } from "@/types";

export interface IdeaRowProps {
  idea: IdeaItem;
  view: IdeaView;
  /** 1-based place in the Up next list. */
  place: number;
  slotAt: string | null;
  timezone: string;
  now: Date;
  starting: boolean;
  onOpen: () => void;
  onWrite: () => void;
  onEdit: () => void;
  onWriteForDay: () => void;
  onSetAside: () => void;
  onBringBack: () => void;
  onDelete: () => void;
}

const textButton = "min-h-10 cursor-pointer rounded-full px-2.5 text-[15px] font-medium text-brand hover:bg-brand/5 disabled:cursor-default disabled:opacity-50";

/** One idea in the list: its place, what it is, where it came from, and one action. */
export default function IdeaRow(p: IdeaRowProps) {
  const { idea, view } = p;
  const title = idea.title || idea.raw_idea || "Untitled idea";
  const note = idea.excerpt || idea.angle;
  const source = sourceLine(idea);
  const published = (idea.status || "").toUpperCase() === "PUBLISHED";

  const items: MenuItem[] =
    view === "next"
      ? [
          { label: "Edit", onSelect: p.onEdit },
          { label: "Write for a set day…", onSelect: p.onWriteForDay },
          { label: "Set aside", onSelect: p.onSetAside },
          { label: "Delete", onSelect: p.onDelete, danger: true, divider: true },
        ]
      : view === "aside"
        ? [
            { label: "Edit", onSelect: p.onEdit },
            { label: "Delete", onSelect: p.onDelete, danger: true, divider: true },
          ]
        : [{ label: "Delete idea", onSelect: p.onDelete, danger: true }];

  const kicker =
    view === "next" && p.slotAt
      ? `Next · ${shortWhen(p.slotAt, p.timezone, p.now)}`
      : view === "next" && idea.scheduled_for
        ? `Set for ${shortWhen(idea.scheduled_for, p.timezone, p.now)}`
        : null;

  return (
    <li className="flex items-start gap-5 border-b border-line px-1 py-[22px]">
      {view === "next" && (
        <p aria-hidden="true" className="mt-0.5 w-6 shrink-0 text-[15px] font-semibold text-muted">{p.place}</p>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {kicker && <p className="text-[13px] font-semibold text-ink">{kicker}</p>}
        <button type="button" onClick={p.onOpen} title={title} className="line-clamp-2 w-fit cursor-pointer text-left text-[19px] font-semibold leading-snug tracking-[-0.015em] text-ink hover:text-brand">
          {title}
        </button>
        {note && <p className="line-clamp-2 text-[15px] leading-normal text-muted">{note}</p>}
        <p className="mt-0.5 text-[13px] text-muted">
          {source.href ? (
            <a href={source.href} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{source.text} ↗</a>
          ) : (
            source.text
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {view === "next" && (
          <button type="button" onClick={p.onWrite} disabled={p.starting} className={textButton}>
            {p.starting ? "Starting…" : "Write now"}
          </button>
        )}
        {view === "written" &&
          (idea.draftAssetId ? (
            <Link href={`/editorial?id=${encodeURIComponent(idea.draftAssetId)}`} className={`${textButton} inline-flex items-center`}>
              {published ? "See post" : "Review post"}
            </Link>
          ) : (
            <Link href={published ? "/posts?show=posted" : "/posts"} className={`${textButton} inline-flex items-center`}>
              {published ? "Posted" : "See posts"}
            </Link>
          ))}
        {view === "aside" && (
          <button type="button" onClick={p.onBringBack} className={textButton}>Bring back</button>
        )}
        <Menu label={`More for “${title}”`} items={items} />
      </div>
    </li>
  );
}

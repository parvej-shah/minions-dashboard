"use client";

import React from "react";
import Link from "next/link";
import Menu, { type MenuItem } from "@/components/ui/Menu";
import { buttonStyles } from "@/components/ui/Button";
import { distillIdea, sourceLine, type IdeaView } from "@/lib/ideas/list";
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
  onMakeNext?: () => void;
  onSetAside: () => void;
  onBringBack: () => void;
  onDelete: () => void;
}

const textButton =
  "min-h-11 cursor-pointer rounded-full px-3.5 text-[15px] font-medium text-brand hover:bg-brand/5 disabled:cursor-default disabled:opacity-50 transition-colors";

/** One idea in the list: its place, executive hook, angle insight, and 1-tap action. */
export default function IdeaRow(p: IdeaRowProps) {
  const { idea, view } = p;
  const rawTitle = idea.title || idea.raw_idea || "Untitled idea";
  const rawNote = idea.excerpt || idea.angle;
  const { hook, detail } = distillIdea(rawTitle, rawNote);
  const source = sourceLine(idea);
  const published = (idea.status || "").toUpperCase() === "PUBLISHED";
  const isTop = view === "next" && p.place === 1;

  const items: MenuItem[] =
    view === "next"
      ? [
          ...(p.place > 1 && p.onMakeNext
            ? [{ label: "Make next in queue", onSelect: p.onMakeNext }]
            : []),
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

  return (
    <li className="flex flex-wrap items-start gap-x-5 gap-y-3 border-b border-line px-1 py-5 transition-colors hover:bg-surface-2/40 rounded-xl">
      {view === "next" && (
        <span
          aria-hidden="true"
          className={`mt-0.5 w-6 shrink-0 text-[15px] font-semibold ${
            isTop ? "text-brand" : "text-muted"
          }`}
        >
          {p.place}
        </span>
      )}
      <div className="flex min-w-0 flex-[1_1_0] flex-col gap-1">
        <h3 className="text-[17px] sm:text-[18px] font-semibold leading-snug tracking-[-0.015em] text-ink">
          <button
            type="button"
            onClick={p.onOpen}
            title={rawTitle}
            className="w-fit cursor-pointer text-left hover:text-brand transition-colors"
          >
            {hook}
          </button>
        </h3>
        {detail && <p className="line-clamp-2 text-[14px] leading-relaxed text-muted">{detail}</p>}

        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
          {view === "next" && p.slotAt && (
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {shortWhen(p.slotAt, p.timezone, p.now)}
            </span>
          )}
          {view === "next" && idea.scheduled_for && !p.slotAt && (
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Set for {shortWhen(idea.scheduled_for, p.timezone, p.now)}
            </span>
          )}
          {source.href ? (
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              {source.text} ↗
            </a>
          ) : source.text !== "Found by Minions" ? (
            <span>{source.text}</span>
          ) : null}
        </div>
      </div>

      {/* On mobile the actions sit under the text with 44px touch targets */}
      <div
        className={`flex basis-full items-center gap-1 sm:basis-auto sm:shrink-0 sm:pl-0 ${
          view === "next" ? "pl-[34px]" : "-ml-2.5 sm:ml-0"
        }`}
      >
        {view === "next" && (
          <button
            type="button"
            onClick={p.onWrite}
            disabled={p.starting}
            className={
              isTop
                ? buttonStyles({ size: "sm", className: "min-h-11 px-4 cursor-pointer" })
                : textButton
            }
          >
            {p.starting ? "Starting…" : "Write now"}
          </button>
        )}
        {view === "written" &&
          (idea.draftAssetId ? (
            <Link
              href={`/editorial?id=${encodeURIComponent(idea.draftAssetId)}`}
              className={`${textButton} inline-flex items-center`}
            >
              {published ? "See post" : "Review post"}
            </Link>
          ) : (
            <Link
              href={published ? "/posts?show=posted" : "/posts"}
              className={`${textButton} inline-flex items-center`}
            >
              {published ? "Posted" : "See posts"}
            </Link>
          ))}
        {view === "aside" && (
          <button type="button" onClick={p.onBringBack} className={textButton}>
            Bring back
          </button>
        )}
        <Menu label={`More for “${rawTitle}”`} items={items} />
      </div>
    </li>
  );
}

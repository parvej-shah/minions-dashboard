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

/** One idea card: clear place/slot badges, executive hook, angle insight, and 1-tap action. */
export default function IdeaRow(p: IdeaRowProps) {
  const { idea, view } = p;
  const rawTitle = idea.title || idea.raw_idea || "Untitled idea";
  const rawNote = idea.excerpt || idea.angle;
  const { hook, detail } = distillIdea(rawTitle, rawNote);
  const source = sourceLine(idea);
  const published = (idea.status || "").toUpperCase() === "PUBLISHED";
  const isTop = view === "next" && p.place === 1;
  const isHighPriority = (idea.priority || "").toUpperCase() === "HIGH";

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
    <li className="group relative rounded-2xl sm:rounded-[22px] bg-surface border border-line/60 p-5 sm:p-6 shadow-soft hover:shadow-md hover:border-line-strong transition-all duration-200">
      {/* Top Meta Bar: Queue position, scheduled slot, and source badge */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-line/40">
        <div className="flex flex-wrap items-center gap-2">
          {view === "next" && (
            <>
              {isTop ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-brand/10 text-brand border border-brand/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  #1 Up next
                </span>
              ) : isHighPriority ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-brand/10 text-brand">
                  <span className="font-semibold">#{p.place}</span>
                  <span>·</span>
                  <span>Priority</span>
                </span>
              ) : (
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-surface-2 text-muted">
                  #{p.place}
                </span>
              )}

              {p.slotAt && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-surface-2 text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  Drafts {shortWhen(p.slotAt, p.timezone, p.now)}
                </span>
              )}
              {idea.scheduled_for && !p.slotAt && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-surface-2 text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  Drafts {shortWhen(idea.scheduled_for, p.timezone, p.now)}
                </span>
              )}
            </>
          )}

          {source.href ? (
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] text-muted hover:text-brand bg-surface-2/60 transition-colors"
            >
              {source.text} ↗
            </a>
          ) : source.text !== "Found by Minions" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] text-muted bg-surface-2/60">
              {source.text}
            </span>
          ) : null}
        </div>

        <Menu label={`More for “${rawTitle}”`} items={items} />
      </div>

      {/* Main Card Content */}
      <div className="pt-3.5 pb-4 space-y-2">
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
        {detail && (
          <p className="line-clamp-2 text-[14px] sm:text-[15px] leading-relaxed text-muted">
            {detail}
          </p>
        )}
      </div>

      {/* Card Action Row */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-line/40">
        <button
          type="button"
          onClick={p.onOpen}
          className="cursor-pointer text-[13px] font-medium text-muted hover:text-ink transition-colors"
        >
          View angle details →
        </button>

        <div className="flex items-center gap-2">
          {view === "next" && (
            <button
              type="button"
              onClick={p.onWrite}
              disabled={p.starting}
              className={
                isTop
                  ? buttonStyles({
                      variant: "primary",
                      size: "sm",
                      className: "min-h-11 px-5 cursor-pointer shadow-xs",
                    })
                  : buttonStyles({
                      variant: "secondary",
                      size: "sm",
                      className: "min-h-11 px-4 cursor-pointer hover:bg-surface-2 text-ink",
                    })
              }
            >
              {p.starting ? "Starting…" : "Write now"}
            </button>
          )}

          {view === "written" && (
            <Link
              href={
                idea.draftAssetId
                  ? `/editorial?id=${encodeURIComponent(idea.draftAssetId)}`
                  : published
                  ? "/posts?show=posted"
                  : "/posts"
              }
              className={buttonStyles({
                variant: "secondary",
                size: "sm",
                className: "min-h-11 px-4",
              })}
            >
              {idea.draftAssetId
                ? published
                  ? "See post"
                  : "Review post"
                : published
                ? "Posted"
                : "See posts"}
            </Link>
          )}

          {view === "aside" && (
            <button
              type="button"
              onClick={p.onBringBack}
              className={buttonStyles({
                variant: "secondary",
                size: "sm",
                className: "min-h-11 px-4 cursor-pointer",
              })}
            >
              Bring back
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { IDEA_STAGES, IDEA_STAGE_HINTS, IDEA_STAGE_LABELS } from "@/constants/ideaStage";
import { countByStage, type IdeaOrder, type StageFilter } from "@/lib/ideaFilter";
import type { IdeaItem } from "@/types";

const STAGE_FILTERS: StageFilter[] = ["ALL", ...IDEA_STAGES];

interface Props {
  ideas: IdeaItem[];
  stage: StageFilter;
  query: string;
  order: IdeaOrder;
  onStageChange: (stage: StageFilter) => void;
  onQueryChange: (query: string) => void;
  onOrderChange: (order: IdeaOrder) => void;
}

/** The sticky search box and stage chips above the idea grid. Stages nothing is in stay out of the way. */
export default function IdeaFilters({ ideas, stage, query, order, onStageChange, onQueryChange, onOrderChange }: Props) {
  const stages = STAGE_FILTERS.filter((option) => option === "ALL" || option === stage || countByStage(ideas, option) > 0);
  return (
    <div className="sticky top-14 md:top-0 z-30 bg-[#0a0d12] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pt-3 pb-3.5 space-y-3 border-b border-line shadow-xl shadow-black/40">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ideas by title or keyword..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="min-h-11 w-full bg-surface border border-line focus:border-brand rounded-xl pl-9 pr-8 py-2 text-xs text-ink placeholder:text-subtle outline-none transition-all"
          />
          {query && (
            <button
              onClick={() => onQueryChange("")}
              className="absolute right-1 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-subtle hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs text-muted">
          <span>Sort</span>
          <select
            value={order}
            onChange={(e) => onOrderChange(e.target.value as IdeaOrder)}
            className="min-h-11 cursor-pointer rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink outline-none focus:border-brand"
          >
            <option value="OLDEST">Oldest first (drafted next)</option>
            <option value="NEWEST">Newest first</option>
          </select>
        </label>
      </div>

      <details className="lg:hidden rounded-xl border border-line bg-surface px-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="h-4 w-4 text-brand" />
          <span>Filters</span>
          {stage !== "ALL" && <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand">Active</span>}
          <span className="ml-auto text-xs text-muted">Tap to adjust</span>
        </summary>
        <div className="grid grid-cols-1 gap-3 border-t border-line py-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-muted">
            <span>Stage</span>
            <select
              value={stage}
              onChange={(e) => onStageChange(e.target.value as StageFilter)}
              className="min-h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink"
            >
              {stages.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All stages" : IDEA_STAGE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>

      <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-line/40 scrollbar-none">
        {stages.map((option) => {
          const isSelected = stage === option;
          return (
            <button
              key={option}
              onClick={() => onStageChange(option)}
              title={option === "ALL" ? "Every idea" : IDEA_STAGE_HINTS[option]}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isSelected ? "bg-surface-2 text-ink border border-brand/60 shadow-sm" : "bg-transparent text-muted hover:text-ink hover:bg-surface"
              }`}
            >
              <span>{option === "ALL" ? "All" : IDEA_STAGE_LABELS[option]}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isSelected ? "bg-brand/20 text-brand" : "bg-surface-2 text-subtle"}`}>
                {countByStage(ideas, option)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import {
  IdeaItem,
} from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Zap,
  CalendarDays,
} from "lucide-react";

import { buttonStyles } from "@/components/ui/Button";
interface CalendarViewProps {
  ideas: IdeaItem[];
  onSelectIdea: (idea: IdeaItem) => void;
  onOpenSchedule: (idea: IdeaItem) => void;
}

export default function CalendarView({
  ideas,
  onSelectIdea,
  onOpenSchedule,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Compute month calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get starting day (Monday = 0, Sunday = 6)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const days: { date: Date; isCurrentMonth: boolean; dayNumber: number; dateKey: string }[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dateKey = d.toISOString().slice(0, 10);
      days.push({ date: d, isCurrentMonth: false, dayNumber: prevMonthLastDay - i, dateKey });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateKey = `${year}-${(month + 1).toString().padStart(2, "0")}-${i.toString().padStart(2, "0")}`;
      days.push({ date: d, isCurrentMonth: true, dayNumber: i, dateKey });
    }

    // Next month filler days to complete 35 or 42 grid cells
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateKey = d.toISOString().slice(0, 10);
      days.push({ date: d, isCurrentMonth: false, dayNumber: i, dateKey });
    }

    return days;
  }, [year, month]);

  // Group ideas by dateKey (YYYY-MM-DD)
  const ideasByDate = useMemo(() => {
    const map: Record<string, IdeaItem[]> = {};
    ideas.forEach((idea) => {
      if (idea.scheduled_for) {
        const dateKey = new Date(idea.scheduled_for).toISOString().slice(0, 10);
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(idea);
      }
    });
    return map;
  }, [ideas]);

  // Unscheduled Harvested ideas
  const unscheduledIdeas = useMemo(() => {
    return ideas.filter((i) => !i.scheduled_for && (i.status === "HARVESTED" || i.status === "REFINED" || i.status === "QUEUED"));
  }, [ideas]);

  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const todayKey = new Date().toISOString().slice(0, 10);

  const getAudienceColor = (aud?: string) => {
    switch (aud) {
      case "ICP":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "PEER":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "BRIDGE":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-line">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-line">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-canvas transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-canvas transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand" />
            {monthName}
          </h2>

          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-mono font-semibold text-brand bg-brand/10 hover:bg-brand/20 border border-brand/30 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <span>Scheduled Post</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span>Draft Ready</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Days of Week + 42 Calendar Cells */}
      <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-xl">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-line bg-canvas/60 text-center py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-subtle">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-slate-500">Sat</div>
          <div className="text-slate-500">Sun</div>
        </div>

        {/* 6-Row Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-line">
          {calendarDays.map((day) => {
            const dayIdeas = ideasByDate[day.dateKey] || [];
            const isToday = day.dateKey === todayKey;

            return (
              <div
                key={day.dateKey}
                className={`min-h-[110px] sm:min-h-[130px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                  day.isCurrentMonth ? "bg-surface" : "bg-[#0A0D12]/50 text-slate-600"
                } ${isToday ? "ring-1 ring-inset ring-brand/50 bg-brand/5" : ""}`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                      isToday
                        ? "bg-brand text-canvas"
                        : day.isCurrentMonth
                        ? "text-muted"
                        : "text-[#475569]"
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {dayIdeas.length > 0 && (
                    <span className="text-[10px] font-mono text-brand font-bold">
                      {dayIdeas.length} {dayIdeas.length === 1 ? "draft" : "drafts"}
                    </span>
                  )}
                </div>

                {/* Ideas on this Day */}
                <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[80px]">
                  {dayIdeas.map((idea) => {
                    const timeStr = idea.scheduled_for
                      ? new Date(idea.scheduled_for).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "";

                    return (
                      <div
                        key={idea.id}
                        onClick={() => onSelectIdea(idea)}
                        className="p-1.5 rounded-lg bg-surface-2 hover:bg-line border border-line hover:border-brand/60 text-left transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[8px] font-bold px-1 rounded ${getAudienceColor(idea.audience)}`}>
                            {idea.audience || "ICP"}
                          </span>
                          <span className="text-[9px] font-mono text-brand shrink-0 font-medium">
                            {timeStr}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-white group-hover:text-brand truncate mt-0.5">
                          {idea.title || idea.raw_idea}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Add Button on Hover (Current Month only) */}
                {day.isCurrentMonth && dayIdeas.length === 0 && (
                  <div className="opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-[#475569] italic">Free slot</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* UNSCHEDULED HARVESTED TRAY */}
      {unscheduledIdeas.length > 0 && (
        <div className="bg-surface p-5 rounded-2xl border border-line space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-bold text-white">
                Unscheduled Ideas Ready for Scheduling ({unscheduledIdeas.length})
              </h3>
            </div>
            <span className="text-xs text-muted">
              Click &quot;Schedule&quot; to assign a date on the calendar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pt-1">
            {unscheduledIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-3 rounded-xl bg-surface-2 hover:bg-line border border-line flex items-center justify-between gap-2 transition-all"
              >
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelectIdea(idea)}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${getAudienceColor(idea.audience)}`}>
                      {idea.audience || "ICP"}
                    </span>
                    <span className="text-[9px] font-mono text-subtle">{idea.target_trade || "—"}</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">
                    {idea.title || idea.raw_idea}
                  </div>
                </div>

                <button
                  onClick={() => onOpenSchedule(idea)}
                  className={buttonStyles({ variant: "soft", size: "sm", className: "shrink-0" })}
                >
                  <CalendarIcon className="w-3 h-3" />
                  <span>Schedule</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

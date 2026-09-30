"use client";

import React, { useState } from "react";
import { IdeaItem } from "@/types";
import {
  X,
  Check,
  Zap,
  AlertCircle,
  CalendarDays,
  Trash2,
} from "lucide-react";

import { buttonStyles } from "@/components/ui/Button";
interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: IdeaItem | null;
  onScheduleSuccess: (updatedIdea: IdeaItem) => void;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  idea,
  onScheduleSuccess
}: ScheduleModalProps) {
  // Compute default date/time (tomorrow at 09:00 AM in local time)
  const getTomorrowDefault = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const initialDateTime = idea?.scheduled_for
    ? new Date(idea.scheduled_for).toISOString().slice(0, 16)
    : getTomorrowDefault();

  const [selectedDateTime, setSelectedDateTime] = useState<string>(initialDateTime);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every hook above this line runs on every render; the early return has to
  // come after them or React sees a changing hook count between renders.
  if (!isOpen || !idea) return null;

  // Quick preset helper
  const setPreset = (daysFromNow: number, hour: number, minute: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, minute, 0, 0);
    // Format to YYYY-MM-DDTHH:MM for datetime-local
    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}`;
    setSelectedDateTime(formatted);
  };

  const handleSaveSchedule = async (dateTimeToSave: string | null, newStatus: string = "QUEUED") => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ideas/${idea.id || idea.ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduled_for: dateTimeToSave ? new Date(dateTimeToSave).toISOString() : null,
          status: newStatus
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule idea");
      }

      onScheduleSuccess(data.idea);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while scheduling.");
      setIsSaving(false);
    }
  };

  const handleUnschedule = async () => {
    await handleSaveSchedule(null, "HARVESTED");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-line ring-1 ring-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-ink">
        
        {/* Header */}
        <div className="p-5 border-b border-line flex items-start justify-between gap-4 bg-canvas/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">
                Schedule Auto-Drafting
              </h3>
            </div>
            <p className="text-xs text-muted line-clamp-1">
              {idea.title || idea.raw_idea}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-white hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-subtle">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreset(1, 9, 0)}
                className="p-2.5 rounded-xl bg-surface-2 hover:bg-line border border-line hover:border-brand/50 text-left text-xs transition-all cursor-pointer group"
              >
                <div className="font-semibold text-white group-hover:text-brand">Tomorrow 9:00 AM</div>
                <div className="text-[10px] text-subtle">Morning slot</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset(1, 14, 0)}
                className="p-2.5 rounded-xl bg-surface-2 hover:bg-line border border-line hover:border-brand/50 text-left text-xs transition-all cursor-pointer group"
              >
                <div className="font-semibold text-white group-hover:text-brand">Tomorrow 2:00 PM</div>
                <div className="text-[10px] text-subtle">Afternoon slot</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset(2, 10, 0)}
                className="p-2.5 rounded-xl bg-surface-2 hover:bg-line border border-line hover:border-brand/50 text-left text-xs transition-all cursor-pointer group"
              >
                <div className="font-semibold text-white group-hover:text-brand">In 2 Days 10:00 AM</div>
                <div className="text-[10px] text-subtle">Midweek buffer</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset(7, 9, 0)}
                className="p-2.5 rounded-xl bg-surface-2 hover:bg-line border border-line hover:border-brand/50 text-left text-xs transition-all cursor-pointer group"
              >
                <div className="font-semibold text-white group-hover:text-brand">Next Week 9:00 AM</div>
                <div className="text-[10px] text-subtle">Future queue</div>
              </button>
            </div>
          </div>

          {/* Custom Date & Time Picker */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-subtle">
              Custom Date & Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={selectedDateTime}
                onChange={(e) => setSelectedDateTime(e.target.value)}
                className="w-full bg-canvas border border-line focus:border-brand rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono outline-none transition-colors cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-subtle">
              Minions will prepare this idea at the scheduled time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-line bg-canvas/60 flex items-center justify-between gap-3">
          {idea.scheduled_for ? (
            <button
              type="button"
              onClick={handleUnschedule}
              disabled={isSaving}
              className="px-3.5 py-2 text-xs font-semibold text-danger hover:bg-danger/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Unschedule</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSaveSchedule(null, "QUEUED")}
              disabled={isSaving}
              className="px-3.5 py-2 text-xs font-semibold text-muted hover:text-white bg-surface-2 hover:bg-surface-3 border border-line rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Add to queue without fixed timestamp (runs in priority order)"
            >
              <Zap className="w-3.5 h-3.5 text-gold" />
              <span>Add to Auto-Queue</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveSchedule(selectedDateTime, "QUEUED")}
              disabled={isSaving || !selectedDateTime}
              className={buttonStyles({ size: "sm" })}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? "Scheduling..." : "Save Schedule"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

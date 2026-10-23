"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { Skeleton, SkeletonGroup, SkeletonText } from "@/components/ui/Skeleton";
import { MEMORY_KIND_META, type MemoryKind } from "@/constants/contentLanes";
import { PULSE_DAYS } from "@/lib/pulse/week";
import type { PulseDTO, PulseHistoryItem } from "@/services/pulse";
import { sectionClass } from "@/components/ui/fieldStyles";

const selectClass = "rounded-lg border border-line bg-[#0B1016] px-2.5 py-1.5 text-xs text-ink cursor-pointer";

function timezones(current: string): string[] {
  try {
    const all = Intl.supportedValuesOf("timeZone");
    return all.includes(current) ? all : [current, ...all];
  } catch {
    return [current];
  }
}

/**
 * The weekly question's settings and the last 12 weeks' answers, on the
 * Brand page's Experience tab (phase 6).
 */
export default function WeeklyUpdatesPanel() {
  const [pulse, setPulse] = useState<PulseDTO | null>(null);
  const [history, setHistory] = useState<PulseHistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [p, h] = await Promise.all([apiClient.get<PulseDTO>("/api/pulse"), apiClient.get<PulseHistoryItem[]>("/api/pulse/history")]);
        setPulse(p);
        setHistory(h);
      } catch (e) {
        setError(toErrorMessage(e, "Couldn't load your weekly updates."));
      }
    })();
  }, []);

  const zones = useMemo(() => (pulse ? timezones(pulse.settings.timezone) : []), [pulse]);

  const save = async (patch: Record<string, unknown>) => {
    setError(null);
    try {
      setPulse(await apiClient.patch<PulseDTO>("/api/pulse/settings", patch));
      window.dispatchEvent(new Event("minions-counts-updated"));
    } catch (e) {
      setError(toErrorMessage(e, "Couldn't save that."));
    }
  };

  if (!pulse) {
    if (error) return <p className="text-xs text-red-400">{error}</p>;
    return (
      <SkeletonGroup label="Loading weekly updates" className={sectionClass}>
        <Skeleton className="h-5 w-40" />
        <SkeletonText lines={2} />
        <Skeleton className="h-10 w-full" />
      </SkeletonGroup>
    );
  }
  const s = pulse.settings;

  return (
    <div className={sectionClass}>
      <div>
        <h3 className="text-base font-bold text-ink flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-brand" />
          Weekly updates
        </h3>
        <p className="text-xs text-muted mt-0.5">
          Once a week Editorial Studio asks what you built, learned, noticed or changed your mind about. The notes you keep
          land here, and the next harvest builds an idea on them first.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={s.enabled} onChange={(e) => void save({ enabled: e.target.checked })} className="accent-brand" />
          Ask me every week, from
        </label>
        <select value={s.day} disabled={!s.enabled} onChange={(e) => void save({ day: Number(e.target.value) })} aria-label="Day the question appears" className={selectClass}>
          {PULSE_DAYS.map((d, i) => (
            <option key={d} value={i + 1}>
              {d}
            </option>
          ))}
        </select>
        <span>to Sunday, in</span>
        <select value={s.timezone} onChange={(e) => void save({ timezone: e.target.value })} aria-label="Workspace timezone" className={`${selectClass} max-w-[220px]`}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {history && history.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-subtle">
          No weekly answers yet. The first question appears on {PULSE_DAYS[s.day - 1]}.
        </p>
      )}
      <ul className="space-y-3">
        {(history ?? []).map((h) => (
          <li key={h.week_start} className="rounded-xl border border-line bg-[#0B1016] p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-subtle">
              <span>Week of {h.week_start}</span>
              <span>{h.status === "SKIPPED" ? "Skipped" : `${h.memories.length} note${h.memories.length === 1 ? "" : "s"} kept`}</span>
            </div>
            {h.answer && <p className="text-xs text-muted whitespace-pre-line">{h.answer}</p>}
            {h.memories.map((m) => (
              <p key={m.id} className={`text-xs text-ink ${m.is_active ? "" : "line-through opacity-50"}`}>
                <span className="mr-1.5 rounded bg-line px-1.5 py-0.5 font-mono text-[10px] text-muted">
                  {MEMORY_KIND_META[m.kind as MemoryKind]?.label ?? m.kind}
                </span>
                {m.content}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

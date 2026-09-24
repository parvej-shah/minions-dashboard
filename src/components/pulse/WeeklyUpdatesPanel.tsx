"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { MEMORY_KIND_META, type MemoryKind } from "@/constants/contentLanes";
import { PULSE_DAYS } from "@/lib/pulse/week";
import type { PulseDTO, PulseHistoryItem } from "@/services/pulse";

const cardClass = "p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm";
const selectClass = "rounded-lg border border-[#1F2D3D] bg-[#0B1016] px-2.5 py-1.5 text-xs text-[#F1F5F9] cursor-pointer";

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

  if (!pulse) return error ? <p className="text-xs text-red-400">{error}</p> : null;
  const s = pulse.settings;

  return (
    <div className={cardClass}>
      <div>
        <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#00C9A7]" />
          Weekly updates
        </h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Once a week the home page asks what you built, learned, noticed or changed your mind about. The notes you keep
          land here, and the next harvest builds an idea on them first.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={s.enabled} onChange={(e) => void save({ enabled: e.target.checked })} className="accent-[#00C9A7]" />
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
        <p className="rounded-lg border border-dashed border-[#1F2D3D] px-3 py-6 text-center text-xs text-[#64748B]">
          No weekly answers yet. The first question appears on {PULSE_DAYS[s.day - 1]}.
        </p>
      )}
      <ul className="space-y-3">
        {(history ?? []).map((h) => (
          <li key={h.week_start} className="rounded-xl border border-[#1F2D3D] bg-[#0B1016] p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
              <span>Week of {h.week_start}</span>
              <span>{h.status === "SKIPPED" ? "Skipped" : `${h.memories.length} note${h.memories.length === 1 ? "" : "s"} kept`}</span>
            </div>
            {h.answer && <p className="text-xs text-[#94A3B8] whitespace-pre-line">{h.answer}</p>}
            {h.memories.map((m) => (
              <p key={m.id} className={`text-xs text-[#F1F5F9] ${m.is_active ? "" : "line-through opacity-50"}`}>
                <span className="mr-1.5 rounded bg-[#1F2D3D] px-1.5 py-0.5 font-mono text-[10px] text-[#94A3B8]">
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

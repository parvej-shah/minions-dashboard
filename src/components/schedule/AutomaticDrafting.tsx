"use client";

import React, { useState } from "react";
import { Bot, RefreshCw } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { formatPostTime } from "@/lib/postTime";

interface DraftingStatus {
  exists: boolean;
  drafting_on: boolean;
  service_running: boolean;
  service_last_run_at: string | null;
  timezone: string;
  next_slot_at: string | null;
  next_lane_name: string | null;
}

type Tone = "off" | "on" | "warn";

function describe(s: DraftingStatus): { tone: Tone; title: string; detail: string } {
  if (!s.exists) return { tone: "off", title: "Off", detail: "Set your schedule below, then turn this on." };
  if (!s.drafting_on) {
    return { tone: "off", title: "Off", detail: "No drafts are prepared automatically while this is off." };
  }
  if (!s.service_running) {
    return {
      tone: "warn",
      title: "On, but the drafting service isn't running",
      detail: "The setting is on, but the drafting service is not running. Posts already scheduled are unaffected.",
    };
  }
  const next = s.next_slot_at
    ? `Next draft: ${formatPostTime(s.next_slot_at, s.timezone)}${s.next_lane_name ? ` (${s.next_lane_name})` : ""}.`
    : "No slots in the next 7 days. Check the cadence and the plan dates.";
  return { tone: "on", title: "On", detail: next };
}

const TONE_STYLE: Record<Tone, { box: string; dot: string; text: string }> = {
  off: { box: "border-line", dot: "bg-subtle", text: "text-muted" },
  on: { box: "border-brand/40", dot: "bg-brand", text: "text-brand" },
  warn: { box: "border-gold/40", dot: "bg-gold", text: "text-gold" },
};

/**
 * The single switch for automatic drafting in this workspace, with a status
 * line read from what actually ran: the drafting job's last check-in, not just
 * the setting. Replaces the separate "Schedule active" and "Fill slots
 * automatically" switches.
 */
export default function AutomaticDrafting({ onChanged, onMessage, onEnableWithSave, canSaveSchedule, blockedByUnsavedChanges }: { onChanged: () => void; onMessage: (m: string) => void; onEnableWithSave: () => Promise<boolean>; canSaveSchedule: boolean; blockedByUnsavedChanges: boolean }) {
  const { data, isLoading, error, reload } = useApiResource<DraftingStatus | null>("/api/plan/status", null, {
    errorMessage: "Could not load the drafting status",
  });
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    try {
      await reload();
    } finally {
      setRetrying(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-surface p-5 text-sm text-gold">
        <span>{error}</span>
        <button type="button" onClick={() => void retry()} disabled={retrying} aria-busy={retrying} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-gold/40 px-3 font-semibold hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50">
          {retrying && <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {retrying ? "Trying again…" : "Try again"}
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return <LoadingState label="Checking automatic drafting" rows={1} />;
  }

  const { tone, title, detail } = describe(data);
  const style = TONE_STYLE[tone];

  const toggle = async () => {
    setSaving(true);
    try {
      await apiClient.patch("/api/plan", { filler_enabled: !data.drafting_on });
      onMessage(data.drafting_on ? "Automatic drafting switched off" : "Automatic drafting switched on: the next 7 days are planned");
      await reload();
      onChanged();
    } catch (e) {
      onMessage(toErrorMessage(e, "Could not change automatic drafting"));
    } finally {
      setSaving(false);
    }
  };

  const saveAndEnable = async () => {
    setSaving(true);
    try {
      await onEnableWithSave();
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const showSaveAndEnable = !data.drafting_on && (!data.exists || blockedByUnsavedChanges);

  return (
    <div className={`flex flex-col gap-4 rounded-2xl border bg-surface p-4 shadow-sm sm:flex-row sm:px-5 sm:items-start sm:justify-between ${style.box}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
          <Bot className="w-4 h-4 text-brand" />
          Automatic drafting
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.text}`}>
            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
            {title}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>
        {saving && !showSaveAndEnable && (
          <p role="status" aria-live="polite" className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-brand">
            <RefreshCw className="h-3 w-3 animate-spin" />
            {data.drafting_on ? "Turning automatic drafting off…" : "Turning automatic drafting on…"}
          </p>
        )}
        {blockedByUnsavedChanges && data.exists && !data.drafting_on && <p className="mt-2 text-xs font-medium text-gold">Save these settings to use the new schedule.</p>}
      </div>
      {showSaveAndEnable ? (
        <button
          type="button"
          aria-busy={saving}
          disabled={saving || !canSaveSchedule}
          onClick={() => void saveAndEnable()}
          className="inline-flex min-h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border-b-4 border-brand-edge bg-brand px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-subtle sm:w-auto"
        >
          {saving && <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving ? "Saving & turning on…" : "Save & turn on"}
        </button>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={data.drafting_on}
          aria-label="Automatic drafting"
          aria-busy={saving}
          title={data.drafting_on ? "Turn automatic drafting off" : "Turn automatic drafting on"}
          disabled={saving || !data.exists}
          onClick={() => void toggle()}
          className={`h-11 w-11 self-end rounded-full p-0.5 transition-colors flex items-center shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60 sm:h-6 sm:w-11 sm:self-auto ${data.drafting_on ? "bg-brand" : "bg-line"}`}
        >
          <div className={`h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${data.drafting_on ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      )}
    </div>
  );
}

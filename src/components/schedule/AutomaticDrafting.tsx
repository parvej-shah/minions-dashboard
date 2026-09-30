"use client";

import React, { useState } from "react";
import { Bot, RefreshCw } from "lucide-react";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useApiResource } from "@/hooks/useApiResource";
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
  if (!s.exists) return { tone: "off", title: "Off", detail: "Save your rhythm above first. Nothing is drafted on its own yet." };
  if (!s.drafting_on) {
    return { tone: "off", title: "Off", detail: "Nothing is drafted on its own. Drafts are only made when you start one, and only go out when you publish or schedule them." };
  }
  if (!s.service_running) {
    return {
      tone: "warn",
      title: "On, but the drafting service isn't running",
      detail: "Your switch is on, but nothing will be drafted until the service runs again. Posts you've already scheduled still go out.",
    };
  }
  const next = s.next_slot_at
    ? `Next draft: ${formatPostTime(s.next_slot_at, s.timezone)}${s.next_lane_name ? ` (${s.next_lane_name})` : ""}.`
    : "No slots in the next 7 days. Check the cadence and the plan dates.";
  return { tone: "on", title: "On", detail: `A draft is written for each slot at its time. ${next}` };
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
export default function AutomaticDrafting({ onChanged, onMessage, blockedByUnsavedChanges }: { onChanged: () => void; onMessage: (m: string) => void; blockedByUnsavedChanges: boolean }) {
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-surface p-5 text-sm text-[#FCD34D]">
        <span>{error}</span>
        <button type="button" onClick={() => void retry()} disabled={retrying} aria-busy={retrying} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-gold/40 px-3 font-semibold hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50">
          {retrying && <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {retrying ? "Trying again…" : "Try again"}
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-5 rounded-2xl bg-surface border border-line text-xs text-subtle flex items-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking automatic drafting…
      </div>
    );
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

  return (
    <div className={`p-5 rounded-2xl bg-surface border ${style.box} flex items-start justify-between gap-4 shadow-sm`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
          <Bot className="w-4 h-4 text-brand" />
          Automatic drafting
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.text}`}>
            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
            {title}
          </span>
        </div>
        <p className="text-xs text-muted mt-1.5 leading-relaxed">{detail}</p>
        {saving && (
          <p role="status" aria-live="polite" className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-brand">
            <RefreshCw className="h-3 w-3 animate-spin" />
            {data.drafting_on ? "Turning automatic drafting off…" : "Turning automatic drafting on…"}
          </p>
        )}
        {blockedByUnsavedChanges && data.exists && <p className="mt-2 text-sm font-medium text-[#FBBF24]">Save your rhythm above before changing this switch.</p>}
        <p className="mt-2 text-[11px] font-medium text-subtle">Drafting and publishing are separate. Your review choice above controls what goes live.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={data.drafting_on}
        aria-label="Automatic drafting"
        aria-busy={saving}
        title={!data.exists || blockedByUnsavedChanges ? "Save your rhythm above first" : data.drafting_on ? "Turn automatic drafting off" : "Turn automatic drafting on"}
        disabled={saving || !data.exists || blockedByUnsavedChanges}
        onClick={() => void toggle()}
        className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60 ${data.drafting_on ? "bg-brand" : "bg-line"}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${data.drafting_on ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

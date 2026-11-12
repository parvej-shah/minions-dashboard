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

type Tone = "off" | "on";

function describe(s: DraftingStatus): { tone: Tone; title: string; detail: string } {
  if (!s.exists) return { tone: "off", title: "Off", detail: "Set your publishing pace below, then turn this on." };
  if (!s.drafting_on) {
    return { tone: "off", title: "Off", detail: "Automatic drafting is off. Turn this on to have Minions draft according to your pace." };
  }
  const next = s.next_slot_at
    ? `Next draft scheduled for ${formatPostTime(s.next_slot_at, s.timezone)}.`
    : "Active. Drafts are prepared automatically for your upcoming slots.";
  return { tone: "on", title: "Active", detail: next };
}

const TONE_STYLE: Record<Tone, { box: string; dot: string; text: string }> = {
  off: { box: "border-line", dot: "bg-subtle", text: "text-muted" },
  on: { box: "border-brand/40 bg-brand/[0.02]", dot: "bg-brand", text: "text-brand" },
};

/**
 * The single switch for automatic drafting in this workspace.
 * Displays executive-calibrated status without leaking backend infrastructure plumbing.
 */
export default function AutomaticDrafting({
  onChanged,
  onMessage,
  onEnableWithSave,
  canSaveSchedule,
  blockedByUnsavedChanges,
}: {
  onChanged: () => void;
  onMessage: (m: string) => void;
  onEnableWithSave: () => Promise<boolean>;
  canSaveSchedule: boolean;
  blockedByUnsavedChanges: boolean;
}) {
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5 text-sm text-ink">
        <span className="text-muted">{error}</span>
        <button
          type="button"
          onClick={() => void retry()}
          disabled={retrying}
          aria-busy={retrying}
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
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
      onMessage(data.drafting_on ? "Automatic drafting paused" : "Automatic drafting active: your upcoming posts are scheduled");
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
    <div className={`flex flex-col gap-4 rounded-2xl border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5 ${style.box}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
          <Bot className="h-4 w-4 text-brand" />
          Automatic drafting
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.text}`}>
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            {title}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>
        {saving && !showSaveAndEnable && (
          <p role="status" aria-live="polite" className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-brand">
            <RefreshCw className="h-3 w-3 animate-spin" />
            {data.drafting_on ? "Pausing automatic drafting…" : "Activating automatic drafting…"}
          </p>
        )}
        {blockedByUnsavedChanges && data.exists && !data.drafting_on && (
          <p className="mt-1.5 text-xs font-medium text-brand">Save settings below to use your updated pace.</p>
        )}
      </div>
      {showSaveAndEnable ? (
        <button
          type="button"
          aria-busy={saving}
          disabled={saving || !canSaveSchedule}
          onClick={() => void saveAndEnable()}
          className="inline-flex min-h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand px-5 text-sm font-semibold text-brand-ink transition-transform active:scale-[0.985] hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
          title={data.drafting_on ? "Pause automatic drafting" : "Turn on automatic drafting"}
          disabled={saving || !data.exists}
          onClick={() => void toggle()}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            data.drafting_on ? "bg-brand" : "bg-line"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              data.drafting_on ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      )}
    </div>
  );
}

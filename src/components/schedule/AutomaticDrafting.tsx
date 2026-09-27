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
  if (!s.exists) return { tone: "off", title: "Off", detail: "Save a schedule below first. Nothing is drafted on its own." };
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
  off: { box: "border-[#1F2D3D]", dot: "bg-[#64748B]", text: "text-[#94A3B8]" },
  on: { box: "border-[#00C9A7]/40", dot: "bg-[#00C9A7]", text: "text-[#00C9A7]" },
  warn: { box: "border-[#F59E0B]/40", dot: "bg-[#F59E0B]", text: "text-[#F59E0B]" },
};

/**
 * The single switch for automatic drafting in this workspace, with a status
 * line read from what actually ran: the drafting job's last check-in, not just
 * the setting. Replaces the separate "Schedule active" and "Fill slots
 * automatically" switches.
 */
export default function AutomaticDrafting({ onChanged, onMessage }: { onChanged: () => void; onMessage: (m: string) => void }) {
  const { data, isLoading, reload } = useApiResource<DraftingStatus | null>("/api/plan/status", null, {
    errorMessage: "Could not load the drafting status",
  });
  const [saving, setSaving] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="p-5 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] text-xs text-[#64748B] flex items-center gap-2">
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
    <div className={`p-5 rounded-2xl bg-[#0F1419] border ${style.box} flex items-start justify-between gap-4 shadow-sm`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-bold text-[#F1F5F9]">
          <Bot className="w-4 h-4 text-[#00C9A7]" />
          Automatic drafting
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.text}`}>
            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
            {title}
          </span>
        </div>
        <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">{detail}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={data.drafting_on}
        aria-label="Automatic drafting"
        disabled={saving || !data.exists}
        onClick={() => void toggle()}
        className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 disabled:opacity-60 ${data.drafting_on ? "bg-[#00C9A7]" : "bg-[#1F2D3D]"}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${data.drafting_on ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

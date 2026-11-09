"use client";

import { RefreshCw } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";

interface Job {
  key: string;
  name: string;
  when: string;
  does: string;
  everyMinutes: number | null;
  state: "RUNNING" | "STOPPED" | "ON_DEMAND";
  last_run_at: string | null;
}

interface Workspace {
  client_id: string;
  name: string;
  slug: string;
  status: string;
  drafting_on: boolean;
  require_review: boolean;
}

interface Payload {
  jobs: Job[];
  workspaces: Workspace[];
}

const STATE: Record<Job["state"], { label: string; cls: string }> = {
  RUNNING: { label: "Running", cls: "bg-brand/10 text-brand border-brand/30" },
  STOPPED: { label: "Not running", cls: "bg-subtle/10 text-muted border-subtle/30" },
  ON_DEMAND: { label: "When called", cls: "bg-brand/10 text-brand border-brand/30" },
};

function ago(iso: string | null): string {
  if (!iso) return "No check-in yet";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/**
 * Which background jobs are actually running, from each one's last check-in
 * (src/services/jobHeartbeat.ts), and which workspaces have automatic
 * drafting on. A workspace drafts on its own only when its switch is on AND
 * the Automatic drafting job is running.
 */
export default function AutomationsPage() {
  const { data, isLoading, reload } = useApiResource<Payload | null>("/api/platform-admin/automations", null, {
    errorMessage: "Could not load automations",
  });

  if (isLoading || !data) return <LoadingState label="Loading automations…" />;

  const drafting = data.jobs.find((j) => j.key === "00b_posting_scheduler_dispatcher");
  const onCount = data.workspaces.filter((w) => w.drafting_on).length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
          <p className="text-sm text-muted mt-1">
            What actually ran, from each job&apos;s last check-in. A timed job counts as not running after it misses three runs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink border border-line rounded-lg px-3 py-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-surface border border-line text-sm text-ink">
        {drafting?.state === "RUNNING"
          ? `Automatic drafting is running. ${onCount} workspace${onCount === 1 ? " has" : "s have"} it switched on.`
          : `Automatic drafting is not running, so no workspace drafts on its own${onCount ? ` (even though ${onCount} ha${onCount === 1 ? "s" : "ve"} the switch on)` : ""}.`}
      </div>

      <div className="rounded-2xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-[11px] text-muted">
            <tr>
              <th className="text-left px-4 py-3">Job</th>
              <th className="text-left px-4 py-3">State</th>
              <th className="text-left px-4 py-3">Last ran</th>
              <th className="text-left px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {data.jobs.map((j) => (
              <tr key={j.key} className="border-t border-line">
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold text-ink">{j.name}</div>
                  <div className="text-xs text-muted mt-0.5">{j.does}</div>
                  <div className="text-[10px] font-mono text-subtle mt-1">{j.key}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className={`inline-block text-[11px] font-semibold border rounded-full px-2 py-0.5 whitespace-nowrap ${STATE[j.state].cls}`}>{STATE[j.state].label}</span>
                </td>
                <td className="px-4 py-3 align-top text-xs text-muted whitespace-nowrap" title={j.last_run_at ?? undefined}>
                  {ago(j.last_run_at)}
                </td>
                <td className="px-4 py-3 align-top text-xs text-muted">{j.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold">Workspaces</h2>
        <div className="rounded-2xl border border-line overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-[11px] text-muted">
              <tr>
                <th className="text-left px-4 py-3">Workspace</th>
                <th className="text-left px-4 py-3">Automatic drafting</th>
                <th className="text-left px-4 py-3">Review before posting</th>
              </tr>
            </thead>
            <tbody>
              {data.workspaces.map((w) => (
                <tr key={w.client_id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{w.name}</div>
                    <div className="text-[10px] font-mono text-subtle">
                      {w.slug} · {w.status}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold ${w.drafting_on ? "text-brand" : "text-subtle"}`}>{w.drafting_on ? "On" : "Off"}</td>
                  <td className="px-4 py-3 text-xs text-muted">{w.require_review ? "Required" : "Off: passing slot drafts post on their own"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

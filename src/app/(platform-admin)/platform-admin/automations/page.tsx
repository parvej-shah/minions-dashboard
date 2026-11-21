"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, Search, X, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import { filterWorkspaces, type WorkspaceItem } from "@/lib/admin/adminNav";

interface Job {
  key: string;
  name: string;
  when: string;
  does: string;
  everyMinutes: number | null;
  state: "RUNNING" | "STOPPED" | "ON_DEMAND";
  last_run_at: string | null;
}

interface Payload {
  jobs: Job[];
  workspaces: WorkspaceItem[];
}

const STATE_CONFIG: Record<
  Job["state"],
  { label: string; badgeCls: string; dotCls: string }
> = {
  RUNNING: {
    label: "Running",
    badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    dotCls: "bg-emerald-500 animate-pulse",
  },
  STOPPED: {
    label: "Not running",
    badgeCls: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    dotCls: "bg-amber-500",
  },
  ON_DEMAND: {
    label: "On demand",
    badgeCls: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    dotCls: "bg-blue-500",
  },
};

const WORKSPACE_FILTERS = [
  { id: "ALL", label: "All Workspaces" },
  { id: "DRAFTING_ON", label: "Drafting ON" },
  { id: "DRAFTING_OFF", label: "Drafting OFF" },
  { id: "AUTOPILOT", label: "Autopilot" },
  { id: "REVIEW_REQUIRED", label: "Review Required" },
];

function formatTimeAgo(iso: string | null): string {
  if (!iso) return "No check-in yet";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function AutomationsPage() {
  const { data, isLoading, reload } = useApiResource<Payload | null>(
    "/api/platform-admin/automations",
    null,
    { errorMessage: "Could not load automations" }
  );

  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [workspaceFilter, setWorkspaceFilter] = useState("ALL");

  if (isLoading || !data) return <LoadingState label="Loading automations…" />;

  const draftingJob = data.jobs.find(
    (j) => j.key === "00b_posting_scheduler_dispatcher"
  );
  const isDraftingRunning = draftingJob?.state === "RUNNING";
  const onCount = data.workspaces.filter((w) => w.drafting_on).length;
  const filteredWorkspaces = filterWorkspaces(data.workspaces, workspaceQuery, workspaceFilter);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Background Automations</h1>
          <p className="text-sm text-muted mt-0.5">
            Real-time heartbeat status from background jobs and workspace drafting engines.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-2 border border-line text-xs font-semibold text-muted hover:text-ink transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Primary Engine Status Card */}
      <div
        className={`p-5 rounded-2xl border transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${
          isDraftingRunning
            ? "bg-emerald-500/[0.04] border-emerald-500/20"
            : "bg-amber-500/[0.04] border-amber-500/20"
        }`}
      >
        <div className="flex items-start gap-3.5">
          {isDraftingRunning ? (
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div className="space-y-1">
            <div className="text-sm font-bold text-ink">
              {isDraftingRunning
                ? "Automatic Drafting Engine is Active"
                : "Automatic Drafting Engine is Stopped"}
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {isDraftingRunning ? (
                <>
                  Posting scheduler dispatcher is running smoothly.{" "}
                  <strong className="text-ink">{onCount}</strong> of{" "}
                  <strong className="text-ink">{data.workspaces.length}</strong> workspaces
                  currently have automatic drafting turned on.
                </>
              ) : (
                <>
                  Dispatcher is currently not checking in. Even though{" "}
                  <strong className="text-ink">{onCount}</strong> workspace(s) have their
                  switch ON, automatic drafting is paused until the job resumes.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Background Jobs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Background Jobs ({data.jobs.length})</h2>
          <span className="text-[11px] text-muted font-medium">Heartbeat interval: 3 missed runs = STOPPED</span>
        </div>

        <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-line text-muted font-medium text-[11px] bg-surface-2/40">
                  <th className="p-3.5 font-semibold">JOB</th>
                  <th className="p-3.5 font-semibold">STATUS</th>
                  <th className="p-3.5 font-semibold">LAST CHECK-IN</th>
                  <th className="p-3.5 font-semibold">SCHEDULE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {data.jobs.map((j) => {
                  const stateInfo = STATE_CONFIG[j.state] ?? STATE_CONFIG.STOPPED;

                  return (
                    <tr key={j.key} className="hover:bg-surface-2/60 transition-colors">
                      <td className="p-3.5 align-top">
                        <div className="font-semibold text-ink">{j.name}</div>
                        <div className="text-xs text-muted mt-0.5 max-w-md">{j.does}</div>
                        <div className="text-[10px] font-mono text-subtle mt-1">{j.key}</div>
                      </td>
                      <td className="p-3.5 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${stateInfo.badgeCls}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${stateInfo.dotCls}`} />
                          <span>{stateInfo.label}</span>
                        </span>
                      </td>
                      <td
                        className="p-3.5 align-top font-mono tabular-nums text-muted"
                        title={j.last_run_at ?? undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-subtle" />
                          <span>{formatTimeAgo(j.last_run_at)}</span>
                        </span>
                      </td>
                      <td className="p-3.5 align-top text-xs text-muted font-medium">
                        {j.when}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Workspaces Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">
              Workspace Drafting Status ({data.workspaces.length})
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Review requirements and automatic filler state per workspace.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter workspace…"
                value={workspaceQuery}
                onChange={(e) => setWorkspaceQuery(e.target.value)}
                className="bg-surface-2 border border-line rounded-xl pl-8 pr-7 py-1 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-brand/60"
              />
              {workspaceQuery && (
                <button
                  onClick={() => setWorkspaceQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  aria-label="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-xl border border-line/60">
              {WORKSPACE_FILTERS.map((tab) => {
                const active = workspaceFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setWorkspaceFilter(tab.id)}
                    className={`px-2 py-0.5 rounded-lg text-xs transition-all font-medium ${
                      active
                        ? "bg-surface font-semibold text-ink shadow-sm"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Workspaces Table */}
        <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          {filteredWorkspaces.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              No workspaces match your search or filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-line text-muted font-medium text-[11px] bg-surface-2/40">
                    <th className="p-3.5 font-semibold">WORKSPACE</th>
                    <th className="p-3.5 font-semibold">AUTO DRAFTING</th>
                    <th className="p-3.5 font-semibold">REVIEW GATE</th>
                    <th className="p-3.5 font-semibold text-right">MANAGE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredWorkspaces.map((w) => (
                    <tr
                      key={w.client_id}
                      className="hover:bg-surface-2/60 transition-colors"
                    >
                      <td className="p-3.5">
                        <Link
                          href={`/platform-admin/tenants/${w.client_id}`}
                          className="font-semibold text-ink hover:text-brand transition-colors"
                        >
                          {w.name}
                        </Link>
                        <div className="text-[10px] font-mono text-muted mt-0.5">
                          {w.slug} · {w.status}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            w.drafting_on
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-subtle/10 text-muted border-subtle/20"
                          }`}
                        >
                          {w.drafting_on ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs">
                        {w.require_review ? (
                          <span className="text-muted">Required before posting</span>
                        ) : (
                          <span className="text-brand font-semibold">
                            Autopilot (Passing posts publish directly)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/platform-admin/tenants/${w.client_id}`}
                          className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line text-muted hover:text-ink text-[11px] font-medium transition-all"
                        >
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

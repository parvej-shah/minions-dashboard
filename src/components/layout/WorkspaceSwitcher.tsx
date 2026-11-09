"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronsUpDown, Check, Building2 } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import { useToast } from "@/hooks/useToast";
import type { Workspace } from "@/types";

/**
 * Only renders once a user belongs to more than one workspace (an agency
 * account) -- the common single-tenant case never shows this at all, per
 * the Phase 4.5 plan's explicit intent.
 */
export default function WorkspaceSwitcher() {
  const { update } = useSession();
  const { data: workspaces, isLoading } = useApiResource<Workspace[]>("/api/team/workspaces", []);
  const toast = useToast(4000);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (isLoading || workspaces.length <= 1) return null;

  const active = workspaces.find((w) => w.active) ?? workspaces[0];

  const switchTo = async (clientId: string) => {
    if (clientId === active.client_id) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      await apiClient.post("/api/team/switch-workspace", { client_id: clientId });
      await update().catch(() => {});
      // update()'s JWT refresh has proven unreliable in this NextAuth beta
      // (see auth.ts's own doc comment) -- a full reload guarantees every
      // server component and API call sees the new active workspace, which
      // router.push() (a client-side transition, no server refetch) would not.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not switch workspace"));
      setSwitching(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 text-sm text-ink transition-colors hover:bg-surface-3 disabled:opacity-60"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 shrink-0 text-muted" />
          <span className="truncate font-medium">{active.name}</span>
        </div>
        <ChevronsUpDown className="w-3.5 h-3.5 text-subtle shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 w-full overflow-hidden rounded-xl bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.12)]">
          {workspaces.map((w) => (
            <button
              key={w.client_id}
              onClick={() => switchTo(w.client_id)}
              className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 px-3 text-left text-sm transition-colors hover:bg-surface-2"
            >
              <span className="truncate text-ink">{w.name}</span>
              {w.client_id === active.client_id && <Check className="w-3.5 h-3.5 text-brand shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

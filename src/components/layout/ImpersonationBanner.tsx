"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Eye, X } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { apiClient } from "@/lib/api-client";

interface ImpersonationStatus {
  impersonating: boolean;
  client: { id: string; name: string } | null;
}

/**
 * Only fetches its status endpoint at all when the signed-in session is
 * SYSTEM_ADMIN -- every other user gets zero extra requests. Renders nothing
 * unless a platform-admin "view as tenant" session is actually active (see
 * /api/platform-admin/impersonate).
 */
export default function ImpersonationBanner() {
  const { data: session } = useSession();
  const isPlatformAdminRole = session?.user?.role === "SYSTEM_ADMIN";

  const { data } = useApiResource<ImpersonationStatus>(
    "/api/platform-admin/impersonate",
    { impersonating: false, client: null },
    { enabled: isPlatformAdminRole }
  );

  if (!isPlatformAdminRole || !data.impersonating || !data.client) return null;

  const stop = async () => {
    await apiClient.delete("/api/platform-admin/impersonate").catch(() => {});
    // Full reload, not router.push(): every server component under (dashboard)
    // needs to stop seeing the impersonation cookie on its next request.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/platform-admin");
  };

  return (
    <div className="bg-brand/10 border-b border-brand/30 px-4 sm:px-6 py-2.5 text-xs font-medium text-ink flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand/20 text-brand font-semibold text-[11px]">
          <Eye className="w-3 h-3" />
          <span>Support Session</span>
        </span>
        <span className="text-muted">
          Viewing workspace: <strong className="text-ink">{data.client.name}</strong>
        </span>
        <Link
          href={`/platform-admin/tenants/${data.client.id}`}
          className="text-brand hover:underline font-medium text-[11px]"
        >
          Manage tenant ↗
        </Link>
      </div>
      <button
        type="button"
        onClick={stop}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-2 border border-line text-ink text-xs font-semibold shadow-sm transition-all cursor-pointer"
      >
        <X className="w-3.5 h-3.5 text-muted" />
        <span>Exit session</span>
      </button>
    </div>
  );
}

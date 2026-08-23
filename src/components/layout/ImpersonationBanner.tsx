"use client";

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
    <div className="bg-[#8B5CF6]/20 border-b border-[#8B5CF6]/40 px-4 sm:px-6 py-2 text-xs font-medium text-[#8B5CF6] flex items-center justify-between">
      <span className="flex items-center gap-2">
        <Eye className="w-3.5 h-3.5" />
        Viewing as <strong>{data.client.name}</strong> (support session)
      </span>
      <button onClick={stop} className="flex items-center gap-1 hover:opacity-75 cursor-pointer">
        <X className="w-3.5 h-3.5" />
        <span>Stop</span>
      </button>
    </div>
  );
}

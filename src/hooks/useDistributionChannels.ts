"use client";

import { useCallback, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useApiResource } from "./useApiResource";
import type { DistributionChannelsPayload } from "@/types";

const EMPTY: DistributionChannelsPayload = {
  channels: [],
  summary: { blog: false, facebook: false, linkedin: false, x: false },
};

/**
 * Distribution channel toggles.
 *
 * The client-side fallback catalogue this used to carry is gone: the channel
 * list now has one definition (src/constants/channels.ts) which the API serves.
 */
export function useDistributionChannels() {
  const resource = useApiResource<DistributionChannelsPayload>("/api/channels", EMPTY, {
    errorMessage: "Could not load distribution channels",
  });
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toggleChannel = useCallback(
    async (channelId: string, isActive: boolean): Promise<boolean> => {
      setPendingId(channelId);
      try {
        await apiClient.patch("/api/channels", { id: channelId, is_active: isActive });
        await resource.reload();
        return true;
      } catch {
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [resource]
  );

  return { ...resource, pendingId, toggleChannel };
}

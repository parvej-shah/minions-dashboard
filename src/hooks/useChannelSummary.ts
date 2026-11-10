"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { DistributionChannelsPayload, DistributionChannelKey } from "@/types";

/**
 * Which distribution channels this tenant actually has switched on, for UI
 * that needs to adapt to it (e.g. Editorial Studio hiding blog-review chrome
 * for a LinkedIn-only tenant).
 *
 * Null (not yet loaded) is treated as "assume active" by callers so nothing
 * flashes hidden and then reappears once the real summary lands — the
 * inverse of the nav-count badges, which stay hidden until a real number
 * arrives because those are additive counts, not a set of on/off toggles a
 * user already configured.
 */
export function useChannelSummary(): Record<DistributionChannelKey, boolean> | null {
  return useChannelPayload()?.summary ?? null;
}

/** The whole /api/channels payload: the summary plus workspace defaults such as the Instagram format. */
export function useChannelPayload(): DistributionChannelsPayload | null {
  const [payload, setPayload] = useState<DistributionChannelsPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<DistributionChannelsPayload>("/api/channels")
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch(() => {
        // Leave null: callers assume every channel is active rather than
        // hiding review UI because of a transient fetch failure.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return payload;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { NavCounts } from "@/types";

/**
 * Sidebar badge counts, served by one endpoint. Counts stay null until loaded
 * so badges hide rather than showing a fake zero.
 */
export function useNavCounts() {
  const [counts, setCounts] = useState<NavCounts | null>(null);

  const load = useCallback(async () => {
    try {
      setCounts(await apiClient.get<NavCounts>("/api/nav-counts"));
    } catch {
      // Leave counts null: badges stay hidden rather than lying.
    }
  }, []);

  useEffect(() => {
    // Kicked off asynchronously so the effect body itself performs no
    // synchronous setState (which would cascade an extra render).
    const timer = setTimeout(load, 0);

    window.addEventListener("focus", load);
    window.addEventListener("minions-counts-updated", load);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener("minions-counts-updated", load);
    };
  }, [load]);

  return counts;
}

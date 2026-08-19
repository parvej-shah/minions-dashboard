"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient, toErrorMessage } from "@/lib/api-client";

export interface ApiResource<T> {
  data: T;
  /** True until the first load settles. Drives skeletons, never fabricated rows. */
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T>>;
}

/**
 * Loads a GET endpoint into component state, with explicit loading and error
 * states so a page can render "empty" honestly instead of seeding mock rows.
 */
export function useApiResource<T>(
  path: string,
  initialValue: T,
  options: { errorMessage?: string; enabled?: boolean } = {}
): ApiResource<T> {
  const { errorMessage = "Could not load data", enabled = true } = options;

  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  // Guards against a slow response overwriting state after unmount.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    if (!enabled) return;
    try {
      const next = await apiClient.get<T>(path);
      if (mounted.current) {
        setData(next);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) setError(toErrorMessage(err, errorMessage));
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [path, enabled, errorMessage]);

  useEffect(() => {
    // Deferred so the effect body performs no synchronous setState.
    const timer = setTimeout(reload, 0);
    return () => clearTimeout(timer);
  }, [reload]);

  return { data, isLoading, error, reload, setData };
}

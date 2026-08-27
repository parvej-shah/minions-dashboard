"use client";

import { useApiResource } from "@/hooks/useApiResource";
import type { BrandSettings } from "@/types";

export function useBrandSettings() {
  const { data, isLoading, error } = useApiResource<BrandSettings | null>("/api/brand", null, {
    errorMessage: "Could not load brand settings",
  });
  return { brandSettings: data, isLoading, error };
}

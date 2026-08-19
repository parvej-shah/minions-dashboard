"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copies text and flags which key was most recently copied, so a button can
 * show a "copied" affordance. Replaces three identical hand-rolled copies.
 */
export function useCopyToClipboard(resetAfterMs: number = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string, key: string) => {
      try {
        await navigator.clipboard.writeText(text);
        if (timer.current) clearTimeout(timer.current);
        setCopiedKey(key);
        timer.current = setTimeout(() => setCopiedKey(null), resetAfterMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetAfterMs]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { copiedKey, copy };
}

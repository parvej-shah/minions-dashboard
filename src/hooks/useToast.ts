"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A single transient status message.
 *
 * Replaces four separate `useState<string|null>` + `setTimeout` pairs
 * (`saveToast`, `toastMessage` x2, `notification`) that each re-implemented
 * this and none of which cleared their timer on unmount.
 */
export function useToast(defaultDurationMs: number = 2600) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(null);
  }, []);

  const show = useCallback(
    (text: string, durationMs: number = defaultDurationMs) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [defaultDurationMs]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { message, show, clear };
}

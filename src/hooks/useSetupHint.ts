"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { SetupHintField } from "@/lib/ai/setupHints";

/** One request per set of answers, kept for the visit, so Back and Continue don't ask again. */
const asked = new Map<string, Promise<string | null>>();

function ask(field: SetupHintField, contentFocus: string, audienceDescription: string): Promise<string | null> {
  const key = JSON.stringify([field, contentFocus, field === "story" ? audienceDescription : ""]);
  let hint = asked.get(key);
  if (!hint) {
    hint = apiClient
      .post<{ hint: string | null }>("/api/onboarding/setup-hints", { field, contentFocus, audienceDescription })
      .then((r) => r.hint ?? null)
      .catch(() => null);
    asked.set(key, hint);
  }
  return hint;
}

/**
 * The grey example for a setup box, written from the answers before it.
 * `fallback` shows until the example arrives, and stays if it doesn't.
 */
export function useSetupHint(field: SetupHintField, answers: { contentFocus: string; audienceDescription?: string }, fallback: string): string {
  const focus = answers.contentFocus.trim();
  const audience = answers.audienceDescription?.trim() ?? "";
  const [hint, setHint] = useState<{ key: string; text: string } | null>(null);
  const key = `${field}|${focus}|${audience}`;

  useEffect(() => {
    if (focus.length < 3) return;
    let live = true;
    void ask(field, focus, audience).then((text) => {
      if (live && text) setHint({ key, text });
    });
    return () => {
      live = false;
    };
  }, [field, focus, audience, key]);

  return hint?.key === key ? `e.g. ${hint.text}` : fallback;
}

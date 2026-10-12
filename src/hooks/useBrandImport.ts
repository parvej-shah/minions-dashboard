import { useCallback, useEffect, useRef, useState } from "react";
import { applyImportEvent, EMPTY_IMPORT, type BrandImport, type ImportEvent, type ImportStep } from "@/lib/brandImport/types";

export interface StepState {
  state: "waiting" | "active" | "done" | "skipped";
  detail?: string;
}

export interface FeedLine {
  id: number;
  text: string;
  from: string;
}

export type ImportStatus = "idle" | "reading" | "done" | "error";

const WAITING: Record<ImportStep, StepState> = {
  profile: { state: "waiting" },
  website: { state: "waiting" },
  voice: { state: "waiting" },
  audience: { state: "waiting" },
  experience: { state: "waiting" },
  proof: { state: "waiting" },
};

const FEED_MAX = 14;

/**
 * Runs one brand import against `endpoint` and exposes it as it streams in:
 * which steps are working, the lines being read, and everything found so far.
 */
export function useBrandImport(endpoint: string) {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [steps, setSteps] = useState(WAITING);
  const [feed, setFeed] = useState<FeedLine[]>([]);
  const [result, setResult] = useState<BrandImport>(EMPTY_IMPORT);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const lineId = useRef(0);

  useEffect(() => () => abort.current?.abort(), []);

  const handle = useCallback((event: ImportEvent) => {
    if (event.type === "step") {
      setSteps((prev) => ({ ...prev, [event.step]: { state: event.state, detail: event.detail } }));
    } else if (event.type === "glimpse") {
      setFeed((prev) => [...prev, { id: ++lineId.current, text: event.text, from: event.from }].slice(-FEED_MAX));
    } else if (event.type === "error") {
      setError(event.message);
      setStatus("error");
    } else if (event.type === "done") {
      setStatus("done");
    } else {
      setResult((prev) => applyImportEvent(prev, event));
    }
  }, []);

  const start = useCallback(
    async (input: { profileText: string; websiteUrl: string }) => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setStatus("reading");
      setSteps(WAITING);
      setFeed([]);
      setError(null);
      setResult({ ...EMPTY_IMPORT, websiteUrl: input.websiteUrl });

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_text: input.profileText, website_url: input.websiteUrl }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Request failed (HTTP ${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let ended = false;
        for (;;) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as ImportEvent;
            if (event.type === "done" || event.type === "error") ended = true;
            handle(event);
          }
          if (done) break;
        }
        if (!ended) throw new Error("The connection dropped before reading finished. Please try again.");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Couldn't read that. Please try again.");
        setStatus("error");
      }
    },
    [endpoint, handle]
  );

  const reset = useCallback(() => {
    abort.current?.abort();
    setStatus("idle");
    setSteps(WAITING);
    setFeed([]);
    setError(null);
    setResult(EMPTY_IMPORT);
  }, []);

  return { status, steps, feed, result, setResult, error, start, reset };
}

export type BrandImportRun = ReturnType<typeof useBrandImport>;

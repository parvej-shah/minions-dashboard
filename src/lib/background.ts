import { after } from "next/server";

/**
 * Work the response does not wait for. Runs after the response is sent where
 * Next allows it (so a serverless function is kept alive for it), otherwise
 * just starts it. A failure is logged, never thrown into the request.
 */
export function background(task: () => Promise<unknown>): void {
  const run = () => task().catch((e) => console.warn("[background]", e instanceof Error ? e.message : e));
  try {
    after(run);
  } catch {
    void run();
  }
}

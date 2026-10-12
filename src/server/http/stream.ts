/**
 * A response that sends one JSON object per line as work finishes, so the
 * browser can show each result the moment it exists. `run` emits events; an
 * error it throws becomes one last event from `onError`. Events emitted after
 * the browser has gone away are dropped.
 */
export function ndjsonResponse<E>(run: (emit: (event: E) => void) => Promise<void>, onError: (error: unknown) => E): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const emit = (event: E) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };
      try {
        await run(emit);
      } catch (error) {
        console.error("[stream] run failed:", error);
        emit(onError(error));
      } finally {
        if (open) controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" },
  });
}

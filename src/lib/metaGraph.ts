/**
 * One call to Meta's Graph API (Facebook Pages and Instagram). Same version as
 * n8n 03's Facebook nodes; Meta upgrades calls to a retired version itself.
 */
const BASE = "https://graph.facebook.com/v20.0/";

export type GraphCall = (path: string, params: Record<string, string>, method?: "GET" | "POST") => Promise<Record<string, unknown>>;

export const metaGraph: GraphCall = async (path, params, method = "POST") => {
  const query = new URLSearchParams(params);
  const res =
    method === "GET"
      ? await fetch(`${BASE}${path}?${query}`, { signal: AbortSignal.timeout(25_000) })
      : await fetch(`${BASE}${path}`, { method: "POST", body: query, signal: AbortSignal.timeout(25_000) });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string } };
  if (!res.ok || json.error) throw new Error(json.error?.message ?? `Meta Graph returned ${res.status}`);
  return json;
};

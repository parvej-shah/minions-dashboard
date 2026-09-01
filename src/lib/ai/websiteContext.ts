import { assertSafeFetchTarget } from "@/lib/ssrf-guard";

const FETCH_TIMEOUT_MS = 5000;
const MAX_BYTES = 500_000; // enough for a landing page's HTML, cheap to cap
const MAX_REDIRECTS = 2;
const SUMMARY_MAX_CHARS = 800;

export interface WebsiteContext {
  domain: string;
  summary: string;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function extractTag(html: string, pattern: RegExp): string | undefined {
  const match = html.match(pattern);
  return match?.[1]?.trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWithRedirects(startUrl: string): Promise<{ html: string; finalUrl: string } | null> {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = await assertSafeFetchTarget(current);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MinionsOnboardingBot/1.0)" },
      });

      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        current = new URL(res.headers.get("location")!, parsed).toString();
        continue;
      }
      if (!res.ok) return null;

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) return null;

      // Cap read size rather than trusting Content-Length, which the server can lie about.
      const reader = res.body?.getReader();
      if (!reader) return null;
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (received < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
        }
      }
      reader.cancel().catch(() => {});
      const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
      return { html, finalUrl: current };
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

/**
 * Fetches a company's own website and reduces it to a short, plain-text
 * summary (title + meta description + a snippet of visible body copy) for
 * grounding onboarding's AI suggestions in something real instead of just a
 * name. Best-effort only -- returns null on any failure (dead site, blocked
 * by SSRF guard, timeout, non-HTML response) so callers always have a safe
 * fallback and onboarding never blocks on a third party's uptime.
 */
export async function fetchWebsiteContext(rawUrl: string): Promise<WebsiteContext | null> {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  try {
    const fetched = await fetchWithRedirects(url);
    if (!fetched) return null;

    const { html, finalUrl } = fetched;
    const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractTag(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
    );
    const bodyMatch = html.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i);
    const bodyText = stripHtml(bodyMatch?.[1] || html);

    const parts = [title, description, bodyText].filter(Boolean);
    const summary = parts.join(" — ").slice(0, SUMMARY_MAX_CHARS);
    if (!summary) return null;

    return { domain: new URL(finalUrl).hostname.replace(/^www\./, ""), summary };
  } catch (e) {
    console.warn("[WebsiteContext] fetch failed:", e);
    return null;
  }
}

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

export interface WebsitePage {
  url: string;
  title: string;
  text: string;
}

export interface WebsiteRead {
  domain: string;
  pages: WebsitePage[];
}

const PAGE_TEXT_MAX_CHARS = 5000;
const MAX_EXTRA_PAGES = 4;
// The pages that say who a business serves, what it sells and what customers ask.
const USEFUL_PATH = /\/(about|company|team|services?|solutions?|products?|pricing|plans|faqs?|how-it-works|features|customers|case-stud|results|work|industr)/i;

function pageLinks(html: string, base: URL): string[] {
  const out: string[] = [];
  for (const match of html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)) {
    if (!URL.canParse(match[1], base)) continue;
    const link = new URL(match[1], base);
    if (link.hostname.replace(/^www\./, "") !== base.hostname.replace(/^www\./, "")) continue;
    if (!USEFUL_PATH.test(link.pathname) || /\.(pdf|png|jpe?g|svg|zip)$/i.test(link.pathname)) continue;
    link.search = "";
    link.hash = "";
    if (!out.includes(link.toString())) out.push(link.toString());
  }
  return out;
}

function toPage(html: string, finalUrl: string): WebsitePage {
  const title = stripHtml(extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? "");
  const description = extractTag(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ?? "";
  const main = html.match(/<main[\s\S]*?>([\s\S]*)<\/main>/i)?.[1] ?? html.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i)?.[1] ?? html;
  const body = stripHtml(main.replace(/<(nav|footer|header)[\s\S]*?<\/\1>/gi, " "));
  return { url: finalUrl, title, text: [description, body].filter(Boolean).join(" — ").slice(0, PAGE_TEXT_MAX_CHARS) };
}

async function readPage(url: string): Promise<{ page: WebsitePage; html: string } | null> {
  try {
    const fetched = await fetchWithRedirects(url);
    if (!fetched) return null;
    return { page: toPage(fetched.html, fetched.finalUrl), html: fetched.html };
  } catch (e) {
    console.warn("[WebsiteContext] page read failed:", url, e);
    return null;
  }
}

/**
 * Reads a site the way a new hire would skim it: the homepage, then up to
 * four of its about, services, pricing or FAQ pages, in parallel. Best-effort
 * like fetchWebsiteContext: null when even the homepage can't be read.
 */
export async function readWebsite(rawUrl: string): Promise<WebsiteRead | null> {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;
  const home = await readPage(url);
  if (!home) return null;

  const base = new URL(home.page.url);
  const extra = pageLinks(home.html, base).filter((link) => link !== home.page.url).slice(0, MAX_EXTRA_PAGES);
  const others = (await Promise.all(extra.map(readPage))).flatMap((read) => (read && read.page.text ? [read.page] : []));
  return { domain: base.hostname.replace(/^www\./, ""), pages: [home.page, ...others] };
}

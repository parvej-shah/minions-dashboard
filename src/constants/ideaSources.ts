/**
 * Tenant-configurable harvest sources.
 *
 * The harvester used to read four RSS URLs hardcoded in n8n -- Hacker News,
 * the n8n blog, TechCrunch AI, and a Google News query pinned to
 * "pest control HVAC plumbing" -- for every tenant regardless of industry.
 * That is a large part of why harvested ideas repeated: the same handful of
 * slow-moving feeds produced near-identical signals run after run.
 */
export type IdeaSourceKind = "RSS" | "GOOGLE_NEWS" | "REDDIT" | "SITEMAP";

export interface IdeaSourceItem {
  id: string;
  kind: IdeaSourceKind;
  label: string;
  url: string | null;
  query: string | null;
  max_items: number;
  is_active: boolean;
  last_error: string | null;
  last_fetched_at: string | null;
}

export interface IdeaSourceInput {
  kind: IdeaSourceKind;
  label: string;
  url?: string | null;
  query?: string | null;
  max_items?: number;
  is_active?: boolean;
}

export const IDEA_SOURCE_KINDS: {
  id: IdeaSourceKind;
  label: string;
  /** Whether the row is defined by a typed topic instead of a feed URL. */
  usesQuery: boolean;
  hint: string;
}[] = [
  { id: "RSS", label: "RSS feed", usesQuery: false, hint: "Any blog or publication feed URL." },
  { id: "GOOGLE_NEWS", label: "Google News topic", usesQuery: true, hint: "A search topic, e.g. \"commercial HVAC regulation\"." },
  { id: "REDDIT", label: "Subreddit", usesQuery: true, hint: "A subreddit name without r/, e.g. \"msp\"." },
  { id: "SITEMAP", label: "Competitor blog", usesQuery: false, hint: "A blog index or RSS URL to watch." },
];

/** Hard cap per source per run, so one noisy feed can't crowd out the rest. */
export const MAX_ITEMS_PER_SOURCE = 15;
export const MAX_SOURCES_PER_TENANT = 12;

/**
 * Builds the actual fetch URL for a source. GOOGLE_NEWS and REDDIT store a
 * human-typed topic rather than a composed feed URL, so the tenant edits
 * "commercial HVAC regulation" instead of a query string.
 */
export function resolveSourceFeedUrl(source: {
  kind: string;
  url?: string | null;
  query?: string | null;
}): string | null {
  const query = (source.query || "").trim();
  switch (source.kind) {
    case "GOOGLE_NEWS":
      if (!query) return null;
      return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    case "REDDIT":
      if (!query) return null;
      return `https://www.reddit.com/r/${encodeURIComponent(query.replace(/^r\//, ""))}/top/.rss?t=week`;
    default:
      return (source.url || "").trim() || null;
  }
}

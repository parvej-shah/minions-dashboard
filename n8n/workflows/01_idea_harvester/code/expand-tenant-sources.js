// One output item per active tenant source, so a single RSS Read node can
// fan out over feeds this tenant actually chose.
//
// The workflow previously had four hardcoded RSS nodes -- Hacker News, the
// n8n blog, TechCrunch AI, and a Google News query pinned to
// "pest control HVAC plumbing" -- shared by every tenant regardless of
// industry. That is a large part of why harvested ideas repeated: the same
// few slow-moving feeds produced near-identical signals run after run.
//
// idea_sources arrives from /api/brand/context, where the feed URL for a
// GOOGLE_NEWS or REDDIT source is already composed from the tenant's typed
// topic (see resolveSourceFeedUrl in src/constants/ideaSources.ts).

const brandContext = $('Fetch Brand Context').first()?.json || {};
const sources = Array.isArray(brandContext.idea_sources) ? brandContext.idea_sources : [];

// Fall back to the historical defaults if a tenant has no sources yet, so a
// missing configuration degrades to the old behavior rather than harvesting
// nothing at all.
const fallback = [
  { id: 'fallback-hn',  label: 'Hacker News',   feed_url: 'https://hnrss.org/newest?q=AI+OR+agent+OR+automation', max_items: 5 },
  { id: 'fallback-tc',  label: 'TechCrunch AI', feed_url: 'https://techcrunch.com/category/artificial-intelligence/feed/', max_items: 5 },
  { id: 'fallback-n8n', label: 'n8n Blog',      feed_url: 'https://blog.n8n.io/rss/', max_items: 3 }
];

const active = sources.filter(s => s && s.feed_url);
const chosen = active.length ? active : fallback;

return chosen.map(s => ({
  json: {
    source_id: s.id,
    source_label: s.label,
    feed_url: s.feed_url,
    max_items: s.max_items || 5
  }
}));

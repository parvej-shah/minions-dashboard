/**
 * Per-tenant topic labels, replacing the hardcoded `TargetTrade` union.
 *
 * `TargetTrade` was a fixed set -- HVAC, Plumbing, Electrical, Roofing, Pest
 * Control -- inherited from the original home-services product and baked into
 * the type system, the Idea Stream filter row, the inject form, and four other
 * components. Every tenant saw those five trades regardless of industry, so an
 * AI consultancy was asked to file its ideas under "Roofing".
 *
 * Topics now come from the tenant's own `core_themes` directive, which
 * onboarding already collects and stores. Nothing new is asked of the user.
 */

/**
 * Kept as a plain string alias so existing rows (and the legacy contractor
 * tenant's "HVAC" values) stay valid. The set is data now, not a type -- a
 * union here is exactly what made this un-tenantable.
 */
export type TopicLabel = string;

/** Shown when a tenant has no core_themes directive yet. */
export const FALLBACK_TOPICS: TopicLabel[] = ["Operations", "Strategy", "Technology"];

/** Cap so one over-long directive cannot flood the filter row. */
const MAX_TOPICS = 12;
const MAX_LABEL_LENGTH = 40;

/**
 * Splits a `core_themes` directive into topic labels.
 *
 * The directive is free text the operator typed, e.g.
 * "AI Agents & Workflows, MCP & Context Protocol, Multi-Agent Orchestration".
 * Split on commas and semicolons, and drop a trailing period so
 * "...Developer Productivity." does not become a label with punctuation.
 */
export function parseTopics(coreThemes: string | null | undefined): TopicLabel[] {
  if (!coreThemes) return [];

  const seen = new Set<string>();
  const topics: TopicLabel[] = [];

  for (const part of coreThemes.split(/[,;]/)) {
    const label = part.trim().replace(/\.$/, "").trim();
    if (!label || label.length > MAX_LABEL_LENGTH) continue;

    // Case-insensitive dedupe, but keep the operator's own capitalization.
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    topics.push(label);
    if (topics.length >= MAX_TOPICS) break;
  }

  return topics;
}

/**
 * The topic list to show this tenant: their own themes, plus any label already
 * stored on their ideas.
 *
 * Including stored values matters -- an idea harvested under a theme the
 * operator has since removed from `core_themes` would otherwise become
 * unfilterable and look like it had vanished from the stream.
 */
export function resolveTopics(
  coreThemes: string | null | undefined,
  usedLabels: readonly (string | null | undefined)[] = []
): TopicLabel[] {
  const fromThemes = parseTopics(coreThemes);
  const seen = new Set(fromThemes.map((t) => t.toLowerCase()));
  const extra: TopicLabel[] = [];

  for (const raw of usedLabels) {
    const label = (raw ?? "").trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    extra.push(label);
  }

  const resolved = [...fromThemes, ...extra];
  return resolved.length > 0 ? resolved : FALLBACK_TOPICS;
}

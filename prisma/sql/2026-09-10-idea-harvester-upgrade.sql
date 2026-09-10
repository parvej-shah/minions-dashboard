-- Idea harvester upgrade: tenant-configurable sources, "steal like an artist"
-- craft notes, semantic dedupe keys, and the audience expertise level.
--
-- Applied by hand via psql against DATABASE_URL -- `prisma db push`'s schema
-- engine hits a known pgbouncer transaction-pooling incompatibility
-- ("prepared statement \"s1\" already exists") against this project's pooled
-- connection string. Matches prisma/schema.prisma exactly -- keep both in
-- sync by hand.

-- 1. Audience expertise level, captured in onboarding and read by
--    /api/brand/context so the harvester and the writer calibrate depth and
--    jargon to the same level instead of each guessing.
--    PRACTITIONER | OPERATOR | EXECUTIVE.
ALTER TABLE brand_profile
  ADD COLUMN IF NOT EXISTS audience_expertise TEXT NOT NULL DEFAULT 'OPERATOR';

-- 2. Craft notes: the structural lesson taken from a source article (how it
--    opens, what evidence it leans on, how it closes) -- never its wording.
--    craft_source_url is the piece it was learned from, kept for attribution.
--    thesis_key is the normalized claim fingerprint used for cross-run
--    semantic dedupe.
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS craft_notes      TEXT,
  ADD COLUMN IF NOT EXISTS craft_source_url TEXT,
  ADD COLUMN IF NOT EXISTS thesis_key       TEXT;

CREATE INDEX IF NOT EXISTS ideas_client_thesis_idx ON ideas(client_id, thesis_key);

-- 3. Per-tenant harvest sources. Replaces the four RSS URLs hardcoded in
--    01_idea_harvester, which every tenant shared regardless of industry.
CREATE TABLE IF NOT EXISTS idea_sources (
  id              TEXT PRIMARY KEY,
  client_id       TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL DEFAULT 'RSS',
  label           TEXT NOT NULL,
  url             TEXT,
  query           TEXT,
  max_items       INTEGER NOT NULL DEFAULT 5,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_error      TEXT,
  last_fetched_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idea_sources_client_active_idx ON idea_sources(client_id, is_active);

-- 4. Backfill: give every existing tenant the four feeds the harvester used
--    to hardcode, so behavior is unchanged until they edit their sources.
--    The Google News feed is stored as a query so the UI can show a topic
--    rather than an opaque URL.
INSERT INTO idea_sources (id, client_id, kind, label, url, query, max_items)
SELECT
  'ISRC-' || c.id || '-' || s.slug,
  c.id,
  s.kind,
  s.label,
  s.url,
  s.query,
  s.max_items
FROM clients c
CROSS JOIN (
  VALUES
    ('hn',     'RSS',         'Hacker News',        'https://hnrss.org/frontpage', NULL, 5),
    ('tc',     'RSS',         'TechCrunch AI',      'https://techcrunch.com/category/artificial-intelligence/feed/', NULL, 5),
    ('n8n',    'RSS',         'n8n Blog',           'https://blog.n8n.io/rss/', NULL, 3),
    ('gnews',  'GOOGLE_NEWS', 'Industry News',      NULL, 'pest control HVAC plumbing business owner', 4)
) AS s(slug, kind, label, url, query, max_items)
ON CONFLICT (id) DO NOTHING;

-- Authority flywheel, phase 0 + phase 1 (docs/product/authority-flywheel-plan.md).
--
-- Applied by hand via psql, like every file in prisma/sql (prisma db push
-- trips over pgbouncer). Matches prisma/schema.prisma exactly; keep both in
-- sync by hand. Idempotent: safe to run twice.
--
-- ORDER MATTERS. Apply this BEFORE deploying the dashboard build that reads
-- these tables: /api/brand/context marks a missing table as degraded, and the
-- harvester refuses to run on degraded context.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-09-23-authority-foundation.sql

BEGIN;

-- 0. Tenant zero's values stop being every tenant's defaults. "HVAC" and
--    "Contractor Realities" were getminions.ai's trade and pillar; any row
--    written without one silently became a home-services idea. Existing rows
--    keep what they have.
ALTER TABLE ideas  ALTER COLUMN target_trade SET DEFAULT '', ALTER COLUMN pillar SET DEFAULT '';
ALTER TABLE assets ALTER COLUMN target_trade SET DEFAULT '', ALTER COLUMN pillar SET DEFAULT '';
ALTER TABLE blogs  ALTER COLUMN pillar SET DEFAULT '', ALTER COLUMN tags SET DEFAULT '{}';

-- 1. The one ICP a tenant writes for (D2). Structured so prompts can name a
--    specific pain or decision instead of paraphrasing a paragraph.
CREATE TABLE IF NOT EXISTS icp_profiles (
  id              TEXT PRIMARY KEY,
  client_id       TEXT NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  who             TEXT NOT NULL DEFAULT '',
  role            TEXT NOT NULL DEFAULT '',
  company_type    TEXT NOT NULL DEFAULT '',
  pains           TEXT[] NOT NULL DEFAULT '{}',
  decisions       TEXT[] NOT NULL DEFAULT '{}',
  questions       TEXT[] NOT NULL DEFAULT '{}',
  buying_triggers TEXT[] NOT NULL DEFAULT '{}',
  vocabulary      TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. What the author has actually lived. Ideas must rest on these (or on
--    approved proof) to pass the authority gate. There is no PRIVATE
--    disclosure: confidential material is never stored at all (D4).
CREATE TABLE IF NOT EXISTS professional_memories (
  id           TEXT PRIMARY KEY,
  client_id    TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('CURRENT_WORK','PAST_EXPERIENCE','OPINION','STORY','LESSON','ICP_QUESTION','EXPERIMENT','BUILD_IN_PUBLIC')),
  content      TEXT NOT NULL CHECK (length(btrim(content)) > 0),
  disclosure   TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (disclosure IN ('PUBLIC','GENERALIZE')),
  source       TEXT NOT NULL DEFAULT 'BRAND_PAGE' CHECK (source IN ('BRAND_PAGE','WEEKLY_PULSE','IMPORT','EDIT_LEARNING')),
  used_count   INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS professional_memories_client_active_idx ON professional_memories(client_id, is_active);

-- 3. Content lanes: WHAT a tenant publishes and WHY. Separate from an idea's
--    pillar, which stays the rhetorical angle (The Myth, The Stakes, ...)
--    that the strategist keys its hook off.
CREATE TABLE IF NOT EXISTS content_lanes (
  id             TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  purpose        TEXT NOT NULL DEFAULT 'AUTHORITY' CHECK (purpose IN ('AUTHORITY','CREDIBILITY','DEMAND')),
  brief          TEXT NOT NULL DEFAULT '',
  weight         INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 0),
  profile_target TEXT NOT NULL DEFAULT 'PERSONAL' CHECK (profile_target IN ('PERSONAL','COMPANY','BOTH')),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, name)
);

-- 4. Flywheel metadata on ideas. All nullable: nothing writes them until the
--    phase 3 harvester, and old rows never will.
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS source_type       TEXT,
  ADD COLUMN IF NOT EXISTS icp_problem       TEXT,
  ADD COLUMN IF NOT EXISTS reader_context    TEXT,
  ADD COLUMN IF NOT EXISTS author_advantage  TEXT,
  ADD COLUMN IF NOT EXISTS white_space       TEXT,
  ADD COLUMN IF NOT EXISTS fresh_perspective TEXT,
  ADD COLUMN IF NOT EXISTS vision            TEXT,
  ADD COLUMN IF NOT EXISTS trust_basis       TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS memory_ids        TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lane_id           TEXT REFERENCES content_lanes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profile_target    TEXT,
  ADD COLUMN IF NOT EXISTS gate_verdict      TEXT,
  ADD COLUMN IF NOT EXISTS gate_reasons      TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS score_breakdown   JSONB;
CREATE INDEX IF NOT EXISTS ideas_lane_idx ON ideas(lane_id);

-- 5. Same protection as every other table: RLS on, no policies. The dashboard
--    (Prisma, table owner) and n8n (service role) bypass it; the anon and
--    authenticated roles see nothing. Memory is the most private data a
--    tenant gives us, so it must never get the "public read" policy that
--    ideas/assets/brand_directives carry.
ALTER TABLE icp_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_lanes         ENABLE ROW LEVEL SECURITY;

-- 6. Seed default lanes for every tenant. Neutral on purpose; the Content Plan
--    (phase 7) is where a tenant tunes them.
INSERT INTO content_lanes (id, client_id, name, purpose, brief, weight, profile_target, sort_order)
SELECT 'LANE-' || c.id || '-' || l.slug, c.id, l.name, l.purpose, l.brief, l.weight, 'PERSONAL', l.sort_order
FROM clients c
CROSS JOIN (VALUES
  ('icp-problems',  'ICP Problems',          'AUTHORITY',   'A specific problem, question, or decision the ICP faces, and how to think about it.', 3, 1),
  ('field-lessons', 'Lessons From the Work', 'CREDIBILITY', 'What the author learned from real work: what failed, what changed, what they would do differently.', 2, 2),
  ('decisions',     'Decision Guides',       'DEMAND',      'Help the ICP choose between options, with the trade-offs named.', 1, 3),
  ('build-public',  'Build in Public',       'CREDIBILITY', 'What the author is building or testing right now, and what it taught them.', 0, 4)
) AS l(slug, name, purpose, brief, weight, sort_order)
ON CONFLICT (client_id, name) DO NOTHING;

-- 7. Seed each tenant's ICP from its active AUDIENCE directives, so the new
--    profile starts from what the tenant already wrote rather than empty.
INSERT INTO icp_profiles (id, client_id, who)
SELECT 'ICP-' || d.client_id, d.client_id, string_agg(d.instruction, ' ' ORDER BY d.priority, d.updated_at)
FROM brand_directives d
WHERE d.is_active AND d.category = 'AUDIENCE' AND d.client_id IS NOT NULL AND d.audience_scope IN ('ALL', 'ICP')
GROUP BY d.client_id
ON CONFLICT (client_id) DO NOTHING;

INSERT INTO icp_profiles (id, client_id)
SELECT 'ICP-' || c.id, c.id FROM clients c
ON CONFLICT (client_id) DO NOTHING;

-- 8. One ICP, no PEER/BRIDGE lanes (D14). Their directives are deactivated,
--    never deleted, so a tenant can review and re-scope them. Idea and asset
--    rows keep their old audience as history.
CREATE TEMP TABLE retired_audience_directives ON COMMIT DROP AS
SELECT id, client_id, audience_scope, category, left(instruction, 120) AS instruction
FROM brand_directives
WHERE is_active AND audience_scope IN ('PEER', 'BRIDGE');

UPDATE brand_directives SET is_active = false, updated_at = now()
WHERE id IN (SELECT id FROM retired_audience_directives);

SELECT 'retired ' || audience_scope || ' directive' AS change, client_id, id, category, instruction
FROM retired_audience_directives ORDER BY client_id;

COMMIT;

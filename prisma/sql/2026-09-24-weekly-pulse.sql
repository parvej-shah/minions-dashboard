-- Authority flywheel phase 6: the weekly question
-- (docs/product/authority-flywheel-plan.md).
--
-- Additive only. Apply BEFORE deploying the dashboard.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-09-24-weekly-pulse.sql

BEGIN;

-- One row per tenant per week (week_start is that week's Monday in the
-- tenant's timezone). No row: not asked yet. Nothing piles up: a week with
-- no visit simply has no row.
CREATE TABLE IF NOT EXISTS weekly_pulses (
  id            TEXT PRIMARY KEY,
  client_id     TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,
  -- EXTRACTED: answered, items proposed, not yet confirmed.
  status        TEXT NOT NULL CHECK (status IN ('SNOOZED','SKIPPED','EXTRACTED','ANSWERED')),
  snoozed_until TIMESTAMPTZ,
  answer        TEXT,
  -- The optional follow-ups: problem, who benefits, can it be named, evidence.
  followups     JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- The items proposed from the answer, kept so the confirm step survives a reload.
  candidates    JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- professional_memories saved from this answer.
  memory_ids    TEXT[] NOT NULL DEFAULT '{}',
  answered_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, week_start)
);

-- Same protection as every other table: RLS on, no policies. Only the
-- dashboard (as the table owner) reads and writes it.
ALTER TABLE weekly_pulses ENABLE ROW LEVEL SECURITY;

-- Per-tenant switch (the phase flag) and the day the question appears:
-- 1 = Monday ... 7 = Sunday; 5 = Friday by default.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pulse_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pulse_day SMALLINT NOT NULL DEFAULT 5 CHECK (pulse_day BETWEEN 1 AND 7);
-- Every tenant was created on the America/New_York default. Until the user
-- confirms their timezone, the dashboard offers the browser's.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS timezone_confirmed BOOLEAN NOT NULL DEFAULT false;

-- Verify: expect the table and three columns.
SELECT table_name, column_name FROM information_schema.columns
 WHERE table_schema = 'public'
   AND ((table_name = 'weekly_pulses' AND column_name = 'week_start')
     OR (table_name = 'clients' AND column_name IN ('pulse_enabled', 'pulse_day', 'timezone_confirmed')));

COMMIT;

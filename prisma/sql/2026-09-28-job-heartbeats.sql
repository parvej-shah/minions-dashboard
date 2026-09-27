-- One place to see which background jobs are running.
--
-- Each n8n job checks in when it calls the dashboard (or, for jobs that never
-- call it, through /api/internal/heartbeat). A check-in is what actually ran,
-- so the Automations page and Settings > Schedule read it, not a setting.
--
-- Also: "Schedule active" is retired as a separate switch. Automatic drafting
-- is the content plan's one switch (filler_enabled); is_active stays true so
-- the week preview always shows. Nothing drafts while filler_enabled is false.
--
-- Additive. Apply BEFORE deploying the dashboard.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-09-28-job-heartbeats.sql

BEGIN;

CREATE TABLE IF NOT EXISTS job_heartbeats (
  job          TEXT PRIMARY KEY,
  last_run_at  TIMESTAMPTZ NOT NULL,
  runs         INTEGER NOT NULL DEFAULT 1,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE job_heartbeats ENABLE ROW LEVEL SECURITY;

UPDATE posting_schedules SET is_active = true WHERE is_active = false AND filler_enabled = false;

COMMIT;

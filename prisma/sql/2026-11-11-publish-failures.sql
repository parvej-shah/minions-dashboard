-- Publish failures (task 42): which platform refused a post that otherwise went
-- out, and why, as { "linkedin": "reason", ... }. Shown in the dashboard.
--
-- Additive and nullable. Apply BEFORE deploying the dashboard (Prisma selects
-- this column) and BEFORE pushing n8n 03.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-11-11-publish-failures.sql

ALTER TABLE assets ADD COLUMN IF NOT EXISTS publish_failures jsonb;

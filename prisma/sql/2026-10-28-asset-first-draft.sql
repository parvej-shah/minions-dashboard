-- The text Minions wrote, kept the first time a reviewer changes it, so we can
-- measure how much authors rewrite before publishing (2026-10-28 research
-- follow-up). NULL until the first edit; never overwritten after.
--
-- first_content is the body; first_linkedin_variant is the LinkedIn text.
-- 03_review_publisher reads assets through `select=*` and ignores them.
--
-- Additive. Apply BEFORE deploying the dashboard.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-10-28-asset-first-draft.sql

BEGIN;

ALTER TABLE assets ADD COLUMN IF NOT EXISTS first_content TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS first_linkedin_variant TEXT;

COMMIT;

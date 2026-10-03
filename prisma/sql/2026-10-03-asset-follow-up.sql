-- A second LinkedIn post of a published draft, in the format the first one did
-- not use: its carousel after a cover post, or its cover after a carousel post.
--
-- follow_up_of is the original draft's id (one second post per draft);
-- follow_up_format is CAROUSEL or COVER. Both NULL on every other draft.
-- 03_review_publisher reads them through its `select=*` and ignores them.
--
-- Additive. Apply BEFORE deploying the dashboard.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-10-03-asset-follow-up.sql

BEGIN;

ALTER TABLE assets ADD COLUMN IF NOT EXISTS follow_up_of TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS follow_up_format TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS assets_follow_up_of_key ON assets (follow_up_of);

COMMIT;

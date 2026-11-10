-- Instagram publishing (task 39): the media id and time once n8n 03 has posted
-- a draft to the workspace's Instagram.
--
-- Additive and nullable. Apply BEFORE deploying the dashboard (Prisma selects
-- these columns) and BEFORE pushing n8n 03.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-11-10-instagram-publish.sql

ALTER TABLE assets ADD COLUMN IF NOT EXISTS instagram_post_id text;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS instagram_published_at timestamptz;

-- The Instagram caption (task 35), written by n8n 02 next to the Facebook one
-- and posted by hand until Instagram publishing exists.
--
-- Additive and nullable. Apply BEFORE deploying the dashboard and BEFORE
-- pushing n8n 02 (its Sync Asset to DB writes instagram_variant).
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-11-10-instagram-variant.sql

ALTER TABLE assets ADD COLUMN IF NOT EXISTS instagram_variant text;

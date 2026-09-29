-- Line icons as a cover illustration style: ICONS joins SHAPES, DOODLES and
-- NONE (docs/decisions/DECISIONS.md, 2026-09-29).
--
-- Widens a check constraint only. Safe to apply before or after the deploy:
-- until it is applied, saving "Line icons" as a workspace's default on the
-- Brand page fails; picking it for one cover in the Studio works either way.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-09-29-cover-art-icons.sql

BEGIN;

ALTER TABLE brand_profile DROP CONSTRAINT IF EXISTS brand_profile_cover_art_check;
ALTER TABLE brand_profile ADD CONSTRAINT brand_profile_cover_art_check CHECK (cover_art IN ('SHAPES', 'DOODLES', 'ICONS', 'NONE'));

COMMIT;

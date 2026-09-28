-- Carousels (phase 11, D19): a draft's LinkedIn document carousel.
--
-- carousel_spec holds the slide plan, the rendered slide images and PDF, and
-- `active`: whether LinkedIn gets the carousel instead of the cover image.
-- 03_review_publisher reads it through its `select=*`. NULL: no carousel.
--
-- Additive. Apply BEFORE deploying the dashboard and pushing 03.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-09-28-carousel-spec.sql

BEGIN;

ALTER TABLE assets ADD COLUMN IF NOT EXISTS carousel_spec JSONB;

COMMIT;

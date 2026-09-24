-- Authority flywheel phase 5: editorial covers drawn in code
-- (docs/product/authority-flywheel-plan.md).
--
-- Additive only. Apply BEFORE deploying the dashboard: the cover renderer
-- reads and writes these columns.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-09-24-covers.sql

BEGIN;

-- What a cover was drawn from (layout, copy, score, notes), so it can be
-- re-rendered or edited without a model call, and layouts can rotate and be
-- compared against impressions later.
ALTER TABLE assets ADD COLUMN IF NOT EXISTS cover_spec jsonb;

-- The author line under the name on every cover. Empty: the first sentence
-- of the positioning, when it is short enough.
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS cover_byline text;
-- The logo or headshot copied into our own storage (an imported LinkedIn
-- photo URL expires), and the URL it was copied from, so a changed logo is
-- copied again.
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS cover_photo_url text;
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS cover_photo_source text;

-- Verify: expect four rows.
SELECT table_name, column_name, data_type FROM information_schema.columns
 WHERE table_schema = 'public'
   AND ((table_name = 'assets' AND column_name = 'cover_spec')
     OR (table_name = 'brand_profile' AND column_name IN ('cover_byline', 'cover_photo_url', 'cover_photo_source')));

COMMIT;

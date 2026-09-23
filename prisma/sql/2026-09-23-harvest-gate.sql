-- Authority flywheel phase 3: the harvester rewrite
-- (docs/product/authority-flywheel-plan.md).
--
-- Additive only. Apply BEFORE deploying the dashboard: /api/brand/context
-- reads brand_profile.harvest_source_mix, and a missing column makes the
-- context degraded, which the harvester refuses to run on.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-09-23-harvest-gate.sql

BEGIN;

-- The format the harvester recommends for an idea: POST | ARTICLE.
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS recommended_format text;

-- Per-tenant override of the harvest source mix, e.g.
-- {"CURRENT_WORK":35,"EXPERIENCE":25,"ICP_QUESTION":20,"MARKET":15,"EXPERIMENTAL":5}.
-- NULL means the default in src/constants/sourceMix.ts.
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS harvest_source_mix jsonb;

-- Verify: expect two rows.
SELECT table_name, column_name, data_type FROM information_schema.columns
 WHERE table_schema = 'public'
   AND ((table_name = 'ideas' AND column_name = 'recommended_format')
     OR (table_name = 'brand_profile' AND column_name = 'harvest_source_mix'));

COMMIT;

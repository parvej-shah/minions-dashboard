-- Authority flywheel phase 4: strategist, writer and editor
-- (docs/product/authority-flywheel-plan.md).
--
-- Additive only. Apply BEFORE deploying the dashboard: the draft context and
-- draft check read these columns, and 02_idea_to_asset writes review_notes.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-09-24-draft-check.sql

BEGIN;

-- GENERALIZE items reach the drafting prompts only as a lesson-only rewrite,
-- computed once per edit and keyed by a hash of the content it came from.
ALTER TABLE professional_memories ADD COLUMN IF NOT EXISTS generalized_content text;
ALTER TABLE professional_memories ADD COLUMN IF NOT EXISTS generalized_source_hash text;

-- What the draft check found for the reviewer: why a draft is blocked or
-- needs review, and readability notes.
ALTER TABLE assets ADD COLUMN IF NOT EXISTS review_notes text[] NOT NULL DEFAULT '{}';

-- Verify: expect three rows.
SELECT table_name, column_name, data_type FROM information_schema.columns
 WHERE table_schema = 'public'
   AND ((table_name = 'professional_memories' AND column_name IN ('generalized_content', 'generalized_source_hash'))
     OR (table_name = 'assets' AND column_name = 'review_notes'));

COMMIT;

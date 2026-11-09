-- How the ICP buys (task 16): OUTCOME for business owners who buy the result,
-- TECHNICAL for buyers who want to know how it works. Every existing profile
-- becomes OUTCOME, which the user asked for (2026-11-09).
--
-- Additive. Apply BEFORE deploying the dashboard.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-11-09-icp-buyer.sql

BEGIN;

ALTER TABLE icp_profiles ADD COLUMN IF NOT EXISTS buyer TEXT NOT NULL DEFAULT 'OUTCOME';

COMMIT;

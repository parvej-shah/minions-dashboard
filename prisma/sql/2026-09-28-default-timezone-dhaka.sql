-- New workspaces default to Bangladesh time (the team's timezone).
-- Existing workspaces keep what they have; the two owned by the team were
-- moved to Asia/Dhaka by hand on 2026-09-28.
ALTER TABLE clients ALTER COLUMN timezone SET DEFAULT 'Asia/Dhaka';

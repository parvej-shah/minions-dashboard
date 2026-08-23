-- PostingSchedule: real per-tenant posting cadence engine config, one row per
-- client. Applied by hand via psql against DATABASE_URL -- `prisma db push`'s
-- schema engine hits a known pgbouncer transaction-pooling incompatibility
-- ("prepared statement \"s1\" already exists") against this project's pooled
-- connection string, and the direct (non-pooled) host on 5432 isn't reachable
-- from this environment. Matches prisma/schema.prisma's PostingSchedule model
-- exactly -- keep both in sync by hand.

CREATE TABLE IF NOT EXISTS posting_schedules (
  id             TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  cadence_type   TEXT NOT NULL DEFAULT 'EVERY_N_DAYS',
  interval_days  INTEGER,
  days_of_week   INTEGER[] NOT NULL DEFAULT '{}',
  posts_per_day  INTEGER NOT NULL DEFAULT 1,
  times_of_day   TEXT[] NOT NULL DEFAULT ARRAY['09:00'],
  require_review BOOLEAN NOT NULL DEFAULT true,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  last_run_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posting_schedules_client_id_idx ON posting_schedules(client_id);

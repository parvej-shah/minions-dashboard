-- ClientMembership: Phase 4.5 (workspace switcher + team invites).
-- Applied by hand via psql against DATABASE_URL -- `prisma db push`'s schema
-- engine hits a known pgbouncer transaction-pooling incompatibility
-- ("prepared statement \"s1\" already exists") against this project's
-- pooled connection string, and the direct (non-pooled) host on 5432 isn't
-- reachable from this environment. Matches prisma/schema.prisma's
-- ClientMembership model exactly -- keep both in sync by hand.

CREATE TABLE IF NOT EXISTS client_memberships (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  client_id   TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'MEMBER',
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT client_memberships_email_client_id_key UNIQUE (email, client_id)
);

CREATE INDEX IF NOT EXISTS client_memberships_user_id_idx ON client_memberships(user_id);
CREATE INDEX IF NOT EXISTS client_memberships_client_id_idx ON client_memberships(client_id);

-- Cover templates (task 93): designs a workspace pastes in, one row per saved
-- version. Additive: a new table, no existing table is touched, so it can be
-- applied before or after the dashboard deploys (only the new routes read it).
-- Apply with the owner's OK:
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-11-19-cover-templates.sql

CREATE TABLE IF NOT EXISTS cover_templates (
  id            text PRIMARY KEY,
  client_id     text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_key  text NOT NULL,
  version       integer NOT NULL,
  name          text NOT NULL,
  source_html   text NOT NULL,
  slots         text[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'ACTIVE',
  preview_svg   text,
  created_by    text,
  created_at    timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cover_templates_key_version_uq UNIQUE (template_key, version),
  CONSTRAINT cover_templates_status_ck CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  CONSTRAINT cover_templates_size_ck CHECK (octet_length(source_html) <= 204800)
);

CREATE INDEX IF NOT EXISTS cover_templates_client_status_idx ON cover_templates (client_id, status);

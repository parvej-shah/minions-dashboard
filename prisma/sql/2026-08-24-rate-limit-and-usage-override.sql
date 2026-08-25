-- RateLimitHit: fixed-window request counter, keyed by an opaque bucket string
-- (a hash of a webhook secret, or a client IP) -- backs src/lib/rate-limit.ts.
-- Postgres-backed rather than in-memory because this app runs as multiple
-- serverless instances with no shared process memory; a DB upsert is correct
-- regardless of instance count. Rows are short-lived (one per bucket per
-- window) -- no cleanup job yet, acceptable at current volume, revisit if the
-- table grows unexpectedly.
--
-- Client.assets_per_month_override: a maintainer-set manual usage-cap override,
-- independent of Subscription/Stripe (Subscription.stripe_customer_id is
-- required/unique, so no Subscription row exists without a real Stripe
-- customer -- this column lets platform staff raise/lower a tenant's cap with
-- no billing system involved at all). NULL = use the plan default.
--
-- Applied by hand via psql -- see 2026-08-24-posting-schedule.sql's note on
-- why `prisma db push` doesn't work against this project's pooled connection.
-- Matches prisma/schema.prisma exactly -- keep both in sync by hand.

CREATE TABLE IF NOT EXISTS rate_limit_hits (
  bucket_key   TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket_key, window_start)
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS assets_per_month_override INTEGER;

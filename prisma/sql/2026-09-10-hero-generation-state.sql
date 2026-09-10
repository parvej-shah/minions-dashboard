-- Make image generation outcomes observable. A provider rejection must never
-- be disguised as an externally generated fallback image.
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS hero_status text NOT NULL DEFAULT 'READY',
  ADD COLUMN IF NOT EXISTS hero_error_code text,
  ADD COLUMN IF NOT EXISTS hero_provider text,
  ADD COLUMN IF NOT EXISTS hero_attempts integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assets_hero_status_check'
  ) THEN
    ALTER TABLE assets
      ADD CONSTRAINT assets_hero_status_check
      CHECK (hero_status IN ('READY', 'BLOCKED_BY_SAFETY', 'FAILED'));
  END IF;
END $$;

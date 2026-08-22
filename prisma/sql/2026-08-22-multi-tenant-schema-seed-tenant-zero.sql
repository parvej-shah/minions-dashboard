BEGIN;

INSERT INTO clients (id, slug, name, status, timezone)
VALUES ('tenant-zero-getminions-ai', 'getminions-ai', 'getminions.ai', 'ACTIVE', 'America/New_York')
ON CONFLICT (id) DO NOTHING;

UPDATE ideas             SET client_id = 'tenant-zero-getminions-ai' WHERE client_id IS NULL;
UPDATE assets            SET client_id = 'tenant-zero-getminions-ai' WHERE client_id IS NULL;
UPDATE blogs             SET client_id = 'tenant-zero-getminions-ai' WHERE client_id IS NULL;
UPDATE brand_directives  SET client_id = 'tenant-zero-getminions-ai' WHERE client_id IS NULL;
UPDATE brand_profile     SET client_id = 'tenant-zero-getminions-ai' WHERE client_id IS NULL;

COMMIT;

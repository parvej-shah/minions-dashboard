-- Security lockdown (found 2026-09-23 while building the authority flywheel).
--
-- Applied by hand via psql like every file in prisma/sql. Idempotent. Nothing
-- in the dashboard, n8n or the getminions.ai site depends on what this removes:
-- the dashboard reads through Prisma (table owner), n8n and the site through
-- the service role, and all three bypass RLS.
--
--   psql "${DATABASE_URL%%\?*}" -v ON_ERROR_STOP=1 -f prisma/sql/2026-09-23-security-lockdown.sql

BEGIN;

-- 1. "Public read" policies (USING true) let anyone holding the public anon
--    key -- which ships in browser bundles -- read EVERY workspace's ideas,
--    drafts, claims and brand rules. Nothing reads these tables as anon.
DROP POLICY IF EXISTS "Allow public read on ideas"            ON ideas;
DROP POLICY IF EXISTS "Allow public read on assets"           ON assets;
DROP POLICY IF EXISTS "Allow public read on claims"           ON claims;
DROP POLICY IF EXISTS "Allow public read on brand_directives" ON brand_directives;

-- 2. blogs stays publicly readable (it is getminions.ai's public blog), but
--    only for getminions.ai's own published posts. The table also holds every
--    other workspace's record of what it published.
DROP POLICY IF EXISTS "Allow public read access to blogs" ON blogs;
DROP POLICY IF EXISTS "Public read of getminions.ai posts" ON blogs;
CREATE POLICY "Public read of getminions.ai posts" ON blogs
  FOR SELECT TO anon, authenticated
  USING (client_id = 'tenant-zero-getminions-ai' AND published_at IS NOT NULL);

-- 3. The vault RPCs are SECURITY DEFINER and read/write channel secrets
--    (LinkedIn/Facebook tokens). 2026-08-22-vault-credential-rpcs.sql revoked
--    EXECUTE from PUBLIC, but Supabase grants anon and authenticated
--    explicitly, so both stayed callable through /rest/v1/rpc with the public
--    key. Only the service role may call them.
REVOKE EXECUTE ON FUNCTION public.create_channel_secret(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_channel_secret(uuid)          FROM anon, authenticated;

-- 4. ...and stop the next function from being born callable by anon.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- 5. Every workspace's published posts were signed "Co-Founder, Minions.AI"
--    (src/services/publishing.ts assigned a Minions founder to all of them).
--    Re-credit them to their own brand, as new posts now are.
UPDATE blogs b
SET author = jsonb_build_object(
      'name',   COALESCE(NULLIF(bp.brand_name, ''), 'Editorial') || ' Team',
      'role',   'Editorial Team',
      'avatar', COALESCE(bp.primary_logo_url, '')),
    updated_at = now()
FROM brand_profile bp
WHERE bp.client_id = b.client_id
  AND b.client_id <> 'tenant-zero-getminions-ai'
  AND b.author->>'role' = 'Co-Founder, Minions.AI';

-- Verify: expect no USING-true policies, no anon EXECUTE, no foreign founder bylines.
SELECT 'policy' AS kind, tablename AS name, policyname AS detail FROM pg_policies
 WHERE schemaname = 'public' AND qual = 'true'
UNION ALL
SELECT 'anon-exec', p.proname, array_to_string(p.proacl, ',') FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname LIKE '%channel_secret%'
   AND (array_to_string(p.proacl, ',') LIKE '%anon=%' OR array_to_string(p.proacl, ',') LIKE '%authenticated=%')
UNION ALL
SELECT 'foreign-founder-byline', slug, client_id FROM blogs
 WHERE client_id <> 'tenant-zero-getminions-ai' AND author->>'role' = 'Co-Founder, Minions.AI';

COMMIT;

-- One idea -> at most one asset.
--
-- Why a database constraint and not an application check: the n8n workflow
-- `02_idea_to_asset` writes the asset row directly to PostgREST
-- (POST /rest/v1/assets?on_conflict=id) with the Supabase service-role key. It
-- never passes through this app, so nothing in TypeScript can stop it. With this
-- index in place a duplicate insert fails with 23505 and the run errors loudly
-- instead of quietly producing a second article for the same idea.
--
-- NULL idea_id is unconstrained: Postgres permits any number of NULLs in a
-- unique index, so assets created without an idea are unaffected.

-- 1. Pre-flight. This MUST return zero rows before the index can be created.
--    Any row listed is an idea that already has more than one asset.
SELECT idea_id, count(*) AS asset_count, array_agg(id ORDER BY created_at) AS asset_ids
FROM assets
WHERE idea_id IS NOT NULL
GROUP BY idea_id
HAVING count(*) > 1;

-- 2. Create the index. CONCURRENTLY keeps the table writable while it builds;
--    it cannot run inside a transaction block, so run this statement on its own.
--    Deliberately NOT a partial index: a plain unique index already permits any
--    number of NULLs, and it is what `@@unique([ideaId])` in schema.prisma maps
--    to, so `prisma db pull` will not report drift.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS assets_idea_id_key
  ON assets (idea_id);

-- 3. Verify.
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'assets' AND indexname = 'assets_idea_id_key';

-- Retargets the "Industry News" harvest source to each tenant's own industry.
--
-- The previous migration backfilled every tenant with the four feeds
-- 01_idea_harvester used to hardcode, to keep behavior unchanged. One of those
-- was a Google News query pinned to "pest control HVAC plumbing business
-- owner" -- correct only for a home-services brand, and actively harmful for
-- everyone else: an AI/developer-tools tenant was harvesting pest-control news
-- and then being asked to write relevant ideas from it.
--
-- The industry is already recorded, as the "Industry: <x>. Target Audience:..."
-- prefix the onboarding setup route writes into the icp_description directive.
-- This derives the topic from that, and deactivates the source where no
-- industry is recorded rather than leaving an irrelevant feed running.

-- 1. Review before applying.
SELECT c.name AS client,
       s.query AS current_topic,
       btrim(split_part(split_part(d.instruction, 'Industry: ', 2), '.', 1)) AS derived_topic
FROM idea_sources s
JOIN clients c ON c.id = s.client_id
LEFT JOIN brand_directives d
       ON d.client_id = s.client_id AND d.rule_key = 'icp_description'
WHERE s.kind = 'GOOGLE_NEWS'
  AND s.query = 'pest control HVAC plumbing business owner';

-- 2. Point the source at the tenant's real industry.
UPDATE idea_sources s
   SET query = btrim(split_part(split_part(d.instruction, 'Industry: ', 2), '.', 1)),
       last_error = NULL
  FROM brand_directives d
 WHERE d.client_id = s.client_id
   AND d.rule_key = 'icp_description'
   AND s.kind = 'GOOGLE_NEWS'
   AND s.query = 'pest control HVAC plumbing business owner'
   AND btrim(split_part(split_part(d.instruction, 'Industry: ', 2), '.', 1)) <> '';

-- 3. Where no industry is recorded, switch the source off instead of
--    harvesting pest-control news into an unrelated brand. The operator can
--    re-enable it with a real topic in Brand > Idea Sources.
UPDATE idea_sources
   SET is_active = false
 WHERE kind = 'GOOGLE_NEWS'
   AND query = 'pest control HVAC plumbing business owner';

-- 4. Confirm nothing is left on the hardcoded topic and active.
SELECT c.name, s.query, s.is_active
FROM idea_sources s JOIN clients c ON c.id = s.client_id
WHERE s.kind = 'GOOGLE_NEWS'
ORDER BY c.name;

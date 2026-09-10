-- Repairs tenants stuck on the auto-generated "<email-local-part>'s Workspace"
-- placeholder.
--
-- getOrCreateTenant() seeds that name when a user first signs in, because a
-- Client row must exist before onboarding has asked for anything. The
-- onboarding wizard collected the real business name but never sent it, so
-- the placeholder persisted into BrandProfile.brand_name and from there into
-- /api/brand/context's company_name -- which is what every generated cover
-- image printed ("bsse1610's Workspace").
--
-- The code fix (onboarding now sends business_name, and Brand > Positioning
-- can edit it) stops this happening again; this repairs rows already written.
-- Run once, by hand, after reviewing the SELECT below.

-- 1. Review what would change before changing it.
SELECT c.id, c.name AS current_name, u.name AS proposed_name
FROM clients c
JOIN users u ON u.client_id = c.id
WHERE c.name LIKE '%''s Workspace'
  AND u.name IS NOT NULL
  AND btrim(u.name) <> '';

-- 2. Promote the owning user's real name onto the placeholder tenants.
--    Only rows still matching the placeholder shape are touched, so a tenant
--    that already chose a real name is never renamed.
UPDATE clients c
   SET name = u.name
  FROM users u
 WHERE u.client_id = c.id
   AND c.name LIKE '%''s Workspace'
   AND u.name IS NOT NULL
   AND btrim(u.name) <> '';

-- 3. Bring brand_profile.brand_name back in step with the repaired client name.
UPDATE brand_profile b
   SET brand_name = c.name
  FROM clients c
 WHERE b.client_id = c.id
   AND b.brand_name LIKE '%''s Workspace';

-- 4. Confirm nothing is left on a placeholder.
SELECT id, name FROM clients WHERE name LIKE '%''s Workspace';
SELECT client_id, brand_name FROM brand_profile WHERE brand_name LIKE '%''s Workspace';

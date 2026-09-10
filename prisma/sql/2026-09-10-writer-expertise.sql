-- Re-point the expertise field from the READER to the AUTHOR.
--
-- Applied by hand via psql against DATABASE_URL -- `prisma db push`'s schema
-- engine hits a known pgbouncer transaction-pooling incompatibility
-- ("prepared statement \"s1\" already exists") against this project's pooled
-- connection string. Matches prisma/schema.prisma exactly -- keep both in
-- sync by hand.
--
-- brand_profile.audience_expertise asked "how much does your audience already
-- know?" That question was redundant: the reader is already described, in far
-- more detail, by the positioning and ICP directives collected in the same
-- onboarding step. Worse, its coarse 3-way answer sat in the prompt directly
-- contradicting the industry preset's audience lanes -- e.g. the
-- ai_tech_builders lane says "software engineers and technical founders"
-- while an OPERATOR answer said "not specialist, aim for the reader who has
-- to choose or oversee, not personally build".
--
-- What nothing else in the system captured is what the AUTHOR is entitled to
-- claim. That is what the column now holds. It governs EVIDENCE and STANCE
-- (may this draft say "in my experience"? may it deliver a verdict?), never
-- reading level, which stays with the audience directives. The two axes are
-- deliberately orthogonal so "beginner writing for specialists" stays
-- expressible -- the single old axis could not represent it.

-- 1. Rename the column. Value semantics are remapped in step 2 BEFORE the new
--    default is attached, so no row is left holding a same-spelled value that
--    now means something different.
ALTER TABLE brand_profile
  RENAME COLUMN audience_expertise TO writer_expertise;

-- 2. Remap old reader levels to author levels.
--
--    CRITICAL: 'PRACTITIONER' exists in BOTH enums with different meanings.
--    Old = "the READER does this work daily"; new = "the AUTHOR works in this
--    field hands-on". A plain rename would silently retain those rows as a
--    valid-looking but unrelated value, so every row is rewritten explicitly
--    rather than relying on which strings happen to overlap.
--
--    No old value carries information about the author, so there is nothing to
--    preserve: all rows land on the new default. This is a deliberate reset,
--    not a best-effort mapping -- inferring "this person is an expert" from
--    "their readers are experts" is exactly the conflation being removed here.
--    PRACTITIONER is the safe landing spot: it permits first-person claims
--    about the author's own work but forbids invented clients and metrics, so
--    a mis-set tenant understates rather than fabricates.
UPDATE brand_profile
  SET writer_expertise = 'PRACTITIONER'
  WHERE writer_expertise IN ('PRACTITIONER', 'OPERATOR', 'EXECUTIVE')
     OR writer_expertise IS NULL;

-- 3. Move the column default off the old reader level ('OPERATOR', which is
--    not a valid author level) and onto the new one.
ALTER TABLE brand_profile
  ALTER COLUMN writer_expertise SET DEFAULT 'PRACTITIONER';

-- 4. Backstop: anything that somehow still holds a non-author value (an older
--    app instance writing during the deploy window) lands on the default.
UPDATE brand_profile
  SET writer_expertise = 'PRACTITIONER'
  WHERE writer_expertise NOT IN ('EXPLORER', 'PRACTITIONER', 'AUTHORITY');

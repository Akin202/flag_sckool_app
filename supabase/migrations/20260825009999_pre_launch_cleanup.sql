-- =============================================================================
-- PRE-LAUNCH CLEANUP — deliberately inert.
--
-- This project becomes production. scripts/seed-test-data.ts writes fake
-- students, transactions, enrollments, progress and discount codes into it so
-- the admin screens have something to render during the build.
--
-- Every one of those accounts lives at @flagskool.test. This migration deletes
-- them. It is written now, while the shape of the test data is fresh, because
-- "remember to clean up the fake students" is exactly the thing that gets
-- forgotten between here and launch day.
--
-- TODO(handoff): before going live, uncomment the block below, verify the
-- SELECT count first, then apply. Deleting from auth.users cascades to
-- profiles, and from there to enrollments, transactions, lesson_progress and
-- comments.
--
-- Check what would be removed BEFORE uncommenting:
--   select email from auth.users where email like '%@flagskool.test';
-- =============================================================================

-- delete from auth.users where email like '%@flagskool.test';
--
-- delete from public.discount_codes
--  where code in ('ALUMNI50', 'EARLY25', 'INVITE100', 'SAVE20K');

-- Intentionally a no-op until the block above is uncommitted.
select 1;

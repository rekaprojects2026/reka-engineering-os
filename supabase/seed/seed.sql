-- =============================================================
-- Seed: example admin profile
-- Stage 01
--
-- IMPORTANT: You must create the auth user in Supabase Dashboard
-- BEFORE running this seed, OR the handle_new_user() trigger
-- will auto-create the profile row on first sign-in.
--
-- If the trigger is active, this seed is optional.
-- Use it only to manually set the role to 'admin' after signing in.
-- =============================================================

-- After the auth user exists, promote to admin:
-- Replace the UUID below with the actual user UUID from auth.users.

/*
update public.profiles
set
  full_name  = 'Agency Owner',
  role       = 'admin',
  discipline = 'mechanical',
  is_active  = true
where email = 'owner@youragency.com';
*/

-- To verify:
-- select id, full_name, email, role from public.profiles;

-- Remove public email lookup RPC (SECURITY DEFINER + anon EXECUTE).
-- Server-side auth uses SUPABASE_SERVICE_ROLE_KEY for profile lookups instead.

drop function if exists public.lookup_profile_by_email(text);

-- Resolve Supabase database linter security warnings, except Auth leaked password protection.
--
-- This migration addresses:
--   1. function_search_path_mutable for the remaining public helper/trigger functions.
--   2. public_bucket_allows_listing for royaltymeds_storage by removing broad SELECT policies.
--   3. anon/authenticated SECURITY DEFINER RPC exposure by revoking EXECUTE from client roles.
--
-- Leaked password protection is an Auth setting and is intentionally not changed here.

-- -----------------------------------------------------------------------------
-- 1. Pin function search paths so functions do not inherit caller/role search_path.
-- -----------------------------------------------------------------------------
ALTER FUNCTION IF EXISTS public.set_collect_shipping_after_payment()
  SET search_path = public, pg_temp;

ALTER FUNCTION IF EXISTS public.update_restock_notification_settings_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION IF EXISTS public.current_user_id()
  SET search_path = public, pg_temp;

ALTER FUNCTION IF EXISTS public.current_user_role()
  SET search_path = public, pg_temp;

ALTER FUNCTION IF EXISTS public.current_user_role_from_jwt()
  SET search_path = public, pg_temp;

-- -----------------------------------------------------------------------------
-- 2. Remove broad SELECT policies from the public storage bucket.
--
-- Public buckets do not require a storage.objects SELECT policy for public object
-- URL access. Keeping broad SELECT policies allows clients to list object names.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_permissive" ON storage.objects;
DROP POLICY IF EXISTS "storage_read_all" ON storage.objects;

-- -----------------------------------------------------------------------------
-- 3. Prevent anon/authenticated roles from invoking SECURITY DEFINER functions as
--    exposed RPC endpoints.
--
-- REVOKE FROM PUBLIC removes PostgreSQL's default EXECUTE grant so anon and
-- authenticated do not regain access through PUBLIC membership. service_role is
-- retained for privileged server-side jobs and admin backend calls.
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.audit_log_action(uuid, text, text, uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_log_action(uuid, text, text, uuid, jsonb)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.can_refill_prescription(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_refill_prescription(uuid)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_sessions()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions()
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.expire_completed_sales()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_completed_sales()
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.expire_old_refill_requests()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_old_refill_requests()
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_conversations_with_latest_message(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversations_with_latest_message(uuid)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_monthly_transaction_summary(uuid, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_transaction_summary(uuid, integer, integer)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_transaction_stats(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_transaction_stats(integer)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user()
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.mark_conversation_as_read(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_as_read(uuid, uuid)
  TO service_role;

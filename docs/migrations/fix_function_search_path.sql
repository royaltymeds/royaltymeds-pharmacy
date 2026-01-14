-- Fix for Supabase Advisor: Function Search Path Mutable
-- Adds explicit search_path to cleanup_expired_sessions function
-- This prevents the function from using a mutable search path which is a security risk

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.sessions
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.cleanup_expired_sessions() IS 'Cleanup function for expired session tokens. Must run periodically to maintain database hygiene.';

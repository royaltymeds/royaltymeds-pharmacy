-- Create sessions table for Netlify-friendly session persistence
-- This table stores session tokens to avoid relying solely on cookies
-- which can be lost across serverless function invocations on Netlify

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);

-- Index for token lookups (for session validation)
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);

-- Index for cleanup queries (expired sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all sessions
CREATE POLICY "Service role manages sessions"
  ON public.sessions
  USING (current_setting('role') = 'authenticated' OR current_user = 'service_role');

-- Function to cleanup expired sessions (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.sessions
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for clarity
COMMENT ON TABLE public.sessions IS 'Stores session tokens for Netlify compatibility. Provides session persistence across serverless function invocations.';
COMMENT ON COLUMN public.sessions.token IS 'Unique session token generated at login, can be used as Authorization header fallback';
COMMENT ON COLUMN public.sessions.access_token IS 'Supabase JWT access token (for reference)';
COMMENT ON COLUMN public.sessions.refresh_token IS 'Supabase refresh token (for reference)';
COMMENT ON COLUMN public.sessions.expires_at IS 'Session expiration time (typically 1 hour from login)';

-- Fix for remaining Supabase Advisor warning: Auth RLS Initialization Plan
-- The auth.uid() call still needs to be wrapped in a subquery to prevent re-evaluation per row

-- Drop and recreate the policy with proper subquery wrapping
DROP POLICY IF EXISTS "Manage sessions with optimized auth check" ON public.sessions;

-- Create policy with auth.uid() wrapped in subquery for optimal performance
CREATE POLICY "Manage sessions with optimized auth check"
  ON public.sessions
  USING (
    (select auth.uid()) = user_id  -- Wrapped in subquery to prevent per-row re-evaluation
    OR (select current_setting('role') = 'authenticated' OR current_user = 'service_role')
  )
  WITH CHECK (
    (select current_setting('role') = 'authenticated' OR current_user = 'service_role')
  );

COMMENT ON POLICY "Manage sessions with optimized auth check" ON public.sessions IS 'Optimized RLS policy with auth.uid() wrapped in subquery for O(1) performance per query';

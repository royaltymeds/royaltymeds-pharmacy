-- Fix: Complete RLS policy optimization with proper subquery wrapping
-- Both auth.uid() and current_user must be wrapped in SELECT for optimal performance

DROP POLICY IF EXISTS "Manage sessions with optimized auth check" ON public.sessions;

-- Fully optimized policy with all function calls wrapped in subqueries
CREATE POLICY "Manage sessions with optimized auth check"
  ON public.sessions
  USING (
    (select auth.uid()) = user_id  -- auth.uid() in subquery
    OR (select current_user = 'service_role')  -- current_user in subquery
  )
  WITH CHECK (
    (select current_user = 'service_role')  -- current_user in subquery
  );

COMMENT ON POLICY "Manage sessions with optimized auth check" ON public.sessions IS 'Fully optimized RLS policy with all function calls wrapped in subqueries for O(1) performance';

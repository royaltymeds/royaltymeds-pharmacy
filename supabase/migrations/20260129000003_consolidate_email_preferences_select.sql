-- Consolidate email_preferences SELECT policies
-- Merge email_preferences_admin_all and email_preferences_user_own into single policy
-- Date: January 29, 2026

DROP POLICY IF EXISTS "email_preferences_admin_all" ON email_preferences;
DROP POLICY IF EXISTS "email_preferences_user_own" ON email_preferences;

-- Single consolidated SELECT policy covering both user self-access and admin access
CREATE POLICY email_preferences_select ON email_preferences
  FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- Separate INSERT/UPDATE/DELETE policy for users managing their own preferences
CREATE POLICY email_preferences_user_modify ON email_preferences
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "email_preferences_user_own" ON email_preferences;

CREATE POLICY email_preferences_update ON email_preferences
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY email_preferences_delete ON email_preferences
  FOR DELETE
  USING (user_id = (select auth.uid()));

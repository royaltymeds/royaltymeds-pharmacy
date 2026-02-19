-- Fix Auth RLS Initplan Performance Warnings
-- Optimize auth.uid() calls in RLS policies by using subqueries
-- Also consolidate duplicate email_preferences policies
-- Date: January 29, 2026

-- 1. Fix refill_requests policies
DROP POLICY IF EXISTS "patients_view_own_refill_requests" ON refill_requests;
CREATE POLICY patients_view_own_refill_requests ON refill_requests
  FOR SELECT
  USING (patient_id = (select auth.uid()));

DROP POLICY IF EXISTS "patients_create_refill_requests" ON refill_requests;
CREATE POLICY patients_create_refill_requests ON refill_requests
  FOR INSERT
  WITH CHECK (patient_id = (select auth.uid()));

-- 2. Fix transactions policies
DROP POLICY IF EXISTS "transactions_patient_select" ON transactions;
CREATE POLICY transactions_patient_select ON transactions
  FOR SELECT
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "transactions_admin_insert" ON transactions;
CREATE POLICY transactions_admin_insert ON transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "transactions_admin_update" ON transactions;
CREATE POLICY transactions_admin_update ON transactions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- 3. Fix email_templates policy
DROP POLICY IF EXISTS "email_templates_admin_all" ON email_templates;
CREATE POLICY email_templates_admin_all ON email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'pharmacist')
    )
  );

-- 4. Fix email_logs policy
DROP POLICY IF EXISTS "email_logs_admin_all" ON email_logs;
CREATE POLICY email_logs_admin_all ON email_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role IN ('admin', 'pharmacist')
    )
  );

-- 5. Fix email_preferences policies - consolidate duplicates
DROP POLICY IF EXISTS "Users can manage their preferences" ON email_preferences;
DROP POLICY IF EXISTS "email_preferences_user_self" ON email_preferences;
DROP POLICY IF EXISTS "email_preferences_admin_select" ON email_preferences;

-- Single consolidated policy for users managing their own preferences
CREATE POLICY email_preferences_user_own ON email_preferences
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Separate policy for admins to view all
CREATE POLICY email_preferences_admin_all ON email_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- 6. Fix conversations policies
DROP POLICY IF EXISTS "conversations_user_select" ON conversations;
CREATE POLICY conversations_user_select ON conversations
  FOR SELECT
  USING ((select auth.uid()) = ANY(participant_ids));

DROP POLICY IF EXISTS "conversations_user_insert" ON conversations;
CREATE POLICY conversations_user_insert ON conversations
  FOR INSERT
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "conversations_user_update" ON conversations;
CREATE POLICY conversations_user_update ON conversations
  FOR UPDATE
  USING ((select auth.uid()) = ANY(participant_ids))
  WITH CHECK ((select auth.uid()) = ANY(participant_ids));

-- 7. Fix messages policies
DROP POLICY IF EXISTS "messages_user_select" ON messages;
CREATE POLICY messages_user_select ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (select auth.uid()) = ANY(conversations.participant_ids)
    )
  );

DROP POLICY IF EXISTS "messages_user_insert" ON messages;
CREATE POLICY messages_user_insert ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (select auth.uid()) = ANY(conversations.participant_ids)
    )
  );

DROP POLICY IF EXISTS "messages_user_update" ON messages;
CREATE POLICY messages_user_update ON messages
  FOR UPDATE
  USING (sender_id = (select auth.uid()))
  WITH CHECK (sender_id = (select auth.uid()));

-- 8. Fix message_reads policies
DROP POLICY IF EXISTS "message_reads_user_select" ON message_reads;
CREATE POLICY message_reads_user_select ON message_reads
  FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_reads.message_id
      AND messages.sender_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "message_reads_user_insert" ON message_reads;
CREATE POLICY message_reads_user_insert ON message_reads
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

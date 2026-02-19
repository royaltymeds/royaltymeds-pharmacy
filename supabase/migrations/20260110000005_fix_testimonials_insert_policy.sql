-- Fix overly permissive RLS policy on testimonials
-- Users can only insert testimonials for themselves or as anonymous (no patient_id)

DROP POLICY IF EXISTS "Users can insert testimonials" ON testimonials;

CREATE POLICY "Users can insert testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (
    -- Allow anonymous testimonials (no patient_id)
    patient_id IS NULL 
    -- Or allow authenticated users to submit as themselves
    OR patient_id::text = current_user_id()
  );

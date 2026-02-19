-- Add index for unindexed foreign key on testimonials.patient_id
-- Fixes Supabase Advisor performance issue: foreign key without covering index

CREATE INDEX idx_testimonials_patient_id ON testimonials(patient_id);

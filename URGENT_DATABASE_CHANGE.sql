-- ============================================================================
-- IMMEDIATE ACTION REQUIRED: Run this SQL in Supabase Dashboard
-- ============================================================================
-- 
-- Issue: Doctor prescription submissions fail with NOT NULL constraint error
-- Solution: Make patient_id column nullable in doctor_prescriptions table
--
-- Timeline: This must be done before doctors can submit prescriptions
-- ============================================================================

-- Execute this SQL in Supabase SQL Editor:
-- https://supabase.com → Your Project → SQL Editor → New Query → Paste Below

ALTER TABLE doctor_prescriptions 
ALTER COLUMN patient_id DROP NOT NULL;

-- Expected result: "ALTER TABLE" (in green)
-- 
-- After running, doctors can submit prescriptions without selecting a patient.
-- The prescription will have patient_id = NULL until an admin links a patient.

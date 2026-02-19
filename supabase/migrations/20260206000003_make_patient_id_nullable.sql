-- Migration: Make doctor_prescriptions columns nullable
-- Date: 2026-02-06
-- Description: Allow doctor_prescriptions to be created with only file and notes.
-- Doctors no longer provide: patient_id, duration, instructions
-- Admins will add these later via the admin portal.

ALTER TABLE doctor_prescriptions 
ALTER COLUMN patient_id DROP NOT NULL;

ALTER TABLE doctor_prescriptions 
ALTER COLUMN duration DROP NOT NULL;

ALTER TABLE doctor_prescriptions 
ALTER COLUMN instructions DROP NOT NULL;

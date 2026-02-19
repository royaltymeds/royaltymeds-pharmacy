-- Migration: Make duration and instructions nullable
-- Date: 2026-02-06 (part 2)

ALTER TABLE doctor_prescriptions 
ALTER COLUMN duration DROP NOT NULL;

ALTER TABLE doctor_prescriptions 
ALTER COLUMN instructions DROP NOT NULL;
